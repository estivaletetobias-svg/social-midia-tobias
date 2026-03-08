import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// @ts-ignore
import nodeFetch from 'node-fetch';
// @ts-ignore
import { fetchTranscript } from 'youtube-transcript-plus';

export async function POST(req: Request) {
    try {
        const { url, title, tags, type } = await req.json();

        const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (!videoIdMatch) {
            return NextResponse.json({ error: 'Insira um link válido do YouTube' }, { status: 400 });
        }
        const videoId = videoIdMatch[1];
        let videoTitle = title;

        // NEW STEALTH UI: Mimicking a Mobile iPhone for better resilience
        const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';

        console.log(`[YouTube Alpha] Starting manual extraction for ${videoId}...`);

        try {
            // 1. Fetch the mobile video page
            const videoUrl = `https://m.youtube.com/watch?v=${videoId}`;
            const response = await nodeFetch(videoUrl, {
                headers: {
                    'User-Agent': MOBILE_UA,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Cache-Control': 'no-cache',
                    'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+999'
                }
            });

            if (!response.ok) throw new Error(`YouTube returned status ${response.status}`);

            const html = await response.text();

            // Extract Title manually if needed
            if (!videoTitle || videoTitle === "Transcrição YT Temporária") {
                const titleMatch = html.match(/<title>(.*?)<\/title>/i);
                if (titleMatch) videoTitle = titleMatch[1].replace(' - YouTube', '').trim();
            }

            const brand = await prisma.brandProfile.findFirst();
            if (!brand) return NextResponse.json({ error: 'DNA não configurado.' }, { status: 400 });

            // 2. Find the Caption Track URL
            // YouTube stores this in a JSON object inside the HTML
            const regex = /"captionTracks":\s*(\[.*?\])/;
            const match = html.match(regex);

            if (!match) {
                // Try alternate regex for different YouTube versions
                const altRegex = /captionTracks\\":\s*(\[.*?\])/;
                const altMatch = html.match(altRegex);
                if (!altMatch) {
                    throw new Error('Não foi possível localizar o rastro de legendas. Verifique se o vídeo tem legendas habilitadas.');
                }
                // Fix escaped quotes if using altRegex
                const tracksJson = JSON.parse(altMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
                return await fetchAndParseCaptions(tracksJson, videoId, videoTitle, tags, type, brand.id);
            }

            const tracks = JSON.parse(match[1]);
            return await fetchAndParseCaptions(tracks, videoId, videoTitle, tags, type, brand.id);

        } catch (scrapeErr: any) {
            console.error("Youtube Alpha Manual Error:", scrapeErr.message);
            return NextResponse.json({
                error: `O YouTube bloqueou a leitura temporária desse vídeo. (${scrapeErr.message})`,
                videoId
            }, { status: 400 });
        }
    } catch (e: any) {
        console.error('YouTube Global Error:', e);
        return NextResponse.json({ error: `Falha crítica no motor de busca: ${e.message}` }, { status: 500 });
    }
}

/**
 * Helper to fetch the actual XML/JSON captions and save to DB
 */
async function fetchAndParseCaptions(tracks: any[], videoId: string, videoTitle: string, tags: string, type: string, brandId: string) {
    // Prioritize Portuguese, then English, then whatever is first
    const track = tracks.find((t: any) => t.languageCode === 'pt') ||
        tracks.find((t: any) => t.languageCode === 'en') ||
        tracks[0];

    if (!track || !track.baseUrl) {
        return NextResponse.json({ error: 'Nenhuma legenda disponível para extração.' }, { status: 400 });
    }

    const res = await nodeFetch(track.baseUrl + '&fmt=json3'); // Fetch in JSON format for easier parsing
    if (!res.ok) throw new Error('Falha ao baixar arquivo de legenda do Google.');

    const data = await res.json();

    // Extract text from the YouTube caption format
    const fullText = data.events
        .filter((e: any) => e.segs)
        .map((e: any) => e.segs.map((s: any) => s.utf8).join(''))
        .join(' ')
        .replace(/\n/g, ' ')
        .trim();

    if (!fullText) {
        return NextResponse.json({ error: 'Legenda vazia ou protegida.' }, { status: 400 });
    }

    // Save to DB
    const knowledgeItem = await prisma.knowledgeItem.create({
        data: {
            brandProfileId: brandId,
            title: videoTitle || 'Transcrição de Vídeo YouTube',
            content: `(Extraído via Alpha Scraper: https://youtube.com/watch?v=${videoId})\n\n${fullText}`,
            type: type || 'Vídeo Transcrito',
            tags: tags ? tags.split(',').map((t: string) => t.trim()) : ['YOUTUBE', 'VÍDEO']
        }
    });

    return NextResponse.json({ success: true, item: knowledgeItem });
}
// trigger rebuild

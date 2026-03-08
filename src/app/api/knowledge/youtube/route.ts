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
        const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

        async function tryScrape(ua: string, useEmbed = false) {
            const videoUrl = useEmbed
                ? `https://www.youtube.com/embed/${videoId}`
                : `https://www.youtube.com/watch?v=${videoId}`;

            const response = await nodeFetch(videoUrl, {
                headers: {
                    'User-Agent': ua,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+999'
                }
            });

            const html = await response.text();

            // Check for obvious blocks
            if (html.includes('recaptcha') || html.includes('captcha') || html.includes('robot')) {
                return null;
            }

            let tracks = [];

            // 1. Modern ytInitialPlayerResponse
            const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*({[\s\S]+?});/);
            if (playerMatch) {
                try {
                    const data = JSON.parse(playerMatch[1]);
                    tracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
                } catch (e) { }
            }

            // 2. Embedded Config (common in embed page)
            if (tracks.length === 0) {
                const configMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
                if (configMatch) {
                    try { tracks = JSON.parse(configMatch[1]); } catch (e) { }
                }
            }

            // 3. Escaped captionTracks
            if (tracks.length === 0) {
                const escapedMatch = html.match(/captionTracks\\":\s*(\[.*?\])/);
                if (escapedMatch) {
                    try {
                        const trackStr = escapedMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                        tracks = JSON.parse(trackStr);
                    } catch (e) { }
                }
            }

            return { tracks, html };
        }

        console.log(`[YouTube Alpha] Starting manual extraction for ${videoId}...`);

        try {
            // Priority 1: Mobile (Fast & Loose)
            let result = await tryScrape(MOBILE_UA);

            // Priority 2: Desktop (Formal)
            if (!result || result.tracks.length === 0) {
                console.log("[YouTube Alpha] Mobile failed, trying Desktop...");
                result = await tryScrape(CHROME_UA);
            }

            // Priority 3: Embed (Fallback)
            if (!result || result.tracks.length === 0) {
                console.log("[YouTube Alpha] Desktop failed, trying Embed...");
                result = await tryScrape(CHROME_UA, true);
            }

            if (!result || result.tracks.length === 0) {
                throw new Error('Não foi possível localizar o rastro de legendas. Verifique se o vídeo tem legendas (CC) e tente novamente.');
            }

            const { tracks, html } = result;

            // Extract Title if missing
            if ((!videoTitle || videoTitle === "Transcrição YT Temporária") && html) {
                const titleMatch = html.match(/<title>(.*?)<\/title>/i);
                if (titleMatch) videoTitle = titleMatch[1].replace(' - YouTube', '').trim();
            }

            const brand = await prisma.brandProfile.findFirst();
            if (!brand) return NextResponse.json({ error: 'DNA não configurado.' }, { status: 400 });

            return await fetchAndParseCaptions(tracks, videoId, videoTitle, tags, type, brand.id);

        } catch (scrapeErr: any) {
            console.error("Youtube Alpha Manual Error:", scrapeErr.message);
            return NextResponse.json({
                error: `O YouTube bloqueou a leitura temporária desse vídeo ou ele não possui legendas. (${scrapeErr.message})`,
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

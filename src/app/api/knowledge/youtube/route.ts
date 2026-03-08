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

            // Try to find the JSON regardless of bot detection (sometimes it's just partially blocked)
            let tracks = [];

            // 1. Modern ytInitialPlayerResponse (Best way)
            const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*({[\s\S]+?});/);
            if (playerMatch) {
                try {
                    const data = JSON.parse(playerMatch[1]);
                    tracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
                } catch (e) { }
            }

            // 2. Fallbacks for tracks
            if (tracks.length === 0) {
                const configMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
                if (configMatch) try { tracks = JSON.parse(configMatch[1]); } catch (e) { }
            }

            return { tracks, html };
        }

        console.log(`[YouTube Alpha ☢️] Reactor started for ${videoId}...`);

        try {
            const brand = await prisma.brandProfile.findFirst();
            if (!brand) return NextResponse.json({ error: 'DNA não configurado.' }, { status: 400 });

            let result = { tracks: [], html: '' };

            // TIER 1: INTERNAL STEALTH SCRAPE (Mobile & Desktop)
            result = await tryScrape(MOBILE_UA);
            if (!result || result.tracks.length === 0) {
                console.log("[YouTube Tier-1] Mobile failed, trying Desktop...");
                result = await tryScrape(CHROME_UA);
            }
            if (!result || result.tracks.length === 0) {
                console.log("[YouTube Tier-1] Desktop failed, trying Embed...");
                result = await tryScrape(CHROME_UA, true);
            }

            // Extract Title if missing from Tier 1 HTML
            if ((!videoTitle || videoTitle === "Transcrição YT Temporária") && result.html) {
                const titleMatch = result.html.match(/<title>(.*?)<\/title>/i);
                if (titleMatch) videoTitle = titleMatch[1].replace(' - YouTube', '').trim();
            }

            // If Tier 1 was successful, process it
            if (result && result.tracks.length > 0) {
                console.log("[YouTube Tier-1] Success via internal scrape!");
                return await fetchAndParseCaptions(result.tracks, videoId, videoTitle, tags, type, brand.id);
            }

            // TIER 2: INVIDIOUS API FALLBACK (The Resilient Stack)
            console.log("[YouTube Tier-2 🛡️] Direct scrape failed, switching to Invidious Instance (yewtu.be)...");
            const invidiousTracks = await tryInvidious(videoId);
            if (invidiousTracks && invidiousTracks.length > 0) {
                console.log("[YouTube Tier-2] Success via Invidious!");
                return await fetchAndParseCaptions(invidiousTracks, videoId, videoTitle || "Vídeo YT", tags, type, brand.id);
            }

            // FINAL CHECK AND RESPONSE
            throw new Error('Não foi possível localizar o rastro de legendas em nenhuma camada. Verifique se o vídeo possui legendas (CC) no YouTube.');

        } catch (scrapeErr: any) {
            console.error("YouTube Alpha Critical Failure:", scrapeErr.message);
            return NextResponse.json({
                error: `Ops! O YouTube barrou nosso acesso temporário ou o vídeo não tem legendas. (${scrapeErr.message})`,
                videoId
            }, { status: 400 });
        }
    } catch (e: any) {
        console.error('YouTube Global Error:', e);
        return NextResponse.json({ error: `Falha total no sistema: ${e.message}` }, { status: 500 });
    }
}

/**
 * TIER 2 HELPER: Try to fetch captions from a public Invidious instance
 */
async function tryInvidious(videoId: string) {
    try {
        const response = await nodeFetch(`https://yewtu.be/api/v1/captions/${videoId}`);
        if (!response.ok) return null;
        const data = await response.json();
        if (data && data.captions && data.captions.length > 0) {
            // Map Invidious format to our caption format
            return data.captions.map((c: any) => ({
                baseUrl: `https://yewtu.be/api/v1/captions/${videoId}?label=${encodeURIComponent(c.label)}`,
                languageCode: c.label.toLowerCase().includes('portug') ? 'pt' : (c.label.toLowerCase().includes('english') ? 'en' : 'unknown'),
                label: { simpleText: c.label }
            }));
        }
    } catch (e) {
        console.warn("[Tier-2] Invidious fallback failed.");
    }
    return null;
}

/**
 * HELPER: Fetch, Parse and Save
 */
async function fetchAndParseCaptions(tracks: any[], videoId: string, videoTitle: string, tags: string, type: string, brandId: string) {
    const track = tracks.find((t: any) => t.languageCode === 'pt' || (t.label?.simpleText && t.label.simpleText.toLowerCase().includes('portug'))) ||
        tracks.find((t: any) => t.languageCode === 'en' || (t.label?.simpleText && t.label.simpleText.toLowerCase().includes('ingl'))) ||
        tracks[0];

    if (!track || !track.baseUrl) throw new Error('Legenda encontrada mas link de download inválido.');

    const res = await nodeFetch(track.baseUrl + (track.baseUrl.includes('?') ? '&' : '?') + 'fmt=json3');
    if (!res.ok) throw new Error('O arquivo de legenda está inacessível no momento.');

    const data = await res.json();

    // Check if it's Invidious format or YouTube format
    let fullText = "";
    if (data.events) {
        // YouTube format
        fullText = data.events.filter((e: any) => e.segs).map((e: any) => e.segs.map((s: any) => s.utf8).join('')).join(' ');
    } else if (Array.isArray(data)) {
        // Invidious often yields different formats, handle simple join if needed (Invidious usually just returns VTT/SRT unless requested differently)
        // But fmt=json3 on yewtu.be often matches YouTube
        fullText = data.map((item: any) => item.text || '').join(' ');
    }

    fullText = fullText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (!fullText) throw new Error('O texto da legenda retornou vazio.');

    // Save to DB
    const knowledgeItem = await prisma.knowledgeItem.create({
        data: {
            brandProfileId: brandId,
            title: videoTitle || 'Mídia YouTube Capturada',
            content: `(Extraído via Alpha Reactor: https://youtube.com/watch?v=${videoId})\n\n${fullText}`,
            type: type || 'Conteúdo YT',
            tags: tags ? tags.split(',').map((t: string) => t.trim()) : ['YOUTUBE', 'AUTO-CAPTURA']
        }
    });

    return NextResponse.json({ success: true, item: knowledgeItem });
}
// trigger rebuild

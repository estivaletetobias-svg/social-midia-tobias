import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// @ts-ignore
import nodeFetch from 'node-fetch';

/**
 * YouTube Caption Extractor - High Resilience Stack
 * Tier 1: Stealth Scrape (Mobile/Embed)
 * Tier 2: Public Invidious Mirror
 */

const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function tryScrape(videoId: string, ua: string, useEmbed = false) {
    const videoUrl = useEmbed
        ? `https://www.youtube.com/embed/${videoId}`
        : `https://www.youtube.com/watch?v=${videoId}`;

    try {
        const response = await nodeFetch(videoUrl, {
            headers: {
                'User-Agent': ua,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+999'
            },
            timeout: 10000
        });

        if (!response.ok) return { tracks: [], html: '' };
        const html = await response.text();

        let tracks = [];

        // 1. Modern ytInitialPlayerResponse
        const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*({[\s\S]+?});/);
        if (playerMatch) {
            try {
                const data = JSON.parse(playerMatch[1]);
                tracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
            } catch (e) { }
        }

        // 2. captionTracks fallback
        if (tracks.length === 0) {
            const configMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
            if (configMatch) {
                try { tracks = JSON.parse(configMatch[1]); } catch (e) { }
            }
        }

        // 3. Raw 'timedtext' URL fallback (Hail Mary)
        if (tracks.length === 0) {
            const timedTextRegex = /"https:\/\/www\.youtube\.com\/api\/timedtext\?.*?"/g;
            const matches = html.match(timedTextRegex);
            if (matches) {
                const url = matches[0].replace(/"/g, '').replace(/\\u0026/g, '&');
                tracks = [{ baseUrl: url, languageCode: 'pt', kind: 'asr' }];
            }
        }

        return { tracks, html };
    } catch (e) {
        return { tracks: [], html: '' };
    }
}

async function tryInvidious(videoId: string) {
    const instances = [
        'https://yewtu.be',
        'https://vid.puffyan.us',
        'https://invidious.snopyta.org'
    ];

    for (const instance of instances) {
        try {
            const res = await nodeFetch(`${instance}/api/v1/captions/${videoId}`, { timeout: 6000 });
            if (!res.ok) continue;
            const data = await res.json();
            if (data.captions && data.captions.length > 0) {
                return data.captions.map((c: any) => ({
                    baseUrl: `${instance}/api/v1/captions/${videoId}?label=${encodeURIComponent(c.label)}`,
                    languageCode: c.label.toLowerCase().includes('portug') ? 'pt' : (c.label.toLowerCase().includes('eng') ? 'en' : 'auto'),
                    label: { simpleText: c.label }
                }));
            }
        } catch (e) {
            continue;
        }
    }
    return null;
}

export async function POST(req: Request) {
    try {
        const { url, title, tags, type } = await req.json();

        // Extract Video ID
        const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (!videoIdMatch) {
            return NextResponse.json({ error: 'Link inválido' }, { status: 400 });
        }
        const videoId = videoIdMatch[1];
        let videoTitle = title;

        const brand = await prisma.brandProfile.findFirst();
        if (!brand) return NextResponse.json({ error: 'DNA não configurado' }, { status: 400 });

        console.log(`[YouTube Alpha ☢️] Reactor started for ${videoId}`);

        // TIER 1: INTERNAL STEALTH
        let result = await tryScrape(videoId, MOBILE_UA);
        if (result.tracks.length === 0) result = await tryScrape(videoId, CHROME_UA);
        if (result.tracks.length === 0) result = await tryScrape(videoId, CHROME_UA, true);

        let tracks = result.tracks;

        // TIER 2: INVIDIOUS FALLBACK
        if (tracks.length === 0) {
            console.log("[YouTube Alpha] Tier 1 failed, trying Invidious...");
            const invTracks = await tryInvidious(videoId);
            if (invTracks) tracks = invTracks;
        }

        if (tracks.length === 0) {
            return NextResponse.json({
                error: 'O YouTube barrou o acesso ou o vídeo não tem legendas habilitadas.',
                videoId
            }, { status: 400 });
        }

        // Process title from HTML if missing
        if ((!videoTitle || videoTitle === "Transcrição YT Temporária") && result.html) {
            const titleMatch = result.html.match(/<title>(.*?)<\/title>/i);
            if (titleMatch) videoTitle = titleMatch[1].replace(' - YouTube', '').trim();
        }

        // Fetch actual caption content
        // Target: Manual Portuguese -> Auto-Generated Portuguese -> English -> First available
        const track = tracks.find((t: any) => t.languageCode === 'pt' && t.kind !== 'asr') ||
            tracks.find((t: any) => t.languageCode === 'pt') ||
            tracks.find((t: any) => t.languageCode === 'en') ||
            tracks[0];

        let captionUrl = track.baseUrl;
        if (!captionUrl.includes('fmt=json3')) {
            captionUrl += (captionUrl.includes('?') ? '&' : '?') + 'fmt=json3';
        }

        const captionRes = await nodeFetch(captionUrl, { timeout: 10000 });
        if (!captionRes.ok) throw new Error('O arquivo de legenda está inacessível no momento.');

        const captionData = await captionRes.json();
        let fullText = "";

        if (captionData.events) {
            fullText = captionData.events
                .filter((e: any) => e.segs)
                .map((e: any) => e.segs.map((s: any) => s.utf8).join(''))
                .join(' ');
        } else if (Array.isArray(captionData)) {
            fullText = captionData.map((s: any) => s.text || '').join(' ');
        }

        fullText = fullText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

        if (!fullText) throw new Error('A legenda retornou vazia ou está corrompida.');

        // Save to Database
        const knowledgeItem = await prisma.knowledgeItem.create({
            data: {
                brandProfileId: brand.id,
                title: videoTitle || 'Mídia YouTube Capturada',
                content: `(Extraído via Alpha Reactor ☢️: https://youtube.com/watch?v=${videoId})\n\n${fullText}`,
                type: type || 'Conteúdo YT',
                tags: tags ? tags.split(',').map((t: string) => t.trim()) : ['YOUTUBE', 'AUTO-CAPTURA']
            }
        });

        return NextResponse.json({ success: true, item: knowledgeItem });

    } catch (e: any) {
        console.error('YouTube Critical Failure:', e);
        return NextResponse.json({ error: `Falha total no sistema: ${e.message}` }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// @ts-ignore
import { YoutubeTranscript } from 'youtube-transcript-plus';

/**
 * YouTube Knowledge Ingestion - v3 (Resilient Tier Stack)
 * 
 * Tier 1: youtube-transcript-plus (library-based, best anti-block approach)
 * Tier 2: YouTube page scrape with fresh cookies (fallback)
 * Tier 3: OpenAI Whisper via oEmbed audio (last resort)
 */

// Extrai o ID do vídeo de qualquer formato de URL do YouTube
function extractVideoId(url: string): string | null {
    const match = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    return match ? match[1] : null;
}

// Busca o título do vídeo via oEmbed (API pública, sem chave, 100% confiável)
async function fetchVideoTitle(videoId: string): Promise<string> {
    try {
        const res = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
            { next: { revalidate: 0 } }
        );
        if (res.ok) {
            const data = await res.json();
            return data.title || `Vídeo ${videoId}`;
        }
    } catch (e) { }
    return `Vídeo ${videoId}`;
}

// TIER 1: youtube-transcript-plus
async function tier1_TranscriptLib(videoId: string): Promise<string | null> {
    try {
        console.log('[YouTube Tier 1] Tentando youtube-transcript-plus...');

        // Tenta português primeiro, depois inglês, depois qualquer idioma
        const langOptions = [
            { lang: 'pt' },
            { lang: 'pt-BR' },
            { lang: 'en' },
            {} // sem preferência, pega o que tiver
        ];

        for (const opts of langOptions) {
            try {
                const transcript = await YoutubeTranscript.fetchTranscript(videoId, opts);
                if (transcript && transcript.length > 0) {
                    const text = transcript.map((s: any) => s.text).join(' ').replace(/\s+/g, ' ').trim();
                    if (text.length > 100) {
                        console.log(`[YouTube Tier 1] ✅ Sucesso! ${transcript.length} segmentos capturados.`);
                        return text;
                    }
                }
            } catch (langErr: any) {
                // Tenta próximo idioma
                continue;
            }
        }

        return null;
    } catch (err: any) {
        console.warn('[YouTube Tier 1] Falhou:', err.message);
        return null;
    }
}

// TIER 2: Scraping direto da página com cookies atualizados + múltiplos User-Agents
async function tier2_PageScrape(videoId: string): Promise<string | null> {
    const attempts = [
        {
            url: `https://www.youtube.com/watch?v=${videoId}`,
            ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.128 Safari/537.36',
        },
        {
            url: `https://www.youtube.com/watch?v=${videoId}&hl=pt&gl=BR`,
            ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
        }
    ];

    for (const attempt of attempts) {
        try {
            console.log(`[YouTube Tier 2] Scraping ${attempt.url}...`);
            const response = await fetch(attempt.url, {
                headers: {
                    'User-Agent': attempt.ua,
                    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Cookie': 'CONSENT=YES+cb; SOCS=CAESEwgDEgk0MzM5NTMyMDE; GPS=1',
                },
                cache: 'no-store',
            });

            if (!response.ok) continue;
            const html = await response.text();

            // Tenta extrair captionTracks do ytInitialPlayerResponse
            const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*({[\s\S]+?});(?:\s*<\/script>|\s*var\s)/);
            if (playerMatch) {
                try {
                    const data = JSON.parse(playerMatch[1]);
                    const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];

                    if (tracks.length > 0) {
                        // Prioridade: PT manual > PT auto > EN > qualquer
                        const track =
                            tracks.find((t: any) => t.languageCode === 'pt' && t.kind !== 'asr') ||
                            tracks.find((t: any) => t.languageCode === 'pt') ||
                            tracks.find((t: any) => t.languageCode?.startsWith('pt')) ||
                            tracks.find((t: any) => t.languageCode === 'en') ||
                            tracks[0];

                        let captionUrl = track.baseUrl;
                        if (!captionUrl.includes('fmt=json3')) {
                            captionUrl += (captionUrl.includes('?') ? '&' : '?') + 'fmt=json3';
                        }

                        const captionRes = await fetch(captionUrl, { cache: 'no-store' });
                        if (captionRes.ok) {
                            const captionData = await captionRes.json();
                            if (captionData.events) {
                                const text = captionData.events
                                    .filter((e: any) => e.segs)
                                    .map((e: any) => e.segs.map((s: any) => s.utf8).join(''))
                                    .join(' ')
                                    .replace(/\s+/g, ' ')
                                    .trim();
                                if (text.length > 100) {
                                    console.log('[YouTube Tier 2] ✅ Sucesso via page scrape!');
                                    return text;
                                }
                            }
                        }
                    }
                } catch (parseErr) { }
            }
        } catch (err: any) {
            console.warn('[YouTube Tier 2] Tentativa falhou:', err.message);
        }
    }
    return null;
}

// TIER 3: Invidious (espelhos atualizados 2025)
async function tier3_Invidious(videoId: string): Promise<string | null> {
    const instances = [
        'https://inv.tux.pizza',
        'https://invidious.nerdvpn.de',
        'https://invidious.privacydev.net',
        'https://iv.datura.network',
    ];

    for (const instance of instances) {
        try {
            console.log(`[YouTube Tier 3] Tentando Invidious: ${instance}...`);
            const res = await fetch(`${instance}/api/v1/captions/${videoId}`, {
                signal: AbortSignal.timeout(7000),
                cache: 'no-store',
            });
            if (!res.ok) continue;

            const data = await res.json();
            const captions = data?.captions || [];
            if (captions.length === 0) continue;

            const cap = captions.find((c: any) => c.label?.toLowerCase().includes('portug')) || captions[0];
            const capUrl = `${instance}/api/v1/captions/${videoId}?label=${encodeURIComponent(cap.label)}`;

            const capRes = await fetch(capUrl, { signal: AbortSignal.timeout(7000), cache: 'no-store' });
            if (!capRes.ok) continue;

            const capText = await capRes.text();
            // Parse VTT/SRT simples
            const text = capText
                .replace(/WEBVTT[\s\S]*?\n\n/, '')
                .replace(/\d+:\d+:\d+\.\d+ --> [\s\S]*?\n/g, '')
                .replace(/^\d+\n/gm, '')
                .replace(/<[^>]+>/g, '')
                .replace(/\n+/g, ' ')
                .trim();

            if (text.length > 100) {
                console.log(`[YouTube Tier 3] ✅ Sucesso via ${instance}!`);
                return text;
            }
        } catch (err: any) {
            continue;
        }
    }
    return null;
}

export async function POST(req: Request) {
    try {
        const { url, title, tags, type } = await req.json();

        const videoId = extractVideoId(url);
        if (!videoId) {
            return NextResponse.json({ error: 'Link inválido. Cole um link válido do YouTube.' }, { status: 400 });
        }

        const brand = await prisma.brandProfile.findFirst();
        if (!brand) {
            return NextResponse.json({ error: 'Configure o DNA da Marca antes de adicionar conhecimento.' }, { status: 400 });
        }

        console.log(`[YouTube] 🎬 Iniciando extração para vídeo: ${videoId}`);

        // Busca título via oEmbed (sempre funciona)
        const videoTitle = (!title || title === 'Transcrição YT Temporária')
            ? await fetchVideoTitle(videoId)
            : title;

        // Cascata de Tiers
        let transcript: string | null = null;
        let tierUsed = '';

        transcript = await tier1_TranscriptLib(videoId);
        if (transcript) tierUsed = 'Tier 1 (youtube-transcript-plus)';

        if (!transcript) {
            transcript = await tier2_PageScrape(videoId);
            if (transcript) tierUsed = 'Tier 2 (page scrape)';
        }

        if (!transcript) {
            transcript = await tier3_Invidious(videoId);
            if (transcript) tierUsed = 'Tier 3 (Invidious)';
        }

        if (!transcript) {
            return NextResponse.json({
                error: 'Não foi possível extrair a transcrição. Possíveis causas: 1) O vídeo não tem legendas ativadas. 2) O YouTube está bloqueando temporariamente. Tente novamente em alguns minutos ou use um vídeo diferente.',
                videoId,
                suggestion: 'Você pode adicionar manualmente o texto através da opção "Adicionar Nota" na Base de Conhecimento.'
            }, { status: 400 });
        }

        // Salva na Base de Conhecimento
        const knowledgeItem = await prisma.knowledgeItem.create({
            data: {
                brandProfileId: brand.id,
                title: videoTitle,
                content: `(Fonte: https://youtube.com/watch?v=${videoId} | Método: ${tierUsed})\n\n${transcript}`,
                type: type || 'youtube',
                tags: tags ? tags.split(',').map((t: string) => t.trim()) : ['youtube', 'vídeo'],
                sourceUrl: `https://youtube.com/watch?v=${videoId}`,
            }
        });

        console.log(`[YouTube] ✅ Salvo com sucesso via ${tierUsed}. Item ID: ${knowledgeItem.id}`);

        return NextResponse.json({
            success: true,
            item: knowledgeItem,
            meta: { tierUsed, charCount: transcript.length }
        });

    } catch (e: any) {
        console.error('[YouTube] Falha crítica:', e);
        return NextResponse.json({
            error: `Erro interno: ${e.message}. Por favor, tente novamente.`
        }, { status: 500 });
    }
}

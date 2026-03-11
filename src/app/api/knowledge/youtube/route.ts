import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * YouTube Knowledge Ingestion - v5 (Production Grade)
 *
 * Tier 1: Supadata API          — proxy residencial, resolve bloqueio Vercel ✅
 * Tier 2: youtube-transcript-plus — funciona localmente
 * Tier 3: YouTube Data API v3   — lista legendas (fallback de metadados)
 * Tier 4: OpenAI Whisper        — transcrição via áudio (nuclear fallback)
 */

function extractVideoId(url: string): string | null {
    const match = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))([^"&?\/\s]{11})/
    );
    return match ? match[1] : null;
}

async function fetchVideoMeta(videoId: string): Promise<{ title: string; author: string }> {
    try {
        const res = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
            { cache: 'no-store' }
        );
        if (res.ok) {
            const data = await res.json();
            return { title: data.title || `Vídeo ${videoId}`, author: data.author_name || '' };
        }
    } catch (e) { }
    return { title: `Vídeo ${videoId}`, author: '' };
}

// ─────────────────────────────────────────────────────────────
// TIER 1: Supadata API (resolve bloqueio de IP da Vercel)
// Documentação: https://supadata.ai/documentation
// ─────────────────────────────────────────────────────────────
async function tier1_Supadata(videoId: string): Promise<string | null> {
    const apiKey = process.env.SUPADATA_API_KEY;
    if (!apiKey) {
        console.log('[YouTube Tier 1] SUPADATA_API_KEY não configurada. Pulando.');
        return null;
    }

    try {
        console.log('[YouTube Tier 1] Tentando Supadata API...');

        const res = await fetch(
            `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true`,
            {
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json',
                },
                cache: 'no-store',
                signal: AbortSignal.timeout(15000),
            }
        );

        if (!res.ok) {
            const errText = await res.text();
            console.warn('[YouTube Tier 1] Supadata erro HTTP:', res.status, errText.substring(0, 200));
            return null;
        }

        const data = await res.json();

        // Supadata retorna { content: "...", lang: "pt", ... }
        const text = data?.content || data?.transcript || data?.text;

        if (text && text.length > 100) {
            console.log(`[YouTube Tier 1] ✅ Supadata! ${text.length} chars. Idioma: ${data?.lang || 'auto'}`);
            return text;
        }

        console.warn('[YouTube Tier 1] Supadata retornou conteúdo vazio ou muito curto.');
        return null;
    } catch (err: any) {
        console.warn('[YouTube Tier 1] Supadata falhou:', err.message);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────
// TIER 2: youtube-transcript-plus (funciona localmente)
// ─────────────────────────────────────────────────────────────
async function tier2_TranscriptLib(videoId: string): Promise<string | null> {
    try {
        const { YoutubeTranscript } = await import('youtube-transcript-plus');
        console.log('[YouTube Tier 2] Tentando youtube-transcript-plus...');

        const langOptions: any[] = [{ lang: 'pt' }, { lang: 'pt-BR' }, { lang: 'en' }, {}];

        for (const opts of langOptions) {
            try {
                const transcript = await YoutubeTranscript.fetchTranscript(videoId, opts);
                if (transcript && transcript.length > 0) {
                    const text = transcript.map((s: any) => s.text).join(' ').replace(/\s+/g, ' ').trim();
                    if (text.length > 100) {
                        console.log(`[YouTube Tier 2] ✅ Sucesso! ${transcript.length} segmentos.`);
                        return text;
                    }
                }
            } catch { continue; }
        }
        return null;
    } catch (err: any) {
        console.warn('[YouTube Tier 2] Falha:', err.message);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────
// TIER 3: YouTube Data API v3 + TimedText (ASR tracks)
// ─────────────────────────────────────────────────────────────
async function tier3_YouTubeDataAPI(videoId: string): Promise<string | null> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return null;

    try {
        console.log('[YouTube Tier 3] Tentando YouTube Data API v3...');

        const listRes = await fetch(
            `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${apiKey}`,
            { cache: 'no-store' }
        );
        if (!listRes.ok) return null;

        const listData = await listRes.json();
        const captions = listData.items || [];
        if (captions.length === 0) return null;

        // Filtra apenas ASR (auto-geradas, únicas que o timedtext público entrega)
        const asrTrack =
            captions.find((c: any) => c.snippet.language?.startsWith('pt') && c.snippet.trackKind === 'asr') ||
            captions.find((c: any) => c.snippet.language === 'en' && c.snippet.trackKind === 'asr') ||
            captions.find((c: any) => c.snippet.trackKind === 'asr');

        if (!asrTrack) {
            console.warn('[YouTube Tier 3] Nenhuma legenda ASR disponível para download público.');
            return null;
        }

        const langCode = asrTrack.snippet.language;
        const timedTextUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${langCode}&kind=asr&fmt=json3`;

        const captionRes = await fetch(timedTextUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                'Referer': `https://www.youtube.com/watch?v=${videoId}`,
            },
            cache: 'no-store'
        });

        if (!captionRes.ok) return null;

        const rawText = await captionRes.text();
        if (!rawText || rawText.trim().length < 10) return null;

        let captionData: any;
        try { captionData = JSON.parse(rawText); } catch { return null; }

        if (!captionData?.events) return null;

        const text = captionData.events
            .filter((e: any) => e.segs)
            .map((e: any) => e.segs.map((s: any) => s.utf8).join(''))
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (text.length > 50) {
            console.log(`[YouTube Tier 3] ✅ Data API! ${text.length} chars. Idioma: ${langCode}`);
            return text;
        }
        return null;
    } catch (err: any) {
        console.warn('[YouTube Tier 3] Falha:', err.message);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────
// TIER 4: OpenAI Whisper nuclear fallback
// ─────────────────────────────────────────────────────────────
async function tier4_Whisper(videoId: string, videoTitle: string): Promise<string | null> {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return null;

    try {
        console.log('[YouTube Tier 4] Tentando Whisper via Invidious audio...');

        const invInstances = ['https://inv.tux.pizza', 'https://invidious.nerdvpn.de', 'https://invidious.privacydev.net'];
        let audioUrl: string | null = null;

        for (const instance of invInstances) {
            try {
                const res = await fetch(`${instance}/api/v1/videos/${videoId}`, {
                    signal: AbortSignal.timeout(8000), cache: 'no-store'
                });
                if (!res.ok) continue;
                const data = await res.json();
                const audioFormats = (data.adaptiveFormats || [])
                    .filter((f: any) => f.type?.includes('audio/mp4') || f.type?.includes('audio/webm'))
                    .sort((a: any, b: any) => b.bitrate - a.bitrate);
                if (audioFormats.length > 0) { audioUrl = audioFormats[0].url; break; }
            } catch { continue; }
        }

        if (!audioUrl) return null;

        const audioRes = await fetch(audioUrl, { signal: AbortSignal.timeout(30000) });
        if (!audioRes.ok) return null;

        const audioBuffer = await audioRes.arrayBuffer();
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mp4' });

        if (audioBlob.size > 25 * 1024 * 1024) {
            console.warn('[YouTube Tier 4] Áudio > 25MB, Whisper não aceita.');
            return null;
        }

        const formData = new FormData();
        formData.append('file', audioBlob, `${videoId}.mp4`);
        formData.append('model', 'whisper-1');
        formData.append('language', 'pt');
        formData.append('response_format', 'text');
        formData.append('prompt', `Transcrição de vídeo sobre: ${videoTitle}`);

        const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${openaiKey}` },
            body: formData,
        });

        if (!whisperRes.ok) return null;

        const transcription = await whisperRes.text();
        if (transcription && transcription.length > 50) {
            console.log(`[YouTube Tier 4] ✅ Whisper! ${transcription.length} chars.`);
            return transcription;
        }
        return null;
    } catch (err: any) {
        console.warn('[YouTube Tier 4] Whisper falhou:', err.message);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────
// HANDLER PRINCIPAL
// ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
    try {
        const { url, title, tags, type } = await req.json();

        const videoId = extractVideoId(url);
        if (!videoId) {
            return NextResponse.json({ error: 'Link inválido. Cole um link do YouTube válido.' }, { status: 400 });
        }

        const brand = await prisma.brandProfile.findFirst();
        if (!brand) {
            return NextResponse.json({ error: 'Configure o DNA da Marca antes de adicionar conhecimento.' }, { status: 400 });
        }

        console.log(`[YouTube] 🎬 Iniciando extração: ${videoId}`);

        const meta = await fetchVideoMeta(videoId);
        const videoTitle = (!title || title === 'Transcrição YT Temporária') ? meta.title : title;

        // ── Cascata de Tiers ──
        let transcript: string | null = null;
        let tierUsed = '';

        transcript = await tier1_Supadata(videoId);
        if (transcript) tierUsed = 'Supadata API';

        if (!transcript) {
            transcript = await tier2_TranscriptLib(videoId);
            if (transcript) tierUsed = 'youtube-transcript-plus';
        }

        if (!transcript) {
            transcript = await tier3_YouTubeDataAPI(videoId);
            if (transcript) tierUsed = 'YouTube Data API v3 (ASR)';
        }

        if (!transcript) {
            transcript = await tier4_Whisper(videoId, videoTitle);
            if (transcript) tierUsed = 'OpenAI Whisper';
        }

        if (!transcript) {
            return NextResponse.json({
                error: 'Não foi possível extrair a transcrição deste vídeo.',
                details: 'Configure SUPADATA_API_KEY na Vercel para resolver definitivamente.',
                videoId,
                videoTitle,
            }, { status: 400 });
        }

        const knowledgeItem = await prisma.knowledgeItem.create({
            data: {
                brandProfileId: brand.id,
                title: videoTitle,
                content: `(YouTube | ${meta.author} | Método: ${tierUsed})\nFonte: https://youtube.com/watch?v=${videoId}\n\n${transcript}`,
                type: type || 'youtube',
                tags: tags ? tags.split(',').map((t: string) => t.trim()) : ['youtube', 'vídeo'],
                sourceUrl: `https://youtube.com/watch?v=${videoId}`,
            }
        });

        return NextResponse.json({
            success: true,
            item: knowledgeItem,
            meta: { tierUsed, charCount: transcript.length, videoTitle }
        });

    } catch (e: any) {
        console.error('[YouTube] Falha crítica:', e);
        return NextResponse.json({ error: `Erro interno: ${e.message}` }, { status: 500 });
    }
}

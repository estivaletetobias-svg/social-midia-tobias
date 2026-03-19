import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * YouTube Knowledge Ingestion - v5 (Production Grade)
 *
 * Tier 1: Supadata API          — proxy residencial, resolve bloqueio Vercel ✅
 * Tier 2: youtube-transcript-plus — funciona localmente
 * Tier 3: YouTube Data API v3   — lista legendas (fallback de metadados)
 * Tier 4: OpenAI Whisper        — transcrição via áudio (nuclear fallback)
 */

function extractVideoId(url: string): string | null {
    console.log(`[YouTube] URL recebida para extração: "${url}"`);
    const match = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([^"&?\/\s]{11})/
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

        // Prioriza PT manual, depois PT ASR, depois EN manual, etc.
        const track =
            captions.find((c: any) => c.snippet.language?.startsWith('pt') && c.snippet.trackKind === 'standard') ||
            captions.find((c: any) => c.snippet.language?.startsWith('pt')) ||
            captions.find((c: any) => c.snippet.language?.startsWith('en') && c.snippet.trackKind === 'standard') ||
            captions.find((c: any) => c.snippet.trackKind === 'asr') ||
            captions[0];

        if (!track) {
            console.warn('[YouTube Tier 3] Nenhuma legenda disponível via API.');
            return null;
        }

        const langCode = track.snippet.language;
        const kind = track.snippet.trackKind === 'asr' ? '&kind=asr' : '';
        const timedTextUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${langCode}${kind}&fmt=json3`;

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

        const invInstances = [
            'https://inv.tux.pizza', 
            'https://invidious.nerdvpn.de', 
            'https://invidious.privacydev.net',
            'https://yewtu.be',
            'https://iv.melmac.space'
        ];
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
// TIER 5: Direct TimedText Scrape (Last resort)
// ─────────────────────────────────────────────────────────────
async function tier5_DirectScrape(videoId: string): Promise<string | null> {
    const langs = ['pt', 'pt-BR', 'en'];
    for (const l of langs) {
        try {
            console.log(`[YouTube Tier 5] Tentando Scrape direto para lang=${l}...`);
            const res = await fetch(`https://www.youtube.com/api/timedtext?v=${videoId}&lang=${l}&fmt=json3`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                cache: 'no-store'
            });
            if (!res.ok) continue;
            const data = await res.json();
            if (data?.events) {
                const text = data.events.filter((e: any) => e.segs).map((e: any) => e.segs.map((s: any) => s.utf8).join('')).join(' ').replace(/\s+/g, ' ').trim();
                if (text.length > 50) return text;
            }
        } catch { }
    }
    return null;
}

// ─────────────────────────────────────────────────────────────
// HANDLER PRINCIPAL
// ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { url, title, tags, type, brandId } = await req.json();

        // Security check: ensure user has access to this brand
        const activeBrandId = brandId || (session.user as any).brandId;
        if (!activeBrandId) {
            return NextResponse.json({ error: 'No active brand selected' }, { status: 400 });
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            return NextResponse.json({ error: 'Link inválido. Cole um link do YouTube válido.' }, { status: 400 });
        }

        const brand = await prisma.brandProfile.findUnique({ where: { id: activeBrandId } });

        if (!brand) {
            return NextResponse.json({ error: 'Perfil de marca não encontrado. Selecione um DNA ativo no menu lateral.' }, { status: 400 });
        }

        console.log(`[YouTube] 🎬 Iniciando extração: ${videoId}`);

        const meta = await fetchVideoMeta(videoId);
        const videoTitle = (!title || title === 'Transcrição YT Temporária') ? meta.title : title;

        // ── Cascata de Tiers ──
        let transcript: string | null = null;
        let tierUsed = '';
        let errors: string[] = [];

        console.log(`[YouTube] 1. Tentando Supadata (Tier 1)...`);
        try {
            transcript = await tier1_Supadata(videoId);
            if (transcript) tierUsed = 'Supadata API';
        } catch (e: any) { errors.push(`Supadata: ${e.message}`); }

        if (!transcript) {
            console.log(`[YouTube] 2. Tentando youtube-transcript-plus (Tier 2)...`);
            try {
                transcript = await tier2_TranscriptLib(videoId);
                if (transcript) tierUsed = 'youtube-transcript-plus';
            } catch (e: any) { errors.push(`Lib Plus: ${e.message}`); }
        }

        if (!transcript) {
            console.log(`[YouTube] 3. Tentando YouTube Data API v3 (Tier 3)...`);
            try {
                transcript = await tier3_YouTubeDataAPI(videoId);
                if (transcript) tierUsed = 'YouTube Data API v3';
            } catch (e: any) { errors.push(`Data API: ${e.message}`); }
        }

        if (!transcript) {
            console.log(`[YouTube] 4. Tentando OpenAI Whisper (Tier 4)...`);
            try {
                transcript = await tier4_Whisper(videoId, videoTitle);
                if (transcript) tierUsed = 'OpenAI Whisper';
            } catch (e: any) { errors.push(`Whisper: ${e.message}`); }
        }

        if (!transcript) {
            console.log(`[YouTube] 5. Tentando Scrape Direto (Tier 5)...`);
            try {
                transcript = await tier5_DirectScrape(videoId);
                if (transcript) tierUsed = 'Direct Scrape (TimedText)';
            } catch (e: any) { errors.push(`Scrape: ${e.message}`); }
        }

        if (!transcript) {
            const hasSupaKey = !!process.env.SUPADATA_API_KEY;
            return NextResponse.json({
                error: 'Não foi possível extrair a transcrição deste vídeo.',
                details: errors.join(' | ') + (!hasSupaKey ? ' | SUPADATA_API_KEY não configurada' : ''),
                videoId,
                videoTitle,
                recommendation: !hasSupaKey 
                    ? 'Configure a chave SUPADATA_API_KEY no ambiente para resolver bloqueios do YouTube.'
                    : 'Este vídeo pode estar com as legendas desativadas ou o YouTube bloqueou o acesso temporariamente. Tente um vídeo que você saiba que possui legendas (CC).'
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

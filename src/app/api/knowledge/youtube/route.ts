import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * YouTube Knowledge Ingestion - v4 (Production Grade)
 * 
 * Tier 1: YouTube Data API v3 - captions endpoint (100% confiável, oficial)
 * Tier 2: youtube-transcript-plus (fallback para vídeos sem API key)
 * Tier 3: OpenAI Whisper - transcrição de áudio (fallback nuclear, usa OPENAI_API_KEY)
 */

// Extrai o ID do vídeo de qualquer formato de URL
function extractVideoId(url: string): string | null {
    const match = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))([^"&?\/\s]{11})/
    );
    return match ? match[1] : null;
}

// Busca metadados do vídeo via oEmbed (100% público, sem chave)
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

// TIER 1: YouTube Data API v3 (Captions + TimedText)
async function tier1_YouTubeDataAPI(videoId: string): Promise<string | null> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        console.log('[YouTube Tier 1] YOUTUBE_API_KEY não configurada. Pulando.');
        return null;
    }

    try {
        console.log('[YouTube Tier 1] Buscando legendas via YouTube Data API v3...');

        // Lista as tracks de legendas disponíveis
        const listRes = await fetch(
            `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${apiKey}`,
            { cache: 'no-store' }
        );

        if (!listRes.ok) {
            const err = await listRes.json();
            console.warn('[YouTube Tier 1] API retornou erro:', err?.error?.message);
            return null;
        }

        const listData = await listRes.json();
        const captions = listData.items || [];

        if (captions.length === 0) {
            console.log('[YouTube Tier 1] Vídeo não tem legendas registradas na API.');
            return null;
        }

        // Prioridade: PT manual > PT auto > EN > qualquer
        const track =
            captions.find((c: any) => c.snippet.language?.startsWith('pt') && c.snippet.trackKind === 'standard') ||
            captions.find((c: any) => c.snippet.language?.startsWith('pt')) ||
            captions.find((c: any) => c.snippet.language === 'en') ||
            captions[0];

        // Download da legenda via timedtext (não requer OAuth para vídeos públicos)
        const langCode = track.snippet.language || 'pt';
        const timedTextUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${langCode}&fmt=json3&key=${apiKey}`;

        const captionRes = await fetch(timedTextUrl, { cache: 'no-store' });
        if (!captionRes.ok) {
            console.warn('[YouTube Tier 1] Não conseguiu baixar o arquivo de legenda.');
            return null;
        }

        const captionData = await captionRes.json();
        if (!captionData.events) return null;

        const text = captionData.events
            .filter((e: any) => e.segs)
            .map((e: any) => e.segs.map((s: any) => s.utf8).join(''))
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (text.length > 50) {
            console.log(`[YouTube Tier 1] ✅ Sucesso! ${text.length} caracteres extraídos.`);
            return text;
        }

        return null;
    } catch (err: any) {
        console.warn('[YouTube Tier 1] Falha:', err.message);
        return null;
    }
}

// TIER 2: youtube-transcript-plus (boa resiliência, sem API key)
async function tier2_TranscriptLib(videoId: string): Promise<string | null> {
    try {
        // Import dinâmico para evitar problemas de SSR
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

// TIER 3: OpenAI Whisper - transcrição do áudio via URL pública
// Usa a API de áudio do YouTube para obter o stream e o Whisper para transcrever
async function tier3_Whisper(videoId: string, videoTitle: string): Promise<string | null> {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
        console.log('[YouTube Tier 3] OPENAI_API_KEY não configurada. Pulando.');
        return null;
    }

    try {
        console.log('[YouTube Tier 3] Tentando Whisper via download de áudio...');

        // Usamos a API Invidious para obter URL de áudio (sem executar yt-dlp)
        const invInstances = [
            'https://inv.tux.pizza',
            'https://invidious.nerdvpn.de',
            'https://invidious.privacydev.net',
        ];

        let audioUrl: string | null = null;

        for (const instance of invInstances) {
            try {
                const res = await fetch(`${instance}/api/v1/videos/${videoId}`, {
                    signal: AbortSignal.timeout(8000),
                    cache: 'no-store',
                });
                if (!res.ok) continue;

                const data = await res.json();
                // Pega a melhor URL de áudio disponível
                const audioFormats = (data.adaptiveFormats || [])
                    .filter((f: any) => f.type?.includes('audio/mp4') || f.type?.includes('audio/webm'))
                    .sort((a: any, b: any) => b.bitrate - a.bitrate);

                if (audioFormats.length > 0) {
                    audioUrl = audioFormats[0].url;
                    console.log(`[YouTube Tier 3] URL de áudio obtida via ${instance}`);
                    break;
                }
            } catch { continue; }
        }

        if (!audioUrl) {
            console.warn('[YouTube Tier 3] Nenhuma URL de áudio encontrada nos mirrors Invidious.');
            return null;
        }

        // Baixa o áudio (limite: ~25MB para o Whisper)
        const audioRes = await fetch(audioUrl, { signal: AbortSignal.timeout(30000) });
        if (!audioRes.ok) throw new Error('Falha ao baixar o áudio');

        const audioBuffer = await audioRes.arrayBuffer();
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mp4' });

        if (audioBlob.size > 25 * 1024 * 1024) {
            console.warn('[YouTube Tier 3] Áudio muito grande para Whisper (>25MB). Pulando.');
            return null;
        }

        // Envia para o Whisper
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

        if (!whisperRes.ok) {
            const err = await whisperRes.json();
            throw new Error(err?.error?.message || 'Falha no Whisper');
        }

        const transcription = await whisperRes.text();
        if (transcription && transcription.length > 50) {
            console.log(`[YouTube Tier 3] ✅ Whisper transcreveu ${transcription.length} caracteres.`);
            return transcription;
        }
        return null;
    } catch (err: any) {
        console.warn('[YouTube Tier 3] Falha no Whisper:', err.message);
        return null;
    }
}

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

        console.log(`[YouTube] 🎬 Extraindo transcrição: ${videoId}`);

        // Busca título do vídeo em paralelo (sempre funciona)
        const meta = await fetchVideoMeta(videoId);
        const videoTitle = (!title || title === 'Transcrição YT Temporária') ? meta.title : title;

        // Cascata de Tiers
        let transcript: string | null = null;
        let tierUsed = '';

        transcript = await tier1_YouTubeDataAPI(videoId);
        if (transcript) tierUsed = 'YouTube Data API v3';

        if (!transcript) {
            transcript = await tier2_TranscriptLib(videoId);
            if (transcript) tierUsed = 'youtube-transcript-plus';
        }

        if (!transcript) {
            transcript = await tier3_Whisper(videoId, videoTitle);
            if (transcript) tierUsed = 'OpenAI Whisper';
        }

        if (!transcript) {
            return NextResponse.json({
                error: 'Não foi possível extrair a transcrição deste vídeo.',
                details: 'O vídeo pode não ter legendas, ou o YouTube está bloqueando o acesso. Para resolver definitivamente, adicione a variável YOUTUBE_API_KEY no ambiente.',
                videoId,
                videoTitle,
            }, { status: 400 });
        }

        // Salva na Base de Conhecimento
        const knowledgeItem = await prisma.knowledgeItem.create({
            data: {
                brandProfileId: brand.id,
                title: videoTitle,
                content: `(YouTube | ${meta.author} | ${tierUsed})\nFonte: https://youtube.com/watch?v=${videoId}\n\n${transcript}`,
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

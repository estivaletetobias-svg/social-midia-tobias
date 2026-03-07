import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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

        // Tentar buscar o título real do vídeo no YouTube se nenhum título for passado
        if (!videoTitle || videoTitle === "Transcrição YT Temporária") {
            try {
                const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
                const html = await response.text();
                const titleMatch = html.match(/<title>(.*?)<\/title>/i);
                if (titleMatch && titleMatch[1]) {
                    videoTitle = titleMatch[1].replace(' - YouTube', '').trim();
                }
            } catch (titleErr) {
                console.error("Erro ao buscar título do vídeo:", titleErr);
            }
        }

        const brand = await prisma.brandProfile.findFirst();
        if (!brand) return NextResponse.json({ error: 'DNA não configurado.' }, { status: 400 });

        let transcript;
        const config = {
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            lang: 'pt'
        };

        try {
            console.log(`[YouTube] Fetching transcript for ${videoId} (DNA Tobias)...`);
            try {
                // Tenta com o DNA e User-Agent
                transcript = await fetchTranscript(videoId, config);
            } catch (ptErr: any) {
                console.warn(`[YouTube] PT attempt failed (${ptErr.message}), trying default fallback...`);
                transcript = await fetchTranscript(videoId, { userAgent: config.userAgent });
            }
        } catch (scrapeErr: any) {
            console.error("Youtube library error (DNA Tobias):", scrapeErr);
            // Log do erro real no console para debug
            if (scrapeErr.response) {
                try {
                    const errorText = await scrapeErr.response.text();
                    console.error("YouTube error response body:", errorText);
                } catch (e) { }
            }

            return NextResponse.json({
                error: `Desculpe, o YouTube bloqueou a leitura temporária desse vídeo. Isso acontece às vezes com vídeos muito protegidos.`,
                details: scrapeErr.message,
                videoId
            }, { status: 400 });
        }

        if (!transcript || transcript.length === 0) {
            return NextResponse.json({ error: 'Nenhuma legenda encontrada. Verifique se o vídeo possui legendas (CC) no YouTube.' }, { status: 400 });
        }

        // Unir todos os pedaços de texto da legenda em uma string
        const fullText = transcript.map((t: any) => t.text).join(' ');

        // Salvar no banco
        const knowledgeItem = await prisma.knowledgeItem.create({
            data: {
                brandProfileId: brand.id,
                title: videoTitle || 'Transcrição de Vídeo do YouTube',
                content: `(Resumo Extraído do YouTube: ${url})\n\n${fullText}`,
                type: type || 'Vídeo Transcrito',
                tags: tags ? tags.split(',').map((t: string) => t.trim()) : ['YOUTUBE', 'VÍDEO']
            }
        });

        return NextResponse.json({ success: true, item: knowledgeItem });

    } catch (e: any) {
        console.error('YouTube Fetch Error:', e);
        return NextResponse.json({ error: `Erro ao baixar legenda: ${e.message || 'Desconhecido'}` }, { status: 500 });
    }
}
// trigger rebuild

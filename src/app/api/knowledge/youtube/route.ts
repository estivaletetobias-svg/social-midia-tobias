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

        // NEW STEALTH UI: Mimicking a Mobile iPhone (YouTube is more permissive with mobile)
        const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';

        // Tentar buscar o título real do vídeo no YouTube
        if (!videoTitle || videoTitle === "Transcrição YT Temporária") {
            try {
                const response = await nodeFetch(`https://www.youtube.com/watch?v=${videoId}`, {
                    headers: {
                        'User-Agent': MOBILE_UA,
                        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                    }
                });
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

        // HIGH-RESILIENCE FETCH: Specialized headers for bypassing server-side detection
        const customFetch = async (params: any) => {
            return nodeFetch(params.url, {
                method: params.method || 'GET',
                body: params.body,
                headers: {
                    ...params.headers,
                    'User-Agent': MOBILE_UA,
                    'Accept': '*/*',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin',
                    'Referer': `https://www.youtube.com/watch?v=${videoId}`,
                    'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+999'
                }
            }) as any;
        };

        const config = {
            lang: 'pt',
            userAgent: MOBILE_UA,
            videoFetch: customFetch,
            transcriptFetch: customFetch,
            playerFetch: customFetch,
        };

        try {
            console.log(`[YouTube Alpha] Attempting ultra-stealth scrape for ${videoId}...`);
            try {
                transcript = await fetchTranscript(videoId, config);
            } catch (ptErr: any) {
                console.warn(`[YouTube Alpha] PT failed, falling back to auto-detect...`);
                transcript = await fetchTranscript(videoId, { ...config, lang: undefined });
            }
        } catch (scrapeErr: any) {
            console.error("Youtube Alpha Error:", scrapeErr.message);

            return NextResponse.json({
                error: `O YouTube bloqueou a leitura temporária desse vídeo. Isso acontece às vezes por segurança deles.`,
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

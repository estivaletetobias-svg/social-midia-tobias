import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// @ts-ignore
import { YoutubeTranscript } from 'youtube-transcript';

export async function POST(req: Request) {
    try {
        const { url, title, tags, type } = await req.json();

        const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (!videoIdMatch) {
            return NextResponse.json({ error: 'Insira um link válido do YouTube' }, { status: 400 });
        }
        const videoId = videoIdMatch[1];

        const brand = await prisma.brandProfile.findFirst();
        if (!brand) return NextResponse.json({ error: 'DNA não configurado.' }, { status: 400 });

        // Extrair transcrição do YouTube via HTML Scraping (sem dependências que quebram)
        const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7"
            }
        });
        const html = await res.text();

        // Regex para capturar os dados do player
        const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
        if (!captionMatch) {
            return NextResponse.json({ error: 'Nenhuma legenda encontrada neste vídeo. Verifique se o vídeo não foi apagado e se possui Closed Captions.' }, { status: 400 });
        }

        const captionTracks = JSON.parse(captionMatch[1]);
        if (!captionTracks || captionTracks.length === 0) {
            return NextResponse.json({ error: 'Legendas indisponíveis (geradas ou manuais) para o vídeo.' }, { status: 400 });
        }

        // Dá prioridade a pt-BR, senão pega a primeira disponível (ex: inglês ou autogerada)
        const track = captionTracks.find((t: any) => t.languageCode === 'pt') || captionTracks[0];
        const captionUrl = track.baseUrl.replace(/\\u0026/g, '&');

        const xmlRes = await fetch(captionUrl);
        const xmlContent = await xmlRes.text();

        // Extrair textos do XML permitindo quebra de linhas (dotAll equivalent)
        const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/gi;
        let pieces = [];
        let r;
        while ((r = textRegex.exec(xmlContent)) !== null) {
            let piece = r[1];
            // Remove lingering HTML/XML tags inside the text node
            piece = piece.replace(/<[^>]*>?/gm, '');
            // Unescape basic XML entities
            piece = piece.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
            if (piece) pieces.push(piece);
        }

        const fullText = pieces.join(' ');

        if (!fullText || fullText.trim() === '') {
            return NextResponse.json({ error: 'Não foi possível ler as palavras do vídeo. Legenda pode estar corrompida.' }, { status: 400 });
        }

        // Salvar no banco
        const knowledgeItem = await prisma.knowledgeItem.create({
            data: {
                brandProfileId: brand.id,
                title: title || 'Transcrição de Vídeo do YouTube',
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

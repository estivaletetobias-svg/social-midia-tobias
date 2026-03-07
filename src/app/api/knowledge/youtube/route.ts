import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// @ts-ignore
import { YoutubeTranscript } from 'youtube-transcript';

export async function POST(req: Request) {
    try {
        const { url, title, tags, type } = await req.json();

        if (!url || !url.includes('youtu')) {
            return NextResponse.json({ error: 'Insira um link válido do YouTube' }, { status: 400 });
        }

        const brand = await prisma.brandProfile.findFirst();
        if (!brand) return NextResponse.json({ error: 'DNA não configurado.' }, { status: 400 });

        // Extrair transcrição do YouTube
        const transcript = await YoutubeTranscript.fetchTranscript(url);
        if (!transcript || transcript.length === 0) {
            return NextResponse.json({ error: 'Nenhuma legenda encontrada neste vídeo.' }, { status: 400 });
        }

        // Unir todos os pedaços de texto da legenda em uma string
        const fullText = transcript.map((t: any) => t.text).join(' ');

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
        return NextResponse.json({ error: 'Erro ao tentar baixar legenda do YouTube. Verifique se o vídeo possui legendas ativas e públicas.' }, { status: 500 });
    }
}

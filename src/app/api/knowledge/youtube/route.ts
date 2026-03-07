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

        const brand = await prisma.brandProfile.findFirst();
        if (!brand) return NextResponse.json({ error: 'DNA não configurado.' }, { status: 400 });

        let transcript;
        try {
            transcript = await fetchTranscript(videoId);
        } catch (scrapeErr: any) {
            console.error("Youtube library error:", scrapeErr);
            return NextResponse.json({ error: `O YouTube bloqueou a leitura ou não há legendas disponíveis. (${scrapeErr.message})` }, { status: 400 });
        }

        if (!transcript || transcript.length === 0) {
            return NextResponse.json({ error: 'Nenhuma palavra encontrada nas legendas deste vídeo.' }, { status: 400 });
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
        return NextResponse.json({ error: `Erro ao baixar legenda: ${e.message || 'Desconhecido'}` }, { status: 500 });
    }
}
// trigger rebuild

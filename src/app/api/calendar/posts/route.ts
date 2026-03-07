import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const brand = await prisma.brandProfile.findFirst();
        if (!brand) {
            return NextResponse.json({ success: true, posts: [] });
        }

        // Buscamos todas as peças de conteúdo
        // Se ela tiver publishingJob, pegamos a data de lá.
        // Se não tiver, para fins de demonstração visual (MVP), vamos espalhar as que já foram rascunhadas na semana.
        const pieces = await prisma.contentPiece.findMany({
            where: {
                brandProfileId: brand.id,
            },
            include: {
                publishingJob: true,
                assets: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Adaptação dos dados de POST para o calendário
        const formattedPosts = pieces.map((piece: any) => {
            // Data real agendada, ou fake (criada + 2 dias) para MVP ter volume na tela
            let date = piece.publishingJob?.scheduledAt
                ? new Date(piece.publishingJob.scheduledAt)
                : new Date(new Date(piece.createdAt).getTime() + (Math.random() * 5 * 24 * 60 * 60 * 1000));

            return {
                id: piece.id,
                title: piece.title,
                platform: piece.platform,
                format: piece.format,
                status: piece.status,
                image: piece.assets?.[0]?.url || null,
                day: date.getDate(),
                month: date.getMonth(),
                year: date.getFullYear()
            }
        });

        return NextResponse.json({ success: true, posts: formattedPosts });
    } catch (error: any) {
        console.error("Calendar Posts Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

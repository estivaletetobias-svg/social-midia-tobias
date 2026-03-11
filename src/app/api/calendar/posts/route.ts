import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const brandId = searchParams.get('brandId');

        let targetBrandId = brandId;

        if (!targetBrandId) {
            const firstBrand = await prisma.brandProfile.findFirst();
            if (!firstBrand) {
                return NextResponse.json({ success: true, posts: [] });
            }
            targetBrandId = firstBrand.id;
        }

        // Buscamos todas as peças de conteúdo
        // Se ela tiver publishingJob, pegamos a data de lá.
        // Se não tiver, para fins de demonstração visual (MVP), vamos espalhar as que já foram rascunhadas na semana.
        const pieces = await (prisma as any).contentPiece.findMany({
            where: {
                brandProfileId: targetBrandId,
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
            // Data real agendada, ou fallback para data de criação (estável)
            const date = piece.publishingJob?.scheduledAt
                ? new Date(piece.publishingJob.scheduledAt)
                : new Date(piece.createdAt);

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

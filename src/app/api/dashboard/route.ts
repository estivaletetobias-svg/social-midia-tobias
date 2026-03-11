import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const brandId = searchParams.get('id');

        let targetBrandId = brandId;

        if (!targetBrandId) {
            const firstBrand = await prisma.brandProfile.findFirst();
            if (!firstBrand) {
                return NextResponse.json({ error: 'Nenhum perfil de marca encontrado.' }, { status: 400 });
            }
            targetBrandId = firstBrand.id;
        }

        // 1. Count Drafts in Pipeline (ideas + drafts)
        const draftsCount = await prisma.contentPiece.count({
            where: {
                brandProfileId: targetBrandId,
                status: { in: ['idea', 'draft', 'review'] }
            }
        });

        // 2. Count Approved Content
        const approvedCount = await prisma.contentPiece.count({
            where: {
                brandProfileId: targetBrandId,
                status: 'approved'
            }
        });

        // 3. Count AI Topics Proposed
        const topicsCount = await prisma.topicCandidate.count({
            where: {
                brandProfileId: targetBrandId,
                status: 'pending_review'
            }
        });

        // 4. Hours saved (mock calculation: 1.5h per draft/approved + 0.5h per topic)
        const totalPieces = draftsCount + approvedCount;
        const hoursSaved = (totalPieces * 1.5) + (topicsCount * 0.5);

        // 5. Fetch 3 most recent active pipeline pieces
        const recentPieces = await prisma.contentPiece.findMany({
            where: {
                brandProfileId: targetBrandId,
                status: { in: ['idea', 'draft', 'review'] }
            },
            orderBy: { updatedAt: 'desc' },
            take: 3
        });

        return NextResponse.json({
            success: true,
            stats: { draftsCount, approvedCount, topicsCount, hoursSaved },
            recentPieces
        });

    } catch (e: any) {
        console.error('Fetch Dashboard Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

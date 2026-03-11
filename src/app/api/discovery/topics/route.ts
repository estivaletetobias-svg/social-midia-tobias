import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = Number(searchParams.get('limit')) || 20;
        const brandId = searchParams.get('brandId');

        let targetBrandId = brandId;

        if (!targetBrandId) {
            const firstBrand = await prisma.brandProfile.findFirst();
            if (!firstBrand) {
                return NextResponse.json({ error: 'No brand profile found. Create one first.' }, { status: 400 });
            }
            targetBrandId = firstBrand.id;
        }

        // Fetch ideas that haven't been approved/used yet
        const topics = await prisma.topicCandidate.findMany({
            where: {
                brandProfileId: targetBrandId,
                status: 'suggestion',
            },
            orderBy: {
                createdAt: 'desc', // Newest first
            },
            take: limit,
        });

        return NextResponse.json({ success: true, data: topics });
    } catch (error: any) {
        console.error('Failed to fetch topics:', error.message);
        return NextResponse.json({ error: 'Failed to fetch topic suggestions' }, { status: 500 });
    }
}

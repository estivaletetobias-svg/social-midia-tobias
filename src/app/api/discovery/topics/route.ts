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

        // Mark them as not new anymore (asynchronously for better performance)
        // @ts-ignore
        const newIds = topics.filter(t => (t as any).isNew).map(t => t.id);
        if (newIds.length > 0) {
            // @ts-ignore
            prisma.topicCandidate.updateMany({
                where: { id: { in: newIds } },
                data: { isNew: false }
            }).catch(e => console.error('Failed to mark topics as seen:', e));
        }

        return NextResponse.json({ success: true, data: topics });
    } catch (error: any) {
        console.error('Failed to fetch topics:', error.message);
        return NextResponse.json({ error: 'Failed to fetch topic suggestions' }, { status: 500 });
    }
}

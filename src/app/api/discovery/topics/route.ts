import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = Number(searchParams.get('limit')) || 20;

        // For MVP, we fetch for the first active brand profile
        const firstBrand = await prisma.brandProfile.findFirst();

        if (!firstBrand) {
            return NextResponse.json({ error: 'No brand profile found. Create one first.' }, { status: 400 });
        }

        // Fetch ideas that haven't been approved/used yet
        const topics = await prisma.topicCandidate.findMany({
            where: {
                brandProfileId: firstBrand.id,
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

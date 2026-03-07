import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const topic = await prisma.topicCandidate.findUnique({ where: { id } });
        if (!topic) {
            return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
        }

        // Move the candidate to approved
        await prisma.topicCandidate.update({
            where: { id },
            data: { status: 'approved' }
        });

        // Create a Content Piece out of this idea
        const piece = await prisma.contentPiece.create({
            data: {
                brandProfileId: topic.brandProfileId,
                topicId: topic.id,
                title: topic.title,
                platform: topic.platform,
                format: topic.format,
                goal: topic.summary,
                status: 'idea', // It goes into the "Ideas/Brainstorming" phase of the Pipeline
            }
        });

        return NextResponse.json({ success: true, piece });
    } catch (e: any) {
        console.error('Approve Topic Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

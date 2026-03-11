import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const { platforms, format } = body; 
        
        const topic = await prisma.topicCandidate.findUnique({ where: { id } });
        if (!topic) {
            return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
        }

        if (topic.status === 'approved') {
            return NextResponse.json({ success: true, message: 'Já aprovado anteriormente.' });
        }

        // Move the candidate to approved
        await prisma.topicCandidate.update({
            where: { id },
            data: { status: 'approved' }
        });

        const targetPlatforms = (platforms && platforms.length > 0) ? platforms : [topic.platform];
        const targetFormat = format || topic.format || 'carousel';

        // Create Content Pieces for each requested platform
        const pieces = await Promise.all(targetPlatforms.map((plat: string) => 
            prisma.contentPiece.create({
                data: {
                    brandProfileId: topic.brandProfileId,
                    topicId: topic.id,
                    title: topic.title,
                    platform: plat,
                    format: targetFormat,
                    goal: topic.summary,
                    status: 'idea',
                }
            })
        ));

        return NextResponse.json({ success: true, pieces });
    } catch (e: any) {
        console.error('Approve Topic Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

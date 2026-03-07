import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const { newDate } = body;

        if (!newDate) {
            return NextResponse.json({ error: 'Data não informada' }, { status: 400 });
        }

        // Verifica o post
        const content = await prisma.contentPiece.findUnique({
            where: { id },
            include: { publishingJob: true }
        });

        if (!content) {
            return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
        }

        const scheduledAt = new Date(newDate);

        // Atualiza ou cria o publishing job
        if (content.publishingJob) {
            await prisma.publishingJob.update({
                where: { id: content.publishingJob.id },
                data: { scheduledAt }
            });
        } else {
            await prisma.publishingJob.create({
                data: {
                    contentPieceId: id,
                    scheduledAt,
                    status: 'pending'
                }
            });
        }

        return NextResponse.json({ success: true, message: "Data atualizada" });
    } catch (e: any) {
        console.error('Update Calendar Date Error:', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

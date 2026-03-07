import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const piece = await prisma.contentPiece.findUnique({
            where: { id },
            include: {
                versions: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            }
        });

        if (!piece) {
            return NextResponse.json({ error: 'Content not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, piece });
    } catch (e: any) {
        console.error('Fetch Content Error:', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // Limpeza em cascata manual das tabelas dependentes
        await prisma.contentVersion.deleteMany({ where: { contentPieceId: id } });
        await prisma.asset.deleteMany({ where: { contentPieceId: id } });
        await prisma.approvalLog.deleteMany({ where: { contentPieceId: id } });
        await prisma.publishingJob.deleteMany({ where: { contentPieceId: id } });

        // Apagar a peça original
        await prisma.contentPiece.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: "Deleted" });
    } catch (e: any) {
        console.error('Delete Content Error:', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();

        if (body.status) {
            const updated = await prisma.contentPiece.update({
                where: { id },
                data: { status: body.status }
            });
            return NextResponse.json({ success: true, piece: updated });
        }

        return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    } catch (e: any) {
        console.error('Update Content Error:', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

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

        // Ensure we delete dependencies like content versions if needed
        // Since we have an MVP, let's delete the content piece (cascade should handle or we do it manually, let's check prisma schema)
        await prisma.contentPiece.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: "Deleted" });
    } catch (e: any) {
        console.error('Delete Content Error:', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

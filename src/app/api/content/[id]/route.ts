import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;

        const piece = await prisma.contentPiece.findUnique({
            where: { id },
            include: {
                assets: true,
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

        // Security Check: Does this piece belong to the user's brand/workspace?
        const canAccess = (session.user as any).role === 'admin' || piece.brandProfileId === (session.user as any).brandId;
        if (!canAccess) {
            return NextResponse.json({ error: 'Acesso negado a este conteúdo.' }, { status: 403 });
        }

        return NextResponse.json({ success: true, piece });
    } catch (e: any) {
        console.error('Fetch Content Error:', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;

        // Security Check
        const piece = await prisma.contentPiece.findUnique({ where: { id } });
        if (!piece) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        
        const canAccess = (session.user as any).role === 'admin' || piece.brandProfileId === (session.user as any).brandId;
        if (!canAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        // Limpeza em cascata
        await prisma.contentVersion.deleteMany({ where: { contentPieceId: id } });
        await prisma.asset.deleteMany({ where: { contentPieceId: id } });
        await prisma.approvalLog.deleteMany({ where: { contentPieceId: id } });

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
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;
        const body = await req.json();

        // Security Check
        const piece = await prisma.contentPiece.findUnique({ where: { id } });
        if (!piece) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        
        const canAccess = (session.user as any).role === 'admin' || piece.brandProfileId === (session.user as any).brandId;
        if (!canAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        if (body.versionId) {
            const currentVersion = await prisma.contentVersion.findUnique({ where: { id: body.versionId } });
            
            await prisma.contentVersion.update({
                where: { id: body.versionId },
                data: {
                    hook: body.hook,
                    body: body.body,
                    cta: body.cta,
                    caption: body.caption,
                    metadata: {
                        ...(typeof currentVersion?.metadata === 'object' ? currentVersion.metadata as any : {}),
                        selectedAssetId: body.assetId
                    }
                }
            });
        }

        if (body.status) {
            const updated = await prisma.contentPiece.update({
                where: { id },
                data: { status: body.status }
            });
            return NextResponse.json({ success: true, piece: updated });
        }

        return NextResponse.json({ success: true, message: 'Updated' });
    } catch (e: any) {
        console.error('Update Content Error:', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

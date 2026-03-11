import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { VisualEngineService } from '@/services/image/VisualEngineService';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const { provider = 'OPENAI' } = body;

        const contentPiece = await prisma.contentPiece.findUnique({
            where: { id },
            include: {
                versions: { orderBy: { createdAt: 'desc' }, take: 1 }
            }
        });

        if (!contentPiece || contentPiece.versions.length === 0) {
            return NextResponse.json({ error: 'Conteúdo ou rascunho não encontrado.' }, { status: 404 });
        }

        const latestVersion = contentPiece.versions[0];

        // Ensure metadata has the provider
        await prisma.contentVersion.update({
            where: { id: latestVersion.id },
            data: {
                metadata: {
                    ...(latestVersion.metadata as object || {}),
                    provider
                }
            }
        });

        // Use our universal Visual Engine
        const asset = await VisualEngineService.generateImage(latestVersion.id);

        return NextResponse.json({ success: true, asset });
    } catch (error: any) {
        console.error("Image Generation Route Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

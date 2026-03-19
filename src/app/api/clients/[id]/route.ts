import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;

        // Cascade delete everything related to this brand
        // Note: Prisma might handle some via 'onDelete: Cascade' if defined, but being safe here
        await prisma.contentPiece.deleteMany({ where: { brandProfileId: id } });
        await prisma.knowledgeItem.deleteMany({ where: { brandProfileId: id } });
        await prisma.editorialPillar.deleteMany({ where: { brandProfileId: id } });
        await prisma.audienceSegment.deleteMany({ where: { brandProfileId: id } });
        await prisma.socialProfile.deleteMany({ where: { brandProfileId: id } });
        
        // Delete users associated with this brand
        await prisma.user.deleteMany({ where: { brandId: id } });

        // Finally delete the brand
        await prisma.brandProfile.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();

        const updated = await prisma.brandProfile.update({
            where: { id },
            data: {
                isActive: body.isActive !== undefined ? body.isActive : true,
                status: body.isActive === false ? 'suspended' : 'active'
            }
        });

        return NextResponse.json({ success: true, brand: updated });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

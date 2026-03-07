import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const brand = await prisma.brandProfile.findFirst();
        if (!brand) return NextResponse.json({ success: true, assets: [] });

        const assets = await prisma.asset.findMany({
            where: { brandProfileId: brand.id },
            orderBy: { createdAt: 'desc' },
            include: { contentPiece: true }
        });

        return NextResponse.json({ success: true, assets });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

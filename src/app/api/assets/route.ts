import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const brandId = searchParams.get('brandId');

        let targetBrandId = brandId;

        if (!targetBrandId) {
            const firstBrand = await prisma.brandProfile.findFirst();
            if (!firstBrand) return NextResponse.json({ success: true, assets: [] });
            targetBrandId = firstBrand.id;
        }

        const assets = await (prisma as any).asset.findMany({
            where: { brandProfileId: targetBrandId },
            orderBy: { createdAt: 'desc' },
            include: { contentPiece: true }
        });

        return NextResponse.json({ success: true, assets });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const brandId = searchParams.get('brandId');

        let targetBrandId = brandId;

        if (!targetBrandId) {
            const firstBrand = await prisma.brandProfile.findFirst();
            if (!firstBrand) {
                return NextResponse.json({ error: 'Nenhum perfil de marca encontrado.' }, { status: 400 });
            }
            targetBrandId = firstBrand.id;
        }

        const whereClause: any = { brandProfileId: targetBrandId };
        if (status && status !== 'All') {
            whereClause.status = status;
        }

        const pieces = await prisma.contentPiece.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                topic: true,
                versions: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            }
        });

        return NextResponse.json({ success: true, pieces });
    } catch (e: any) {
        console.error('Fetch Content Pipeline Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

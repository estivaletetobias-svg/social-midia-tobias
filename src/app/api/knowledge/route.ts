import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const brandId = searchParams.get('brandId');

        let targetBrandId = brandId;

        if (!targetBrandId) {
            const firstBrand = await prisma.brandProfile.findFirst();
            if (!firstBrand) {
                return NextResponse.json({ error: 'Nenhum perfil de marca encontrado.' }, { status: 400 });
            }
            targetBrandId = firstBrand.id;
        }

        const items = await prisma.knowledgeItem.findMany({
            where: { brandProfileId: targetBrandId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, items });
    } catch (error: any) {
        console.error("Knowledge GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        let { title, content, sourceUrl, type, tags, brandId } = body;

        let targetBrandId = brandId;

        if (!targetBrandId) {
            const firstBrand = await prisma.brandProfile.findFirst();
            if (!firstBrand) {
                return NextResponse.json({ error: 'Nenhum perfil de marca encontrado.' }, { status: 400 });
            }
            targetBrandId = firstBrand.id;
        }

        if (!title || !content) {
            return NextResponse.json({ error: 'Título e Conteúdo são obrigatórios.' }, { status: 400 });
        }

        const newItem = await prisma.knowledgeItem.create({
            data: {
                brandProfileId: targetBrandId,
                title,
                content,
                sourceUrl: sourceUrl || null,
                type: type || 'Note',
                tags: tags || [],
            }
        });

        return NextResponse.json({ success: true, item: newItem });
    } catch (error: any) {
        console.error("Knowledge POST Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

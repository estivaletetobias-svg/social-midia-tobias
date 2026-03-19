import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        // Prioritize brandId from session if it exists, otherwise from query
        const activeBrandId = (session.user as any).brandId || searchParams.get('brandId');

        if (!activeBrandId) {
            return NextResponse.json({ error: 'Nenhum perfil de marca selecionado.' }, { status: 400 });
        }

        const items = await prisma.knowledgeItem.findMany({
            where: { brandProfileId: activeBrandId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, items });
    } catch (error: any) {
        console.error("Knowledge GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json().catch(() => ({}));
        let { title, content, sourceUrl, type, tags, brandId } = body;

        const targetBrandId = brandId || (session.user as any).brandId;

        if (!targetBrandId) {
            return NextResponse.json({ error: 'Nenhum perfil de marca selecionado.' }, { status: 400 });
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

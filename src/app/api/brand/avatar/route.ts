import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const brand = await prisma.brandProfile.findFirst();
        return NextResponse.json({ success: true, avatarUrl: brand?.avatarUrl });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { avatarUrl } = await req.json();
        const brand = await prisma.brandProfile.findFirst();

        if (!brand) {
            return NextResponse.json({ error: 'Nenhum perfil de marca encontrado.' }, { status: 404 });
        }

        const updated = await prisma.brandProfile.update({
            where: { id: brand.id },
            data: { avatarUrl }
        });

        return NextResponse.json({ success: true, avatarUrl: updated.avatarUrl });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

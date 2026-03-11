import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { image: true } as any
        });

        return NextResponse.json({ success: true, avatarUrl: (user as any)?.image });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { avatarUrl } = await req.json();

        const updated = await prisma.user.update({
            where: { email: session.user.email },
            data: { image: avatarUrl } as any
        });

        return NextResponse.json({ success: true, avatarUrl: (updated as any).image });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

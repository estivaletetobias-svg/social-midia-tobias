import { NextResponse } from 'next/server';
import { MultiplexerService } from '@/services/content/MultiplexerService';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;

        await MultiplexerService.multiplexKnowledgeItem(id);

        return NextResponse.json({ success: true, message: "Material Clonado com Sucesso" });
    } catch (e: any) {
        console.error('Multiplex Error:', e);
        return NextResponse.json({ error: e.message || 'Error occurred' }, { status: 500 });
    }
}

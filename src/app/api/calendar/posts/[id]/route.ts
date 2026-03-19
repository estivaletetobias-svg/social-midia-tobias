import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const { newDate } = body;

        if (!newDate) {
            return NextResponse.json({ error: 'Data não informada' }, { status: 400 });
        }

        // Atualiza a data de agendamento diretamente na peça de conteúdo
        await prisma.contentPiece.update({
            where: { id },
            data: { 
                scheduledAt: new Date(newDate),
                status: 'scheduled' // Opcional: já marca como agendado ao mover no calendário
            }
        });

        return NextResponse.json({ success: true, message: "Data atualizada" });
    } catch (e: any) {
        console.error('Update Calendar Date Error:', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

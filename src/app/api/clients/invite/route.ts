import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    
    // Security: Only admins can invite clients
    if (!session || (session.user as any).role !== 'admin') {
        return NextResponse.json({ error: 'Acesso restrito ao Administrador STELAR.' }, { status: 403 });
    }

    try {
        const { email, brandName } = await req.json();

        if (!email || !brandName) {
            return NextResponse.json({ error: 'Email e Nome da Marca são obrigatórios.' }, { status: 400 });
        }

        const workspaceId = (session.user as any).workspaceId;

        // 1. Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: 'Este email já está cadastrado no sistema.' }, { status: 400 });
        }

        // 2. Create the Brand Profile (The DNA space)
        const brand = await prisma.brandProfile.create({
            data: {
                workspaceId,
                name: brandName,
                description: "",
                toneOfVoice: "",
                writingRules: [],
            }
        });

        // 3. Create the Client User
        const tempPassword = Math.random().toString(36).slice(-8); // Generate a random 8-char password
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const newUser = await prisma.user.create({
            data: {
                email,
                name: brandName,
                password: hashedPassword,
                role: 'client',
                workspaceId,
                brandId: brand.id
            } as any
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Cliente convidado com sucesso!',
            clientInfo: {
                email: newUser.email,
                tempPassword,
                brandId: brand.id
            }
        });

    } catch (error: any) {
        console.error('Invite Client Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

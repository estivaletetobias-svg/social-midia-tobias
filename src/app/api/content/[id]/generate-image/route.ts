import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;

        const contentPiece = await prisma.contentPiece.findUnique({
            where: { id },
            include: {
                versions: { orderBy: { createdAt: 'desc' }, take: 1 },
                assets: true
            }
        });

        if (!contentPiece || contentPiece.versions.length === 0) {
            return NextResponse.json({ error: 'Conteúdo ou rascunho não encontrado.' }, { status: 404 });
        }

        const latestVersion = contentPiece.versions[0];

        if (!latestVersion.imagePrompt) {
            return NextResponse.json({ error: 'Nenhum prompt visual gerado para este post.' }, { status: 400 });
        }

        // Enhance prompt for strict ultra-realism
        const enhancedPrompt = `A candid, authentic, ultra-realist photography. Raw unedited look, natural lighting, looking like a real post. NOT a 3D render, NOT an illustration, NO cartoons, NO text. ${latestVersion.imagePrompt}`;

        // Call DALL-E 3
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: enhancedPrompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            style: "natural" // This forces DALL-E to avoid vector/illustration presets
        });

        const imageUrl = response?.data?.[0]?.url;

        if (!imageUrl) {
            throw new Error('Falha ao obter a URL da imagem da OpenAI.');
        }

        // Save as Asset in DB
        const asset = await prisma.asset.create({
            data: {
                brandProfileId: contentPiece.brandProfileId,
                contentPieceId: id,
                type: 'image',
                url: imageUrl || '',
                key: `generated-${Date.now()}`,
                prompt: latestVersion.imagePrompt,
                model: 'dall-e-3'
            }
        });

        return NextResponse.json({ success: true, asset });
    } catch (error: any) {
        console.error("DALL-E Generation Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

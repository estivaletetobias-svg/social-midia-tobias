import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { VisualSearchService } from '@/services/image/VisualSearchService';

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const body = await req.json().catch(() => ({}));
        const { query, action, imageUrl, source } = body;

        // Ensure the post exists
        const contentPiece = await prisma.contentPiece.findUnique({
            where: { id }
        });

        if (!contentPiece) {
            return NextResponse.json({ error: 'Conteúdo não encontrado.' }, { status: 404 });
        }

        // Search Action
        if (action === 'search') {
            if (!query) return NextResponse.json({ error: 'Falta o termo de busca.' }, { status: 400 });

            // Perform searches in parallel
            const [googleResults, unsplashResults] = await Promise.all([
                VisualSearchService.searchGoogle(query),
                VisualSearchService.searchUnsplash(query)
            ]);

            // Combine and prioritize high-quality Unsplash results
            const combinedResults = [...unsplashResults, ...googleResults];

            return NextResponse.json({
                success: true,
                results: combinedResults.slice(0, 30)
            });
        }

        // Save Action
        if (action === 'save') {
            if (!imageUrl) return NextResponse.json({ error: 'URL da imagem é necessária.' }, { status: 400 });

            // Save as Asset in DB
            const asset = await prisma.asset.create({
                data: {
                    brandProfileId: contentPiece.brandProfileId,
                    contentPieceId: id,
                    type: 'image',
                    url: imageUrl,
                    key: `google-${Date.now()}`,
                    prompt: query || 'Google Image Search',
                    model: 'google-images'
                }
            });

            return NextResponse.json({ success: true, asset });
        }

        return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });

    } catch (error: any) {
        console.error("Google Image Search Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

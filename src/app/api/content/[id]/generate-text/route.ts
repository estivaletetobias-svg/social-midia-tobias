import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ContentGenerationService, GenerationRequest } from '@/services/content/ContentGenerationService';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json().catch(() => ({}));
        const { provider = 'OPENAI' } = body;

        const piece = await prisma.contentPiece.findUnique({ where: { id } });

        if (!piece) {
            return NextResponse.json({ error: 'Conteúdo não encontrado' }, { status: 404 });
        }

        const requestPayload: GenerationRequest = {
            brandProfileId: piece.brandProfileId,
            topicId: piece.topicId || undefined,
            goal: piece.goal || '',
            platform: piece.platform as any,
            format: piece.format as any,
            provider: provider,
        };

        // Call the AI Service - this re-runs the whole copy pipeline
        const generatedDraft = await ContentGenerationService.generateDraft(requestPayload);

        // Save a new Version
        const version = await prisma.contentVersion.create({
            data: {
                contentPieceId: id,
                headline: generatedDraft.copy.headline,
                hook: generatedDraft.copy.hook,
                body: generatedDraft.copy.body,
                caption: generatedDraft.copy.caption,
                cta: generatedDraft.copy.cta,
                hashtags: generatedDraft.copy.hashtags,
                imagePrompt: generatedDraft.copy.imagePrompt,
                visualConcept: generatedDraft.copy.visualConcept,
                metadata: {
                    strategy: generatedDraft.strategy,
                    structure: generatedDraft.structure,
                    brandValidation: generatedDraft.brandValidation,
                    slides: generatedDraft.copy.slides,
                    videoScenes: generatedDraft.copy.videoScenes,
                    provider: provider
                }
            }
        });

        return NextResponse.json({ success: true, version });
    } catch (e: any) {
        console.error('Text Generation Error:', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ContentGenerationService, GenerationRequest } from '@/services/content/ContentGenerationService';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const piece = await prisma.contentPiece.findUnique({ where: { id } });

        if (!piece) {
            return NextResponse.json({ error: 'Content not found' }, { status: 404 });
        }

        const requestPayload: GenerationRequest = {
            brandProfileId: piece.brandProfileId,
            topicId: piece.topicId || undefined,
            goal: piece.goal || '',
            platform: piece.platform as any,
            format: piece.format as any,
        };

        // Call the AI Service
        const generatedDraft = await ContentGenerationService.generateDraft(requestPayload);

        // Update piece to draft status
        await prisma.contentPiece.update({
            where: { id },
            data: { status: 'draft' }
        });

        // Save the generated Version mapping all copy attributes
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
                }
            }
        });

        return NextResponse.json({ success: true, piece, version });
    } catch (e: any) {
        console.error('Generation Error:', e.message);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TopicDiscoveryService } from '@/services/discovery/TopicDiscoveryService';

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { text, brandId } = body;

        let brand;
        if (brandId) {
            brand = await prisma.brandProfile.findUnique({
                where: { id: brandId }
            });
        } else {
            brand = await prisma.brandProfile.findFirst();
        }

        if (!brand) {
            return NextResponse.json({ error: 'Nenhum DNA configurado.' }, { status: 400 });
        }

        // We use our existing AI to evaluate and format the user's manual idea
        const contextualNews = `Anotação ou ideia livre do usuário: ${text}`;
        const aiSuggestion = await TopicDiscoveryService.evaluateNewsAgainstBrand(brand.id, contextualNews);

        // Even if the AI thinks it's strictly not relevant to news, if the user requested it manually, 
        // we coerce it into a topic using the AI's headline formatting if available.
        const candidate = await prisma.topicCandidate.create({
            data: {
                brandProfileId: brand.id,
                title: aiSuggestion.proposedHeadline || "Ideia Avulsa (Em Rascunho)",
                summary: aiSuggestion.proposedSummary || text,
                relevanceScore: aiSuggestion.score || 0.9,
                alignmentScore: aiSuggestion.score || 0.9,
                platform: aiSuggestion.recommendedPlatform || "Instagram",
                format: aiSuggestion.recommendedFormat || "short post",
                status: 'suggestion',
            }
        });

        return NextResponse.json({ success: true, candidate });
    } catch (e: any) {
        console.error('Manual Idea Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

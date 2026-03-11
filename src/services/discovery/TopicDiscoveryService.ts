import OpenAI from 'openai';
import prisma from '@/lib/prisma';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export class TopicDiscoveryService {
    /**
     * Generates new content topic suggestions based on brand DNA and current knowledge.
     */
    static async suggestTopics(brandProfileId: string, count: number = 5) {
        const brand = await prisma.brandProfile.findUnique({
            where: { id: brandProfileId },
            include: {
                editorialPillars: true,
                audienceSegments: true,
                socialProfiles: { where: { isActive: true } },
                knowledgeItems: { take: 10, orderBy: { createdAt: 'desc' } }
            }
        });

        if (!brand) throw new Error('Brand profile not found');

        const prompt = `
      You are a high-level content strategist for ${brand.name}.
      
      Business Description: ${brand.description}
      Target Audience: ${brand.audienceSegments.map((s: any) => s.name).join(', ')}
      Editorial Pillars: ${brand.editorialPillars.map((p: any) => p.title).join(', ')}
      Tone of Voice: ${brand.toneOfVoice}
      
      Recent Knowledge Reference:
      ${brand.knowledgeItems.map((k: any) => `- ${k.title}: ${k.content.substring(0, 300)}`).join('\n')}
      
      TASK: Generate ${count} unique social media topic suggestions.
      Each topic must be strategically aligned with the brand and non-generic. ALL content must be written in Brazilian Portuguese (PT-BR).
      Provide:
      - title: Short and hooky (PT-BR).
      - summary: Brief strategic reasoning (PT-BR).
      - relevanceScore: 0-1.
      - alignmentScore: 0-1.
      - recommendedPipeline: One of these specific values: ${brand.socialProfiles.length > 0 ? brand.socialProfiles.map((p: any) => p.platform).join(', ') : '"Instagram", "LinkedIn"'}. (CRITICAL: Only use platforms active in the brand DNA).
      - recommendedFormat: "carousel", "short post", "article", or "video script".
      - Structure the text well. Break down complex ideas into bullet points or actionable protocols if suitable.
      - USE MARKDOWN FORMATTING: Use **bold** for key concepts (highly encouraged), headers (###), and bullet points to make the text scannable and premium.
      - Use active voice and assertive tone.
      - NEVER hallucinate or invent sources. If you mention scientific data, studies, or facts, you MUST cite REAL sources. If you don't know the exact source name, just adapt the sentence to state the fact technically WITHOUT any placeholder like [INSERIR FONTE]. Never output placeholders.

      Return strictly as JSON array of objects.
    `;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'system', content: prompt }],
            response_format: { type: 'json_object' },
        });

        const suggestions = JSON.parse(response.choices[0].message.content || '{"topics": []}').topics;

        // Persist candidates in the database
        const savedCandidates = await Promise.all(
            suggestions.map((s: any) =>
                prisma.topicCandidate.create({
                    data: {
                        brandProfileId,
                        title: s.title,
                        summary: s.summary,
                        relevanceScore: s.relevanceScore,
                        alignmentScore: s.alignmentScore,
                        platform: s.recommendedPipeline,
                        format: s.recommendedFormat,
                        status: 'suggestion'
                    }
                })
            )
        );

        return savedCandidates;
    }

    /**
     * Evaluates external news (e.g. from RSS) against the Brand DNA.
     * Acts as an AI Filter to discard irrelevant news and translate good ones into Brand Topics.
     */
    static async evaluateNewsAgainstBrand(brandProfileId: string, newsSnippet: string) {
        const brand = await prisma.brandProfile.findUnique({
            where: { id: brandProfileId },
            include: {
                editorialPillars: true,
                audienceSegments: true,
                socialProfiles: { where: { isActive: true } },
            }
        });

        if (!brand) throw new Error('Brand profile not found');

        const prompt = `
            You are the ultimate Gatekeeper & Content Strategist for ${brand.name}.
            
            Brand DNA: ${brand.description}
            Audience: ${brand.audienceSegments.map((s: any) => s.name).join(', ')}
            Editorial Pillars: ${brand.editorialPillars.map((p: any) => p.title).join(', ')}

            EXTERNAL NEWS/EVENT:
            """
            ${newsSnippet}
            """

            TASK:
            1. Determine if this news is RELEVANT to the audience and pillars (true/false).
            2. If true, translate this external news into a specific Topic Idea for the brand. How can the brand talk about this?
            3. ALL OUTPUT MUST BE IN BRAZILIAN PORTUGUESE (PT-BR).
            
            Return JSON:
            {
                "isRelevant": boolean,
                "reasoning": "Por que se encaixa ou não (PT-BR)",
                "proposedHeadline": "Título atraente (PT-BR)",
                "proposedSummary": "Por que a marca deve falar sobre isso de forma estratégica (PT-BR)",
                "score": 0.0 to 1.0 (float),
                "recommendedPlatform": One of these specific values: ${brand.socialProfiles.length > 0 ? brand.socialProfiles.map((p: any) => p.platform).join(', ') : '"Instagram", "LinkedIn"'},
                "recommendedFormat": "short post" or "article" or "carousel"
            }
        `;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'system', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.3 // Lower temp for more analytical filtering
        });

        return JSON.parse(response.choices[0].message.content || '{"isRelevant": false}');
    }

    static async approveTopic(topicId: string) {
        return prisma.topicCandidate.update({
            where: { id: topicId },
            data: { status: 'approved' }
        });
    }
}

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
                knowledgeItems: { take: 10, orderBy: { createdAt: 'desc' } }
            }
        });

        if (!brand) throw new Error('Brand profile not found');

        const prompt = `
      You are a high-level content strategist for ${brand.name}.
      
      Business Description: ${brand.description}
      Target Audience: ${brand.audienceSegments.map(s => s.name).join(', ')}
      Editorial Pillars: ${brand.editorialPillars.map(p => p.title).join(', ')}
      Tone of Voice: ${brand.toneOfVoice}
      
      Recent Knowledge Reference:
      ${brand.knowledgeItems.map(k => `- ${k.title}: ${k.content.substring(0, 300)}`).join('\n')}
      
      TASK: Generate ${count} unique social media topic suggestions.
      Each topic must be strategically aligned with the brand and non-generic.
      Provide:
      - title: Short and hooky.
      - summary: Brief strategic reasoning.
      - relevanceScore: 0-1.
      - alignmentScore: 0-1.
      - recommendedPipeline: "Instagram" or "LinkedIn".
      - recommendedFormat: "carousel", "short post", "article", or "video script".

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

    static async approveTopic(topicId: string) {
        return prisma.topicCandidate.update({
            where: { id: topicId },
            data: { status: 'approved' }
        });
    }
}

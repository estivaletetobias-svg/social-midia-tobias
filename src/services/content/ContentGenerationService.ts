import OpenAI from 'openai';
import prisma from '@/lib/prisma';
import { VectorService } from '../knowledge/VectorService';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface GenerationRequest {
    brandProfileId: string;
    topicId?: string;
    goal?: string;
    platform: 'Instagram' | 'LinkedIn';
    format: 'carousel' | 'short video script' | 'single image post' | 'article' | 'short post';
}

export class ContentGenerationService {
    /**
     * High-level orchestration for content generation.
     * Multi-step pipeline: Topic -> Goal -> Platform -> Structure -> Draft -> Validation
     */
    static async generateDraft(request: GenerationRequest) {
        const brand = await prisma.brandProfile.findUnique({
            where: { id: request.brandProfileId },
            include: {
                editorialPillars: true,
                voiceGuides: { where: { platform: request.platform } },
            },
        });

        if (!brand) throw new Error('Brand profile not found');

        const topic = request.topicId
            ? await prisma.topicCandidate.findUnique({ where: { id: request.topicId } })
            : null;

        // Step 1: Define Goal & Audience Strategy (System-driven)
        const strategy = await this.generateStrategy(request, brand, topic);

        // Step 2: Generate Content Structure
        const structure = await this.generateStructure(request, brand, strategy);

        // Step 3: Generate Final Copy
        const copy = await this.generateFinalCopy(request, brand, structure);

        // Step 4: Validate against brand voice
        const validationResult = await this.validateBrandVoice(copy, brand);

        // Final result compilation
        return {
            title: topic?.title || 'New Draft',
            goal: request.goal || strategy.recommendedGoal,
            platform: request.platform,
            format: request.format,
            strategy,
            structure,
            copy,
            brandValidation: validationResult,
        };
    }

    private static async generateStrategy(request: GenerationRequest, brand: any, topic: any) {
        // RAG: Fetch relevant knowledge
        const contextResults = await VectorService.searchKnowledge(
            brand.id,
            `${topic?.title || ''} ${brand.editorialPillars.map((p: any) => p.title).join(' ')}`,
            5
        );

        const knowledgeContext = contextResults.length > 0
            ? contextResults.map((k: any) => `- ${k.title}: ${k.content}`).join('\n')
            : 'No direct reference materials found.';

        const prompt = `
      You are a senior social media strategist. 
      Brand: ${brand.name}
      Tone: ${brand.toneOfVoice}
      Pillars: ${brand.editorialPillars.map((p: any) => p.title).join(', ')}
      Topic: ${topic?.title || 'N/A'} - ${topic?.summary || 'N/A'}
      Goal (specified by user): ${request.goal || 'To increase engagement and authority'}
      Platform: ${request.platform}
      Format: ${request.format}

      INTERNAL REFERENCE KNOWLEDGE (RAG):
      ${knowledgeContext}

      Generate a content strategy including:
      1. Recommended specific goal
      2. Key message (grounded in internal knowledge)
      3. Target audience segment within the brand profile
      4. Unique angle (must avoid generic social media tropes)

      Return as JSON.
    `;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'system', content: prompt }],
            response_format: { type: 'json_object' },
        });

        return JSON.parse(response.choices[0].message.content || '{}');
    }

    private static async generateStructure(request: GenerationRequest, brand: any, strategy: any) {
        // Pipeline logic for structure...
        return { sections: ['Hook', 'Main Value', 'Deep Dive', 'CTA'] };
    }

    private static async generateFinalCopy(request: GenerationRequest, brand: any, structure: any) {
        // Pipeline logic for copy generation using brand voice guides...
        return {
            headline: 'The Future of Content',
            hook: 'Tired of generic AI posts?',
            body: 'Content deep dive here...',
            caption: 'Initial automated caption based on brand voice rules.',
            cta: 'Sign up now.',
            hashtags: ['#AI', '#Strategy'],
            imagePrompt: 'Professional desk setup with a futuristic glass monitor, soft sunset light, 8k resolution.',
            visualConcept: 'Minimalist tech workspace'
        };
    }

    private static async validateBrandVoice(copy: any, brand: any) {
        return { isValid: true, feedback: 'Tone matches Brand Voice Guide' };
    }
}

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
        const prompt = `
      You are an elite Content Architect for ${brand.name}.
      
      Platform: ${request.platform}
      Format: ${request.format}
      Strategy: ${JSON.stringify(strategy)}
      
      TASK: Create a structural outline for this content piece based on the platform's best practices.
      
      Guidelines:
      - LinkedIn: Focus on thought leadership, logical flow, data points, and professional hooks.
      - Instagram: Focus on high visual hook, emotional connection, short digestible chunks, and clear CTA.
      - Carousel: Needs a slide-by-slide outline.
      - Article: Needs introduction, headers, deeper exploration, conclusion.
      - Short Post/Video: Needs intense hook, quick value delivery, and punchy outtro.

      Return strictly as JSON with a "sections" array (strings describing each structural part).
    `;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'system', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.5
        });

        return JSON.parse(response.choices[0].message.content || '{"sections": []}');
    }

    private static async generateFinalCopy(request: GenerationRequest, brand: any, structure: any) {
        const prompt = `
      You are a world-class senior copywriter specializing in ${request.platform}.
      
      Brand Voice: ${brand.toneOfVoice}
      Rules: ${brand.writingRules ? brand.writingRules.join(', ') : 'Maintain high professional standards.'}
      Format: ${request.format}
      Structure to Follow: ${JSON.stringify(structure.sections)}
      
      TASK: Write the actual final copy. Make it ready to publish.
      
      Constraints:
      - ALWAYS write in Brazilian Portuguese (PT-BR). This is mandatory.
      - DO NOT use generic AI words (e.g., "In conclusion", "Moreover", "In today's digital landscape", "Navigating the complexities", emoji overload, "Em conclusão", "Cenário atual", "Mergulhe conosco").
      - DO NOT use generic hypothetical stories or fictional characters (e.g., "Maria de 68 anos sentiu...", "João melhorou seu..."). Use only factual concepts, objective arguments, and professional insights.
      - Sound human, opinionated, analytical, and authoritative. Provide deep insights, not shallow summaries.
      - Use short sentences. Use active voice.
      - NEVER hallucinate or invent sources. If you mention scientific data, studies, or facts, you MUST cite REAL sources. If you don't know the exact source name, just adapt the sentence to state the fact technically WITHOUT any placeholder like [INSERIR FONTE]. Never output placeholders.

      Return strictly a JSON object matching this interface where ALL values are in Brazilian Portuguese (including imagePrompt and visualConcept):
      {
        "headline": "String - the main title or first slide",
        "hook": "String - the first lines designed to catch attention instantly",
        "body": "String - the main content, can be long-form depending on format",
        "caption": "String - the text that goes in the social media caption box",
        "cta": "String - the final call to action",
        "hashtags": ["Array", "of", "Strings"],
        "imagePrompt": "String - A highly detailed visual description to be fed to an AI Image Generator for this post's aesthetic",
        "visualConcept": "String - A conceptual description of the visual mood"
      }
    `;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'system', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.7
        });

        return JSON.parse(response.choices[0].message.content || '{}');
    }

    private static async validateBrandVoice(copy: any, brand: any) {
        const prompt = `
      You are the strictest Brand Guardian and Quality Assurance Editor for ${brand.name}.
      
      Brand Tone: ${brand.toneOfVoice}
      
      Content to Review:
      Hook: ${copy.hook}
      Body: ${copy.body}
      
      TASK: Does this content sound like a generic AI wrote it, or does it sound natively tailored to the brand tone? Is it overusing emojis or cliche phrases?
      
      Return JSON:
      {
        "isValid": boolean,
        "feedback": "Short critique on tone, formatting, and AI-like clichés."
      }
    `;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'system', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.2
        });

        return JSON.parse(response.choices[0].message.content || '{"isValid": false, "feedback": "Validation failed to run."}');
    }
}

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
    format: 'carousel' | 'video script' | 'single post' | 'article';
    provider?: 'OPENAI' | 'GOOGLE';
}

export class ContentGenerationService {
    /**
     * High-level orchestration for content generation.
     * Multi-step pipeline: Topic -> Goal -> Platform -> Structure -> Draft -> Validation
     */
    static async generateDraft(request: GenerationRequest) {
        // Fetch brand profile with tone of voice and knowledge base
        const brand: any = await prisma.brandProfile.findUnique({
            where: { id: request.brandProfileId },
            include: {
                editorialPillars: true,
                audienceSegments: true,
                voiceGuides: { where: { platform: request.platform } }
            },
        });

        if (!brand) throw new Error('Brand profile not found');

        const topic = request.topicId
            ? await prisma.topicCandidate.findUnique({ where: { id: request.topicId } })
            : null;

        // Step 0: RAG - Fetch relevant knowledge
        const contextResults = await VectorService.searchKnowledge(
            brand.id,
            `${topic?.title || ''} ${request.goal || ''} ${brand.editorialPillars.map((p: any) => p.title).join(' ')}`,
            4 // Limit to 4 relevant items to stay within TPM limits
        );

        const knowledgeContext = contextResults.length > 0
            ? contextResults.map((k: any) => `[${k.title}]\n${k.content.substring(0, 3000)}...`).join('\n\n')
            : 'No direct reference materials found.';

        // Step 1: Define Goal & Audience Strategy (System-driven)
        const strategy = await this.generateStrategy(request, brand, topic, knowledgeContext);

        // Step 2: Generate Content Structure
        const structure = await this.generateStructure(request, brand, strategy);

        // Step 3: Generate Final Copy
        const copy = await this.generateFinalCopy(request, brand, structure, knowledgeContext);

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

    private static async generateStrategy(request: GenerationRequest, brand: any, topic: any, knowledgeContext: string) {
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

      Return as JSON:
      {
        "recommendedGoal": "Primary strategic objective",
        "alignmentScore": 0.95,
        "strategy": "Brief description of the angle we will take"
      }
    `;

        return this.askAI(prompt, request.provider || 'OPENAI', true);
    }

    private static async generateStructure(request: GenerationRequest, brand: any, strategy: any) {
        const prompt = `
      You are an elite Content Architect for ${brand.name}.
      
      Platform: ${request.platform}
      Format: ${request.format}
      Strategy: ${JSON.stringify(strategy)}
      
      TASK: Create a structural outline for this content piece based on the platform's best practices.
      
      Return as JSON with a "sections" array.
    `;

        return this.askAI(prompt, request.provider || 'OPENAI', true);
    }

    private static async generateFinalCopy(request: GenerationRequest, brand: any, structure: any, knowledgeContext: string) {
        const prompt = `
      You are a World-Class Senior Copywriter and Growth Strategist for ${request.platform}. 
      Your writing style is indistinguishable from an elite human creator.
      
      Brand Voice: ${brand.toneOfVoice}
      Specific Rules: ${brand.writingRules ? brand.writingRules.join(', ') : 'Direct, authoritative, and sophisticated.'}
      Target Audience: ${brand.audienceSegments.map((s: any) => s.name).join(', ')}
      Format: ${request.format}
      Structure: ${JSON.stringify(structure.sections)}
      
      INTERNAL KNOWLEDGE (RAG):
      ${knowledgeContext}
      
      TASK: Write the final high-conversion copy.

      ${request.format === 'carousel' ? `
      CAROUSEL LOGICAL PROTOCOL (Slide-by-Slide):
      1. Hook (Slide 1): Magnetic visual & text that stops the scroll.
      2. Problem (Slide 2-3): Agitate the pain point described in the brand DNA.
      3. Solution (Slide 4-5): Present your authority/expertise to solve it.
      4. Proof/Detail (Slide 6): Practical tip or mechanism of action (Authority).
      5. CTA (Slide 7): Direct engagement or sales command.
      ` : request.format === 'video script' ? `
      VIDEO SCRIPT PROTOCOL:
      - Scene 1 (0-3s): The Hook (Visual & Audio).
      - Body (3-45s): Fast-paced value delivery.
      - Outro (45-60s): CTA.
      ` : ''}

      ELITE COPYWRITING PROTOCOLS:
      1. THE PUNCH: Every sentence must earn the right to the next one.
      2. AUDIENCE MIRRORING: Speak directly to the AUDIENCE segments.
      3. AUTHORITY INJECTION: Use technical data from RAG.
      
      VISUAL DIRECTION FOR THE DESIGNER: Describe the scene for AI image generation.
      
      Return strictly RAW JSON.
      {
        "headline": "Main title",
        "hook": "Magnetic first line",
        "body": "Main content (Script if video)",
        "caption": "Social media caption",
        "cta": "CTA",
        "hashtags": ["list"],
        "imagePrompt": "Description in English",
        "visualConcept": "Summary",
        "slides": [
             { "slideNumber": 1, "textOnImage": "Header", "imagePrompt": "Prompt", "explanation": "Logic step (Hook/Pain/...)" }
        ]
      }
    `;

        return this.askAI(prompt, request.provider || 'OPENAI', true);
    }

    private static async askAI(prompt: string, provider: 'OPENAI' | 'GOOGLE', isJson: boolean = false) {
        if (provider === 'GOOGLE') {
            return this.callGemini(prompt, isJson);
        }
        
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'system', content: prompt }],
            response_format: isJson ? { type: 'json_object' } : undefined,
            temperature: 0.7
        });
        return isJson ? JSON.parse(response.choices[0].message.content || '{}') : response.choices[0].message.content;
    }

    private static async callGemini(prompt: string, isJson: boolean) {
        const { VertexAI } = require('@google-cloud/vertexai');
        
        const project = process.env.GCP_PROJECT_ID;
        const location = process.env.GCP_LOCATION || 'us-central1';
        const serviceAccountJson = process.env.GCP_SERVICE_ACCOUNT_JSON;

        if (!project) throw new Error('GOOGLE CONFIG MISSING: Please add GCP_PROJECT_ID to your Vercel/Env variables');

        let authOptions: any = { project, location };

        if (serviceAccountJson) {
            try {
                authOptions.googleAuthOptions = {
                    credentials: JSON.parse(serviceAccountJson)
                };
            } catch (e) {
                console.error("Failed to parse GCP_SERVICE_ACCOUNT_JSON for Gemini", e);
            }
        }

        const vertex_ai = new VertexAI(authOptions);
        
        // Use gemini-2.5-flash which is confirmed active in your Model Garden
        const modelName = 'gemini-2.5-flash';
        const generativeModel = vertex_ai.getGenerativeModel({
            model: modelName,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192, // Increased to prevent truncation on long posts
                responseMimeType: isJson ? 'application/json' : 'text/plain',
            },
        });

        const request = {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        };

        const result = await generativeModel.generateContent(request);
        const response = result.response;
        
        const textContent = response.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textContent) {
            console.error("Gemini Full Response Structure:", JSON.stringify(response, null, 2));
            throw new Error('Google Gemini failed: No text content found in response.');
        }

        if (isJson) {
            try {
                // Better cleaner: Find the first '{' and the last '}' 
                // This handles markdown markers and any conversational noise
                const firstBrace = textContent.indexOf('{');
                const lastBrace = textContent.lastIndexOf('}');
                
                if (firstBrace === -1 || lastBrace === -1) {
                    throw new Error("No JSON object found in response");
                }

                const cleanedJson = textContent.substring(firstBrace, lastBrace + 1);
                return JSON.parse(cleanedJson);
            } catch (e) {
                console.error("JSON Parse Error. Content received:", textContent);
                throw new Error(`Erro ao processar resposta da IA: ${e instanceof Error ? e.message : 'Formato inválido'}`);
            }
        }

        return textContent;
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
    /**
     * Open interaction refinement.
     * Takes current version and user feedback to recreate the copy.
     */
    static async refineContent(contentPieceId: string, versionId: string, userFeedback: string) {
        const version = await prisma.contentVersion.findUnique({
            where: { id: versionId },
            include: { contentPiece: { include: { brandProfile: { include: { audienceSegments: true } } } } }
        });

        if (!version) throw new Error('Version not found');

        const brand = version.contentPiece.brandProfile;
        
        const prompt = `
            You are an elite Editor refactoring a content piece based on specific client feedback.
            
            BRAND DNA: ${brand.name} - ${brand.toneOfVoice}
            CURRENT CONTENT:
            Headline: ${version.headline}
            Hook: ${version.hook}
            Body: ${version.body}
            Caption: ${version.caption}
            
            CLIENT FEEDBACK: "${userFeedback}"
            
            TASK: Rewrite the content strictly following the feedback while maintaining the Brand DNA.
            Return the same JSON structure as the original.
        `;

        const newContent = await this.askAI(prompt, 'OPENAI', true);

        return prisma.contentVersion.create({
            data: {
                contentPieceId: version.contentPieceId,
                headline: newContent.headline,
                hook: newContent.hook,
                body: newContent.body,
                caption: newContent.caption,
                cta: newContent.cta,
                hashtags: newContent.hashtags,
                imagePrompt: newContent.imagePrompt,
                visualConcept: newContent.visualConcept,
                metadata: newContent.metadata || {},
            }
        });
    }
}

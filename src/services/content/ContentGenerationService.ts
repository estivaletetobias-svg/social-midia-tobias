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

    private static extractText(content: any): string {
        if (!content) return '';
        if (typeof content === 'string') return content;
        if (Array.isArray(content)) {
            return content.map(item => this.extractText(item.content || item.text || item)).join('\n\n');
        }
        if (typeof content === 'object') {
            return this.extractText(content.content || content.text || content.body || JSON.stringify(content));
        }
        return String(content);
    }

    private static async generateFinalCopy(request: GenerationRequest, brand: any, structure: any, knowledgeContext: string) {
        const prompt = `
      You are a World-Class Senior Copywriter and Growth Strategist for ${request.platform}. 
      Your writing style is indistinguishable from an elite human creator.
      
      CRITICAL: The final content MUST be written in PORTUGUESE (Brazil). Do not use English.
      
      Brand Voice: ${brand.toneOfVoice}
      Specific Rules: ${brand.writingRules ? brand.writingRules.join(', ') : 'Direct, authoritative, and sophisticated.'}
      Target Audience: ${brand.audienceSegments.map((s: any) => s.name).join(', ')}
      Format: ${request.format}
      Structure: ${JSON.stringify(structure.sections)}
      
      INTERNAL KNOWLEDGE (RAG):
      ${knowledgeContext}
      
      TASK: Write the final high-conversion copy in Portuguese.

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
      
      VISUAL DIRECTION FOR THE DESIGNER: Describe the scene for AI image generation (this prompt can be in English).
      
      Return strictly RAW JSON.
      {
        "headline": "Main title (PT-BR)",
        "hook": "Magnetic first line (PT-BR)",
        "body": "Main content as a SINGLE STRING (PT-BR)",
        "caption": "Social media caption (PT-BR)",
        "cta": "CTA (PT-BR)",
        "hashtags": ["list"],
        "imagePrompt": "Description in English (for DALL-E/Midjourney)",
        "visualConcept": "Summary (PT-BR)",
        "slides": [
             { "slideNumber": 1, "textOnImage": "Header (PT-BR)", "imagePrompt": "Prompt (EN)", "explanation": "Logic step" }
        ]
      }
    `;

        const newContent = await this.askAI(prompt, request.provider || 'OPENAI', true);
        
        // Defensive: extract and join if structured, ensuring string values for Prisma
        return {
            ...newContent,
            body: this.extractText(newContent.body),
            caption: this.extractText(newContent.caption),
        };
    }

    private static async askAI(prompt: string, provider: 'OPENAI' | 'GOOGLE', isJson: boolean = false) {
        console.log(`[AI REQUEST] Provider: ${provider}, JSON: ${isJson}`);
        
        if (provider === 'GOOGLE') {
            return this.callGemini(prompt, isJson);
        }
        
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'system', content: prompt }],
            response_format: isJson ? { type: 'json_object' } : undefined,
            temperature: 0.7
        });

        const content = response.choices[0].message.content || '';
        
        if (!content || content.trim() === '') {
            console.error(`[AI ERROR] ${provider} returned an empty response.`);
            throw new Error(`${provider} retornou uma resposta vazia. Tente novamente.`);
        }

        console.log(`[AI RESPONSE] Length: ${content.length} chars`);

        if (isJson) {
            try {
                return this.safeJsonParse(content);
            } catch (e) {
                console.error(`[AI JSON ERROR] ${provider} JSON Parse Error. Content received:`, content);
                throw new Error(`Falha ao converter resposta da IA em JSON: ${e instanceof Error ? e.message : 'Formato inválido'}`);
            }
        }
        return content;
    }

    private static safeJsonParse(jsonString: string) {
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');
        
        if (firstBrace === -1 || lastBrace === -1) {
            throw new Error("Não foi encontrado um objeto JSON válido na resposta.");
        }

        let cleaned = jsonString.substring(firstBrace, lastBrace + 1);

        cleaned = cleaned
            .replace(/\r/g, '') // remove carriage returns
            .replace(/\n(?!(?:[^"]*"[^"]*")*[^"]*$)/g, '\\n') // experimental: double-escape newlines inside quotes
            .replace(/\\x/g, 'x') // remove invalid \x escapes
            .replace(/\\(?![bfnrtu"/\\\\])/g, ''); // Remove lone backslashes that don't escape a valid JSON char

        try {
            return JSON.parse(cleaned);
        } catch (initialError) {
            const hardClean = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, " "); 
            return JSON.parse(hardClean);
        }
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
        
        // Restore your specific project model if 2.5-flash was intended, 
        // fallback to standard 1.5-flash if needed.
        let modelName = 'gemini-2.0-flash'; // Fallback starting point
        
        // From user logs, it seems they had 2.5-flash originally
        const tryModels = ['gemini-2.5-flash', 'gemini-1.5-flash-002', 'gemini-1.5-flash-001', 'gemini-1.5-flash'];
        
        let lastError = null;
        for (const m of tryModels) {
            try {
                const generativeModel = vertex_ai.getGenerativeModel({
                    model: m,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 8192,
                        responseMimeType: isJson ? 'application/json' : 'text/plain',
                    },
                });

                const request = {
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                };

                const result = await generativeModel.generateContent(request);
                const response = result.response;
                const textContent = response.candidates?.[0]?.content?.parts?.[0]?.text;

                if (textContent) return isJson ? this.safeJsonParse(textContent) : textContent;
            } catch (e: any) {
                console.error(`Gemini attempt with ${m} failed:`, e.message);
                lastError = e;
                continue; // try next model
            }
        }

        throw lastError || new Error('Google Gemini failed: No valid response from any available models.');
    }

    private static async validateBrandVoice(copy: any, brand: any) {
        const prompt = `
      You are the strictest Brand Guardian and Quality Assurance Editor for ${brand.name}.
      
      Brand Tone: ${brand.toneOfVoice}
      
      Content to Review:
      Hook: ${copy.hook}
      Body: ${copy.body}
      
      TASK: Does this content sound like a generic AI wrote it, or does it sound natively tailored to the brand tone? Is it overusing emojis or cliche phrases?
      Return strictly Portuguese feedback.
      
      Return JSON:
      {
        "isValid": boolean,
        "feedback": "Short critique in Portuguese (PT-BR) on tone, formatting, and AI-like clichés."
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
    static async refineContent(contentPieceId: string, versionId: string, userFeedback: string, provider: 'OPENAI' | 'GOOGLE' = 'OPENAI') {
        const version = await prisma.contentVersion.findUnique({
            where: { id: versionId },
            include: { contentPiece: { include: { brandProfile: { include: { audienceSegments: true } } } } }
        });

        if (!version) throw new Error('Version not found');

        const brand = version.contentPiece.brandProfile;
        
        const prompt = `
            You are an elite Creative Director and Copy Editor refactoring a content piece for ${brand.name}.
            
            MANDATORY: All output MUST be in PORTUGUESE (PT-BR).
            
            BRAND DNA: ${brand.toneOfVoice}
            FORMAT: ${version.contentPiece.format}
            PLATFORM: ${version.contentPiece.platform}
            
            CURRENT CONTENT:
            - Headline: ${version.headline}
            - Hook: ${version.hook}
            - Body: ${version.body}
            - Caption: ${version.caption}
            ${(version.metadata as any)?.slides || (version.metadata as any)?.videoScenes ? `- Metadata Details: ${JSON.stringify(version.metadata)}` : ''}
            
            CLIENT FEEDBACK (REFINEMENT): "${userFeedback}"
            
            TASK: Rewrite or adjust the content precisely following the feedback in PORTUGUESE.
            Ensure "body" is a SINGLE STRING of text, not an array or object.
            
            Return strictly a JSON object with:
            {
              "headline": "...",
              "hook": "...",
              "body": "... (SINGLE STRING IN PT-BR)",
              "caption": "...",
              "cta": "...",
              "hashtags": ["..."],
              "imagePrompt": "...",
              "visualConcept": "...",
              "metadata": {
                 "slides": [... if carousel],
                 "videoScenes": [... if video]
              }
            }
        `;

        const newContent = await this.askAI(prompt, provider, true);

        // Defensive: use extractText to ensure the result is a clean string
        const safeBody = this.extractText(newContent.body);
        const safeCaption = this.extractText(newContent.caption);

        return prisma.contentVersion.create({
            data: {
                contentPieceId: version.contentPieceId,
                headline: String(newContent.headline || version.headline || ''),
                hook: String(newContent.hook || version.hook || ''),
                body: safeBody,
                caption: safeCaption,
                cta: String(newContent.cta || version.cta || ''),
                hashtags: Array.isArray(newContent.hashtags) ? newContent.hashtags : (version.hashtags || []),
                imagePrompt: String(newContent.imagePrompt || version.imagePrompt || ''),
                visualConcept: String(newContent.visualConcept || version.visualConcept || ''),
                metadata: {
                    ...(typeof version.metadata === 'object' ? version.metadata as any : {}),
                    ...(newContent.metadata || {})
                },
            }
        });
    }

}

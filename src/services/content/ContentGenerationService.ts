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
      
      ELITE COPYWRITING PROTOCOLS:
      1. FRAMEWORK: Use ${request.format === 'carousel' ? 'AIDA (Attention, Interest, Desire, Action)' : 'PAS (Problem, Agitation, Solution)'}. 
      2. THE PUNCH: Every sentence must earn the right to the next one. Use 'Bucket Brigades' (e.g., "Aqui está o porquê:", "Mas há um problema.", "A realidade?") to keep reading momentum.
      3. AUDIENCE MIRRORING: Speak directly to the AUDIENCE segments. Use their specific fears and desires found in the DNA.
      4. AUTHORITY INJECTION: If the knowledge base contains data, metrics, or technical mechanisms, use them. Don't say "é importante", say "é o mecanismo fisiológico responsável por...".
      
      ANTI-GENERIC CONSTRAINTS:
      - MANDATORY: Brazilian Portuguese (PT-BR).
      - NO INTROS: Ban "Você já se perguntou?", "No cenário atual...", "Descubra como...".
      - NO WEASEL WORDS: Ban "revolucionário", "incrível", "mágico", "transformador", "único".
      - NO AI ADVERBS: Ban "notavelmente", "essencialmente", "profundamente".
      - WHITE SPACE: Use short paragraphs (max 3 lines). Use line breaks strategically for mobile reading.
      
      VISUAL DIRECTION FOR THE DESIGNER:
      - The 'imagePrompt' must be in ENGLISH and focused on RAW PHOTOGRAPHY (GCP Imagen 3 style). 
      - Describe lighting (Chiaroscuro, Rembrandt, Rim light), textures (skin pores, fabric threads), and camera specifics.
      - NEVER mention "AI", "Render", "Digital Art".

      Return JSON (ALL content values in PT-BR except imagePrompt):
      {
        "headline": "Main title (PT-BR)",
        "hook": "Magnetic first line (PT-BR)",
        "body": "Main content with Markdown (PT-BR)",
        "caption": "Social media caption/legend (PT-BR)",
        "cta": "Direct Call to Action (PT-BR)",
        "hashtags": ["Specific", "Niche"],
        "imagePrompt": "DETAILED PHOTOGRAPHIC PROMPT IN ENGLISH",
        "visualConcept": "Art direction summary (PT-BR)",
        "slides": [
             { "slideNumber": 1, "textOnImage": "Punchy header", "imagePrompt": "Specific scene prompt", "explanation": "Context" }
        ],
        "videoScenes": [
             { "time": "00:00", "action": "Visual action", "audio": "Voiceover/Audio" }
        ]
      }
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
                maxOutputTokens: 2048,
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

        return isJson ? JSON.parse(textContent) : textContent;
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

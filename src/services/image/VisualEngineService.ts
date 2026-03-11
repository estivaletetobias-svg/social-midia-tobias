import OpenAI from 'openai';
import prisma from '@/lib/prisma';
import { helpers, PredictionServiceClient } from '@google-cloud/aiplatform';
import { VectorService } from '../knowledge/VectorService';
import { AssetService } from './AssetService';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Visual Engine Service 2.0
 * Supports Multi-Model Image Generation (OpenAI DALL-E 3 & Google Vertex AI Imagen 3)
 */
export class VisualEngineService {
    /**
     * Generates a high-quality visual concept and provider-specific prompt.
     */
    static async generateImagePrompt(contentPieceId: string, versionId: string, provider: 'OPENAI' | 'GOOGLE' = 'GOOGLE') {
        const content = await prisma.contentPiece.findUnique({
            where: { id: contentPieceId },
            include: {
                brandProfile: true,
                versions: { where: { id: versionId } }
            }
        });

        if (!content || !content.versions[0]) throw new Error('Content version not found');

        const version = content.versions[0];
        const brand = content.brandProfile;

        // RAG: Fetch relevant knowledge snippets
        const contextResults = await VectorService.searchKnowledge(
            content.brandProfileId,
            `${version.headline} ${version.hook}`,
            3
        );
        const knowledgeContext = contextResults.length > 0
            ? `INTERNAL KNOWLEDGE (RAG): ${contextResults.map((k: any) => `- ${k.title}: ${k.content.substring(0, 2000)}`).join('\n')}`
            : 'No specific knowledge records found.';

        const systemPrompt = `
      You are a World-Class Commercial Photographer and Art Director.
      Your goal is to transform a content idea into a high-fidelity Visual Prompt for GOOGLE IMAGEN 3.
      
      Brand DNA: ${brand.name} - ${brand.description}
      Platform: ${content.platform}
      Headline: ${version.headline}

      ELITE VISUAL PROTOCOLS:
      1. BEYOND 4K: Describe RAW textures. "Visible skin pores, realistic fabric threads, subtle lens flare, authentic dust motes in sunlight".
      2. LIGHTING MASTERCLASS: Use specific terminology: "Rembrandt lighting", "Chiaroscuro effect", "Deep chiaroscuro with warm rim light", "Golden hour cinematic glow", "Soft-box diffuse lighting for a premium studio look".
      3. CINEMATIC SPECS: Mention specific cameras and lenses: "Shot on Hasselblad H6D, 100mm f/2.2 lens, shallow depth of field, creamy bokeh background".
      4. ZERO "AI" LOOK: Ban all abstract terms. Be physical. No "conceptual", no "vibrant", no "stunning". Use physical colors: "Deep emerald green", "Polished copper", "Muted charcoal".

      MANDATORY: 
      - The 'prompt' field must be in ENGLISH, very long (150+ words), and strictly descriptive.
      - NO text in the image. NO logos. Only the scene.

      Output JSON:
      {
        "visualConcept": "Art direction summary in PT-BR",
        "prompt": "THE ELITE PHOTOGRAPHIC PROMPT IN ENGLISH",
        "recommendedModel": "GOOGLE"
      }
    `;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'system', content: systemPrompt }],
            response_format: { type: 'json_object' },
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');

        return prisma.contentVersion.update({
            where: { id: versionId },
            data: {
                imagePrompt: result.prompt,
                visualConcept: result.visualConcept,
                metadata: {
                    ...(version.metadata as object || {}),
                    visualStrategy: result,
                    provider: provider
                }
            }
        });
    }

    /**
     * Universal Image Generation Handler
     */
    static async generateImage(versionId: string, slideIndex?: number) {
        const version = await prisma.contentVersion.findUnique({
            where: { id: versionId },
            include: { contentPiece: { include: { brandProfile: true } } }
        });

        if (!version) throw new Error('Content version not found');
        
        // Default to the main image prompt
        let prompt = version.imagePrompt;
        
        // If slideIndex is provided, try to find that specific slide's prompt
        if (slideIndex !== undefined) {
            const metadata = version.metadata as any;
            if (metadata?.slides && metadata.slides[slideIndex]) {
                prompt = metadata.slides[slideIndex].imagePrompt || prompt;
                console.log(`Gerando imagem específica para Slide ${slideIndex + 1}...`);
            }
        }

        if (!prompt) throw new Error('Ready prompt not found for this version');

        // Get the provider from metadata (default to OPENAI)
        const provider = (version.metadata as any)?.provider || 'OPENAI';

        let asset;
        if (provider === 'GOOGLE') {
            asset = await this.generateWithGoogleImagen(version, prompt);
        } else {
            asset = await this.generateWithOpenAIDallE(version, prompt);
        }

        // If it's a slide image, we should update the version's metadata to link this asset
        if (slideIndex !== undefined && asset) {
            const currentMetadata = version.metadata as any;
            if (currentMetadata?.slides && currentMetadata.slides[slideIndex]) {
                const updatedSlides = [...currentMetadata.slides];
                updatedSlides[slideIndex] = {
                    ...updatedSlides[slideIndex],
                    assetUrl: asset.url,
                    assetId: asset.id
                };

                await prisma.contentVersion.update({
                    where: { id: versionId },
                    data: {
                        metadata: {
                            ...currentMetadata,
                            slides: updatedSlides
                        }
                    }
                });
            }
        }

        return asset;
    }

    /**
     * OpenAI DALL-E 3 Implementation
     */
    private static async generateWithOpenAIDallE(version: any, prompt: string) {
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "hd",
            style: "natural"
        });

        const url = response.data?.[0]?.url;
        if (!url) throw new Error('DALL-E 3 failed: No URL returned');

        return this.saveGeneratedAsset(version, url, 'dall-e-3', prompt);
    }

    /**
     * Google Vertex AI (Imagen 3) Implementation
     */
    private static async generateWithGoogleImagen(version: any, prompt: string) {
        const project = process.env.GCP_PROJECT_ID;
        const location = process.env.GCP_LOCATION || 'us-central1';
        const serviceAccountJson = process.env.GCP_SERVICE_ACCOUNT_JSON;

        if (!project) throw new Error('GOOGLE CONFIG MISSING: Please add GCP_PROJECT_ID to your Vercel/Env variables');

        const clientOptions: any = {
            apiEndpoint: `${location}-aiplatform.googleapis.com`,
            projectId: project,
        };

        // If on Vercel, we use the JSON string from ENV
        if (serviceAccountJson) {
            try {
                clientOptions.credentials = JSON.parse(serviceAccountJson);
            } catch (e) {
                console.error("Failed to parse GCP_SERVICE_ACCOUNT_JSON", e);
            }
        } 
        // Fallback to local file if path exists
        else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            clientOptions.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        }

        const client = new PredictionServiceClient(clientOptions);
        const endpoint = `projects/${project}/locations/${location}/publishers/google/models/imagen-3.0-generate-001`;

        const promptValue = helpers.toValue({ prompt: prompt });
        if (!promptValue) throw new Error('Failed to create GCP Value object');

        const instances = [promptValue];

        const parameters = helpers.toValue({
            sampleCount: 1,
        });

        // @ts-ignore - fixing type mismatch with vertex SDK
        const [response] = await client.predict({
            endpoint,
            instances,
            parameters,
        });

        const prediction = response.predictions?.[0];
        if (!prediction) throw new Error('Google Imagen failed: No predictions returned');

        // Resilience: Deep search for bytesBase64 in the response object
        const deepFindBytesBase64 = (obj: any): string | null => {
            if (!obj) return null;
            if (obj.bytesBase64) return obj.bytesBase64;
            if (typeof obj !== 'object') return null;
            
            // Try common field names in GCP/Protobuf structures
            const val = obj.bytesBase64 || 
                        obj.stringValue || 
                        obj.fields?.bytesBase64?.stringValue ||
                        obj.structValue?.fields?.bytesBase64?.stringValue;
            if (val && typeof val === 'string' && val.length > 100) return val;

            for (const key in obj) {
                const found: any = deepFindBytesBase64(obj[key]);
                if (found) return found;
            }
            return null;
        };

        const bytesBase64 = deepFindBytesBase64(prediction);

        if (!bytesBase64) {
            console.error("GCP Prediction Full Structure:", JSON.stringify(prediction, null, 2));
            throw new Error(`Google Imagen failed: Bytes not found. Keys: ${Object.keys(prediction || {}).join(', ')}`);
        }

        const dataUrl = `data:image/png;base64,${bytesBase64}`;

        return this.saveGeneratedAsset(version, dataUrl, 'imagen-3.0', prompt);
    }

    /**
     * Helper to persist assets
     */
    private static async saveGeneratedAsset(version: any, url: string, model: string, promptUsed: string) {
        return AssetService.uploadAndPersist(url, {
            brandProfileId: version.contentPiece.brandProfileId,
            contentPieceId: version.contentPieceId,
            prompt: promptUsed,
            model: model,
            versionId: version.id,
        });
    }
}

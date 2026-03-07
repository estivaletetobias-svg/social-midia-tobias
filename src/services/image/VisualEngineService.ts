import OpenAI from 'openai';
import prisma from '@/lib/prisma';
import { helpers, PredictionServiceClient } from '@google-cloud/aiplatform';
import { VectorService } from '../knowledge/VectorService';

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
    static async generateImagePrompt(contentPieceId: string, versionId: string, provider: 'OPENAI' | 'GOOGLE' = 'OPENAI') {
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
            ? `INTERNAL KNOWLEDGE (RAG): ${contextResults.map((k: any) => `- ${k.title}: ${k.content}`).join('\n')}`
            : 'No specific knowledge records found.';

        const systemPrompt = `
      You are a high-level creative director for social media aesthetics.
      
      Brand DNA: ${brand.name} - ${brand.description}
      Internal References (RAG):
      ${knowledgeContext}

      Platform: ${content.platform}
      Content Headline: ${version.headline}
      Key Hook: ${version.hook}
      Message: ${version.body?.substring(0, 500)}
      
      TASK: Create a professional visual concept and image prompt optimized for ${provider === 'OPENAI' ? 'DALL-E 3' : 'Google Imagen 3'}.
      
      Provider-Specific Rules:
      - OPENAI (DALL-E 3): Focus on descriptive, conceptual language. It likes complex ideas.
      - GOOGLE (Imagen 3): Focus on technical, literal, and cinematographic descriptions. Imagen is best for fotorrealism and legible text.

      Aesthetic: Premium, professional, minimalist, high-tech expert voice.
      Avoid: Generic AI art tropes or cluttered stock photo styles.

      Output JSON:
      - visualConcept: Short conceptual description.
      - prompt: The high-fidelity specialized prompt.
      - recommendedModel: "${provider}"

      Return strictly as JSON.
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
    static async generateImage(versionId: string) {
        const version = await prisma.contentVersion.findUnique({
            where: { id: versionId },
            include: { contentPiece: { include: { brandProfile: true } } }
        });

        if (!version || !version.imagePrompt) throw new Error('Ready prompt not found for this version');

        // Get the provider from metadata (default to OPENAI)
        const provider = (version.metadata as any)?.provider || 'OPENAI';

        if (provider === 'GOOGLE') {
            return this.generateWithGoogleImagen(version);
        } else {
            return this.generateWithOpenAIDallE(version);
        }
    }

    /**
     * OpenAI DALL-E 3 Implementation
     */
    private static async generateWithOpenAIDallE(version: any) {
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: version.imagePrompt,
            n: 1,
            size: "1024x1024",
            quality: "hd",
            style: "vivid"
        });

        const url = response.data?.[0]?.url;
        if (!url) throw new Error('DALL-E 3 failed: No URL returned');

        return this.saveGeneratedAsset(version, url, 'dall-e-3');
    }

    /**
     * Google Vertex AI (Imagen 3) Implementation
     */
    private static async generateWithGoogleImagen(version: any) {
        const project = process.env.GCP_PROJECT_ID;
        const location = process.env.GCP_LOCATION || 'us-central1';
        const publisher = 'google';
        const model = 'imagen-3.0-generate-001';

        const client = new PredictionServiceClient({
            apiEndpoint: `${location}-aiplatform.googleapis.com`,
        });

        const endpoint = `projects/${project}/locations/${location}/publishers/${publisher}/models/${model}`;

        const promptValue = helpers.toValue({ prompt: version.imagePrompt });
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

        const prediction: any = response.predictions?.[0];
        const bytesBase64 = prediction?.structValue?.fields?.bytesBase64?.stringValue;

        if (!bytesBase64) throw new Error('Google Imagen failed: No image data returned');

        const dataUrl = `data:image/png;base64,${bytesBase64}`;

        return this.saveGeneratedAsset(version, dataUrl, 'imagen-3.0');
    }

    /**
     * Helper to persist assets
     */
    private static async saveGeneratedAsset(version: any, url: string, model: string) {
        return prisma.asset.create({
            data: {
                brandProfileId: version.contentPiece.brandProfileId,
                contentPieceId: version.contentPieceId,
                type: 'image',
                url: url,
                key: `generated/${version.id}-${Date.now()}.png`,
                prompt: version.imagePrompt,
                model: model,
                metadata: { versionId: version.id }
            }
        });
    }
}

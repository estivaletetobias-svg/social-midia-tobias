import prisma from '@/lib/prisma';
import { VectorService } from './VectorService';

export class KnowledgeService {
    /**
     * Imports a document into the Knowledge Base.
     * This handles manual imports from NotebookLM or other scripts.
     */
    static async importKnowledge(data: {
        brandProfileId: string;
        title: string;
        content: string;
        sourceUrl?: string;
        type: string;
        tags?: string[];
        metadata?: Record<string, any>;
    }) {
        const embedding = await VectorService.generateEmbedding(data.content);

        return prisma.knowledgeItem.create({
            data: {
                brandProfileId: data.brandProfileId,
                title: data.title,
                content: data.content,
                sourceUrl: data.sourceUrl,
                type: data.type,
                tags: data.tags || [],
                metadata: data.metadata || {},
                embedding: embedding as any // prisma doesn't support vector types directly, we cast or use raw SQL
            },
        });
    }

    /**
     * Basic search for knowledge items.
     * In Phase 2, this will be upgraded to vector/semantic search.
     */
    static async searchKnowledge(brandProfileId: string, query: string) {
        return prisma.knowledgeItem.findMany({
            where: {
                brandProfileId,
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { content: { contains: query, mode: 'insensitive' } },
                    { tags: { has: query } },
                ],
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
    }

    static async getById(id: string) {
        return prisma.knowledgeItem.findUnique({
            where: { id },
        });
    }
}

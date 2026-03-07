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

        const item = await prisma.knowledgeItem.create({
            data: {
                brandProfileId: data.brandProfileId,
                title: data.title,
                content: data.content,
                sourceUrl: data.sourceUrl,
                type: data.type,
                tags: data.tags || [],
                metadata: data.metadata || {},
            },
        });

        // Prisma doesn't support vector types directly, so we update it via raw SQL
        const vectorString = `[${embedding.join(',')}]`;
        await prisma.$executeRawUnsafe(
            `UPDATE "KnowledgeItem" SET embedding = $1::vector WHERE id = $2`,
            vectorString,
            item.id
        );

        return item;
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

import OpenAI from 'openai';
import prisma from '@/lib/prisma';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export class VectorService {
    /**
     * Generates an embedding vector for a given text.
     */
    static async generateEmbedding(text: string): Promise<number[]> {
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text.replace(/\n/g, ' '),
        });

        return response.data[0].embedding;
    }

    /**
     * Performs semantic search using pgvector.
     */
    static async searchKnowledge(brandProfileId: string, query: string, limit: number = 5) {
        const embedding = await this.generateEmbedding(query);
        const vectorString = `[${embedding.join(',')}]`;

        // Prisma doesn't support vector search directly yet, so we use raw SQL.
        // Note: We use cosine similarity (1 - (vector1 <=> vector2)).
        const results = await prisma.$queryRawUnsafe<any[]>(
            `SELECT id, title, content, (1 - (embedding <=> $1::vector)) as score 
       FROM "KnowledgeItem" 
       WHERE "brandProfileId" = $2 
       ORDER BY score DESC 
       LIMIT $3`,
            vectorString,
            brandProfileId,
            limit
        );

        return results;
    }
}

import { Queue, Worker, Job } from 'bullmq';
import { ContentGenerationService } from '@/services/content/ContentGenerationService';
import prisma from '@/lib/prisma';
import Redis from 'ioredis';

// Singleton for Redis connection
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

// Define Queues
export const queues = {
    content: new Queue('content-generation', { connection }),
    discovery: new Queue('topic-discovery', { connection }),
    image: new Queue('image-generation', { connection }),
};

// Define Worker Logic
export const startWorkers = () => {
    // 1. Content Generation Worker
    const contentWorker = new Worker(
        'content-generation',
        async (job: Job) => {
            const { brandProfileId, topicId, goal, platform, format, contentPieceId } = job.data;

            const result = await ContentGenerationService.generateDraft({
                brandProfileId,
                topicId,
                goal,
                platform,
                format,
            });

            // Update content piece with results and move to REVIEW status
            return prisma.contentPiece.update({
                where: { id: contentPieceId },
                data: {
                    status: 'draft',
                    versions: {
                        create: {
                            headline: result.copy.headline,
                            hook: result.copy.hook,
                            body: result.copy.body,
                            caption: result.copy.caption,
                            cta: result.copy.cta,
                            hashtags: result.copy.hashtags,
                            imagePrompt: result.copy.imagePrompt,
                            visualConcept: result.copy.visualConcept,
                            metadata: { strategy: result.strategy, structure: result.structure },
                        },
                    },
                },
            });
        },
        { connection }
    );

    contentWorker.on('completed', (job) => {
        console.log(`Job ${job.id} content-generation completed!`);
    });

    contentWorker.on('failed', (job, err) => {
        console.error(`Job ${job?.id} failed with ${err.message}`);
    });

    console.log('Workers started successfully');
};

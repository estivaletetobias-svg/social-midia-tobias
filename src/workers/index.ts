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
        console.log(`[Worker] Job ${job.id} content-generation completed!`);
    });

    contentWorker.on('failed', (job, err) => {
        console.error(`[Worker] Job ${job?.id} failed with ${err.message}`);
    });

    // 2. Automated RSS Topic Discovery Worker
    const discoveryWorker = new Worker(
        'topic-discovery',
        async (job: Job) => {
            if (job.name === 'daily-rss-sync') {
                console.log(`[Worker] Starting Daily RSS Sync...`);
                import('@/services/discovery/RssDiscoveryService').then(async ({ RssDiscoveryService }) => {
                    const firstBrand = await prisma.brandProfile.findFirst();
                    if (firstBrand) {
                        try {
                            const result = await RssDiscoveryService.ingestNews(firstBrand.id, job.data?.feedUrl || 'https://techcrunch.com/feed/');
                            console.log(`[Worker] RSS Sync Success: ${result.savedToLibrary} topics saved from ${result.feedTitle}`);
                        } catch (error: any) {
                            console.error(`[Worker] RSS Sync Failed:`, error.message);
                        }
                    } else {
                        console.log(`[Worker] No brand profile found for RSS sync.`);
                    }
                });
            }
        },
        { connection }
    );

    // Schedule the 5 AM daily CRON job
    queues.discovery.add('daily-rss-sync',
        { feedUrl: 'https://techcrunch.com/feed/' },
        { repeat: { pattern: '0 5 * * *', tz: 'America/Sao_Paulo' } }
    ).then(() => console.log('[Cron] Scheduled daily RSS sync at 5:00 AM (BRT)'));

    console.log('[Worker] All Queues and Workers started successfully.');
};

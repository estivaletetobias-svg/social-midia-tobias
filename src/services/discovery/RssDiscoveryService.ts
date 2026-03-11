import Parser from 'rss-parser';
import prisma from '@/lib/prisma';
import { TopicDiscoveryService } from './TopicDiscoveryService';

export class RssDiscoveryService {
    private static parser = new Parser({
        customFields: {
            item: ['description', 'content:encoded', 'creator']
        }
    });

    /**
     * Scrapes an RSS feed, formats the data, and sends the best matches
     * to our Topic Discovery AI for evaluation and saving.
     */
    static async ingestNews(brandProfileId: string, feedUrl: string) {
        try {
            const feed = await this.parser.parseURL(feedUrl);
            const recentItems = feed.items.slice(0, 5); // Process the latest 5 news to avoid LLM limits

            // Process individual news items in parallel for higher efficiency
            const processingResults = await Promise.all(
                recentItems.map(async (item) => {
                    const newsSummary = `
            Title: ${item.title}
            Source: ${feed.title}
            Date: ${item.pubDate}
            Snippet: ${item.contentSnippet || item.description?.substring(0, 300)}
            URL: ${item.link}
          `;

                    try {
                        const aiSuggestion = await TopicDiscoveryService.evaluateNewsAgainstBrand(brandProfileId, newsSummary);

                        if (aiSuggestion.isRelevant) {
                            await prisma.topicCandidate.create({
                                data: {
                                    brandProfileId,
                                    title: aiSuggestion.proposedHeadline,
                                    summary: aiSuggestion.proposedSummary,
                                    relevanceScore: aiSuggestion.score,
                                    alignmentScore: aiSuggestion.score,
                                    platform: aiSuggestion.recommendedPlatform,
                                    format: aiSuggestion.recommendedFormat,
                                    status: 'suggestion',
                                }
                            });
                            return true;
                        }
                    } catch (err: any) {
                        console.error(`AI Evaluation Failed for news "${item.title}":`, err.message);
                    }
                    return false;
                })
            );

            const suggestedTopics = processingResults.filter(Boolean).length;

            return {
                scraped: recentItems.length,
                savedToLibrary: suggestedTopics,
                feedTitle: feed.title
            };
        } catch (error: any) {
            console.error(`RSS Ingestion Failed for ${feedUrl}:`, error.message);
            throw error;
        }
    }
}

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

            let suggestedTopics = 0;

            for (const item of recentItems) {
                // Prepare context for the AI
                const newsSummary = `
          Title: ${item.title}
          Source: ${feed.title}
          Date: ${item.pubDate}
          Snippet: ${item.contentSnippet || item.description?.substring(0, 300)}
          URL: ${item.link}
        `;

                // We use our existing Discovery AI to evaluate if this news matches the brand's DNA
                const aiSuggestion = await TopicDiscoveryService.evaluateNewsAgainstBrand(brandProfileId, newsSummary);

                if (aiSuggestion.isRelevant) {
                    // If the AI says it's relevant, save it to the Ideas Library
                    await prisma.topicCandidate.create({
                        data: {
                            brandProfileId,
                            title: aiSuggestion.proposedHeadline,
                            summary: aiSuggestion.proposedSummary,
                            relevanceScore: aiSuggestion.score,
                            alignmentScore: aiSuggestion.score, // Or a separate metric depending on strategy
                            platform: aiSuggestion.recommendedPlatform,
                            format: aiSuggestion.recommendedFormat,
                            status: 'suggestion',
                        }
                    });
                    suggestedTopics++;
                }
            }

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

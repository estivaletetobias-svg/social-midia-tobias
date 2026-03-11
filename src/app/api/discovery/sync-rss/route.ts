import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { RssDiscoveryService } from '@/services/discovery/RssDiscoveryService';

// Fallback feed for testing purposes
const DEFAULT_FEED_URL = 'https://techcrunch.com/feed/';

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));

        let { brandId, feedUrl } = body;

        let targetBrandId = brandId;

        // If no brand is specified, we get the first one (useful for the MVP)
        if (!targetBrandId) {
            const firstBrand = await prisma.brandProfile.findFirst();
            if (!firstBrand) {
                return NextResponse.json({ error: 'No brand profile found. Create one first.' }, { status: 400 });
            }
            targetBrandId = firstBrand.id;
        }

        let finalFeedUrl = feedUrl || DEFAULT_FEED_URL;

        // Se o usuário digitou uma palavra chave em vez de URL, a gente constrói um RSS do Google News BR
        if (finalFeedUrl && !finalFeedUrl.startsWith('http')) {
            finalFeedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(finalFeedUrl)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
        }

        // Trigger the AI Discovery Engine
        const result = await RssDiscoveryService.ingestNews(targetBrandId, finalFeedUrl);

        return NextResponse.json({
            success: true,
            message: 'RSS sync completed successfully.',
            data: result
        });

    } catch (error: any) {
        console.error('RSS Sync Manual Trigger Error:', error.message);
        return NextResponse.json({ error: 'Failed to sync RSS feed', details: error.message }, { status: 500 });
    }
}

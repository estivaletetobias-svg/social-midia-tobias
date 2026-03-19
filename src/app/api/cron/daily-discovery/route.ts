import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { RssDiscoveryService } from '@/services/discovery/RssDiscoveryService';

/**
 * CRON JOB: Daily Discovery Engine
 * Triggers at 6:00 AM (configured via vercel.json or external scheduler)
 * Scans trends for ALL active brands.
 */
export async function GET(req: Request) {
    // Protection: Basic check for a cron secret if provided in ENV
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        console.log('--- STARTING GLOBAL DAILY DISCOVERY CRON ---');
        
        // 1. Fetch all active brand profiles with their pillars
        const brands = await prisma.brandProfile.findMany({
            where: { isActive: true },
            include: { editorialPillars: true }
        });

        console.log(`Found ${brands.length} active brands to process.`);

        const results = [];

        for (const brand of brands) {
            console.log(`Processing Brand: ${brand.name} (${brand.id})`);
            
            // 2. Clear "isNew" flag from old topics for this brand
            await prisma.topicCandidate.updateMany({
                where: { brandProfileId: brand.id, isNew: true },
                data: { isNew: false }
            });

            // 3. Define search terms from pillars
            const searchTerms = brand.editorialPillars.length > 0
                ? brand.editorialPillars.map((p: any) => p.title).filter((t: string) => t && t.trim() !== "")
                : [brand.name];

            let brandTotalSaved = 0;

            // 4. Run discovery for the top 3 pillars (avoiding timeouts)
            for (const term of searchTerms.slice(0, 3)) {
                const googleNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(term)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
                
                try {
                    const result = await RssDiscoveryService.ingestNews(brand.id, googleNewsUrl);
                    brandTotalSaved += result.savedToLibrary;
                } catch (err) {
                    console.error(`Error processing pillar "${term}" for brand ${brand.name}:`, err);
                }
            }

            results.push({ brand: brand.name, newTopics: brandTotalSaved });
        }

        console.log('--- GLOBAL CRON COMPLETED ---', results);

        return NextResponse.json({
            success: true,
            processedBrands: brands.length,
            summary: results
        });

    } catch (e: any) {
        console.error('CRON ERROR:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

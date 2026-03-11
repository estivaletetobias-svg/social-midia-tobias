import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { RssDiscoveryService } from '@/services/discovery/RssDiscoveryService';

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { brandId } = body;

        let brand;
        if (brandId) {
            brand = await prisma.brandProfile.findUnique({
                where: { id: brandId },
                include: { editorialPillars: true }
            });
        } else {
            brand = await prisma.brandProfile.findFirst({
                include: { editorialPillars: true }
            });
        }

        if (!brand) {
            return NextResponse.json({ error: 'DNA da marca não encontrado. Configure o perfil primeiro.' }, { status: 400 });
        }

        // Se não houver pilares, usamos o nome da marca como termo de busca
        const searchTerms = brand.editorialPillars.length > 0
            ? brand.editorialPillars.map((p: any) => p.title).filter((t: string) => t && t.trim() !== "")
            : [brand.name];

        let totalScraped = 0;
        let totalSaved = 0;

        // Processar os 3 primeiros pilares (evitar timeout em requisições serverless)
        for (const term of searchTerms.slice(0, 3)) {
            const googleNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(term)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

            try {
                const result = await RssDiscoveryService.ingestNews(brand.id, googleNewsUrl);
                totalScraped += result.scraped;
                totalSaved += result.savedToLibrary;
            } catch (err) {
                console.error(`Erro ao processar pilar ${term}:`, err);
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                scraped: totalScraped,
                savedToLibrary: totalSaved
            }
        });

    } catch (e: any) {
        console.error('Daily Trends Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

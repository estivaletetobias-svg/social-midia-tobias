import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { RssDiscoveryService } from '@/services/discovery/RssDiscoveryService';

/**
 * Vercel Cron Job: Sincronização Automática de Notícias
 * 
 * Este endpoint é chamado periodicamente para percorrer todas as marcas ativas,
 * buscar notícias baseadas nos seus pilares editoriais e salvar sugestões no Ideas Library.
 */
export async function GET(req: Request) {
    // 1. Verificação de Segurança (CRON_SECRET)
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        console.log('[CRON] Iniciando robô de notícias para todas as marcas...');
        
        // 2. Buscar todas as marcas cadastradas
        const brands = await prisma.brandProfile.findMany({
            include: { editorialPillars: true }
        });

        if (brands.length === 0) {
            return NextResponse.json({ message: 'Nenhuma marca encontrada para processar.' });
        }

        let totalProcessedBrands = 0;
        let totalNewIdeiasCount = 0;

        // 3. Processar cada marca individualmente
        for (const brand of brands) {
            console.log(`[CRON] Processando marca: ${brand.name}`);
            
            // Definir termos de busca baseados nos pilares ou no nome da marca
            const searchTerms = brand.editorialPillars.length > 0
                ? brand.editorialPillars.map((p: any) => p.title)
                : [brand.name];

            // Limitamos a 2 pilares por marca no modo automático para evitar timeout na Vercel
            for (const term of searchTerms.slice(0, 2)) {
                const googleNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(term)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

                try {
                    const result = await RssDiscoveryService.ingestNews(brand.id, googleNewsUrl);
                    totalNewIdeiasCount += result.savedToLibrary;
                } catch (err: any) {
                    console.error(`[CRON] Erro ao processar pilar "${term}" da marca ${brand.name}:`, err.message);
                }
            }
            totalProcessedBrands++;
        }

        console.log(`[CRON] Sincronização concluída. Marcas: ${totalProcessedBrands}, Ideias Geradas: ${totalNewIdeiasCount}`);

        return NextResponse.json({
            success: true,
            extractedAt: new Date().toISOString(),
            stats: {
                brandsProcessed: totalProcessedBrands,
                newIdeiasLibrary: totalNewIdeiasCount
            }
        });

    } catch (error: any) {
        console.error('[CRON ERROR] Falha crítica na sincronização:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

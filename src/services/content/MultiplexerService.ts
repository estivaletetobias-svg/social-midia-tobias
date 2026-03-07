import OpenAI from 'openai';
import prisma from '@/lib/prisma';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export class MultiplexerService {
    static async multiplexKnowledgeItem(knowledgeItemId: string) {
        // Fetch the knowledge item
        const knowledge = await prisma.knowledgeItem.findUnique({
            where: { id: knowledgeItemId },
            include: { brandProfile: true }
        });

        if (!knowledge) throw new Error('Fonte de Conhecimento não encontrada');
        const brand = knowledge.brandProfile;

        const prompt = `
            Você é o Mestre Clonador de Conteúdo para a marca "${brand.name}".
            O DNA da marca (Tom de voz e posicionamento): ${brand.description}
            
            O usuário fez upload do seguinte material base (Transcrição/Palestra/Nota):
            """
            ${knowledge.content}
            """
            
            SUA TAREFA DE MULTIPLICAÇÃO: 
            Despedace, mastigue e transforme esse "texto único" em exatas 3 peças formatadas e distintas para Redes Sociais que devem soar naturalmente como o posicionamento da marca, em PORTUGUÊS DO BRASIL.
            
            - Peça 1: Um Carrossel denso e educativo de Alto Impacto para **Instagram** focado na audiência B2C. (Formato: carousel)
            - Peça 2: Um Roteiro de Vídeo Curto, ágil, com um Gancho Hipnótico no início, para **Reels/TikTok**. (Formato: video script)
            - Peça 3: Um Artigo/Postagem Executiva aprofundada para **LinkedIn** focada em liderança e Business-to-Person (B2P). (Formato: article)

            Retorne estritamente um JSON com a chave "pieces" que contém um array dos 3 objetos gerados na exata matriz abaixo:
            [{
               "title": "Title Interno do Dashboard",
               "platform": "Instagram" | "LinkedIn" | "TikTok",
               "format": "carousel" | "video script" | "article",
               "headline": "A copy da manchete/imagem de capa",
               "body": "Todo o conteúdo da legenda/roteiro destrinchado"
            }]
        `;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'system', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.7
        });

        const rawContent = response.choices[0].message.content || '{"pieces": []}';
        const result = JSON.parse(rawContent).pieces;

        console.log("GPT Multiplex Result:", result);

        // Salvar as 3 novas peças de base na Esteira de Conteúdos
        const createdPieces = await Promise.all(
            result.map(async (p: any) => {
                const title = p.title || 'Novo Conteúdo Multiplicado';
                const platform = p.platform || 'Instagram';
                const format = p.format || 'carousel';

                // Criar Tópico Fake para dar sustentação caso o modelo use
                const topic = await prisma.topicCandidate.create({
                    data: {
                        brandProfileId: brand.id,
                        title: title,
                        summary: "Gerado automaticamente via Liquidificador de Conhecimento.",
                        relevanceScore: 1.0,
                        alignmentScore: 1.0,
                        platform: platform,
                        format: format,
                        status: 'used'
                    }
                });

                const body = Array.isArray(p.body) ? p.body.join('\n') : (p.body || 'Conteúdo em geração...');
                const headline = Array.isArray(p.headline) ? p.headline.join(' ') : (p.headline || 'Sem Título');

                const contentPiece = await prisma.contentPiece.create({
                    data: {
                        brandProfileId: brand.id,
                        topicId: topic.id,
                        title: title,
                        platform: platform,
                        format: format,
                        status: 'draft',
                        versions: {
                            create: {
                                headline: headline,
                                body: body,
                                hook: "Criado no Multiplicador de Conteúdo",
                                metadata: { sourceKnowledge: knowledgeItemId }
                            }
                        }
                    }
                });
                return contentPiece;
            })
        );

        return createdPieces;
    }
}

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
            Você é o Mestre Clonador de Conteúdo e Diretor de Arte para a marca "${brand.name}".
            O DNA da marca (Tom de voz e posicionamento): ${brand.description}
            
            O usuário fez upload do seguinte material base (Transcrição/Palestra/Nota):
            """
            ${knowledge.content.substring(0, 40000)}${knowledge.content.length > 40000 ? '... [Conteúdo truncado para caber no limite da IA]' : ''}
            """
            
            SUA TAREFA DE MULTIPLICAÇÃO: 
            Despedace, mastigue e transforme esse "texto único" em exatas 3 peças formatadas e distintas para Redes Sociais que devem soar naturalmente como o posicionamento da marca, em PORTUGUÊS DO BRASIL.
            
            - Peça 1: Um Carrossel denso e educativo de Alto Impacto para **Instagram** focado na audiência B2C. (Formato: carousel). DEVE CONTER: Roteiro de slides com texto para imagem e prompt para cada imagem.
            - Peça 2: Um Roteiro de Vídeo Curto, ágil, com um Gancho Hipnótico no início, para **Reels/TikTok**. (Formato: video script). DEVE CONTER: Instruções visuais de cena.
            - Peça 3: Um Artigo/Postagem Executiva aprofundada para **LinkedIn** focada em liderança e Business-to-Person (B2P). (Formato: article).
            
            Retorne estritamente um JSON com a chave "pieces" que contém um array dos 3 objetos gerados na exata matriz abaixo:
            [{
               "title": "Title Interno do Dashboard",
               "platform": "Instagram" | "LinkedIn" | "TikTok",
               "format": "carousel" | "video script" | "article",
               "headline": "A manchete principal (capa)",
               "hook": "Gancho hipnótico de primeira linha",
               "body": "Legenda completa (incluindo quebras de linha)",
               "cta": "Chamada para ação matadora",
               "hashtags": ["tag1", "tag2"],
               "visualConcept": "Conceito visual premium para esta peça",
               "imagePrompt": "Prompt Mestre para o DALL-E 3 gerar a imagem de CAPA",
               "slides": [ // APENAS para carrosseis - Mínimo 5 slides
                  {
                    "slideNumber": 1,
                    "textOnImage": "Texto curto e impactante para o slide",
                    "imagePrompt": "Prompt específico para a arte deste slide"
                  }
               ],
               "videoScenes": [ // APENAS para video script
                  {
                    "time": "0s-5s",
                    "action": "Descrição da cena",
                    "audio": "O que deve ser falado ou áudio de fundo"
                  }
               ]
            }]
        `;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'system', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.7
        });

        const rawContent = response.choices[0].message.content || '{"pieces": []}';
        const parsed = JSON.parse(rawContent);
        const result = parsed.pieces || parsed.data || [];

        if (result.length === 0) {
            console.error("GPT failed to return pieces in expected format:", rawContent);
            throw new Error("A IA não gerou as peças no formato esperado. Tente novamente.");
        }

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
                                hook: p.hook || "Criado no Multiplicador de Conteúdo",
                                body: body,
                                cta: p.cta || "",
                                hashtags: p.hashtags || [],
                                visualConcept: p.visualConcept || "Conceito a ser refinado",
                                imagePrompt: p.imagePrompt || "",
                                metadata: {
                                    sourceKnowledge: knowledgeItemId,
                                    slides: p.slides || [],
                                    videoScenes: p.videoScenes || []
                                }
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

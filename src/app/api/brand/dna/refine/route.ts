import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { OpenAI } from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || session?.user?.role !== 'admin') {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
        }

        const { brandId, knowledgeItemIds } = await req.json();

        if (!brandId || !knowledgeItemIds || knowledgeItemIds.length === 0) {
            return NextResponse.json({ error: "Dados insuficientes" }, { status: 400 });
        }

        // 1. Buscar os itens de conhecimento selecionados
        const items = await prisma.knowledgeItem.findMany({
            where: {
                id: { in: knowledgeItemIds },
                brandProfileId: brandId
            }
        });

        if (items.length === 0) {
            return NextResponse.json({ error: "Nenhum material encontrado" }, { status: 404 });
        }

        const knowledgeContext = items.map(item => `--- TITULO: ${item.title} ---\n${item.content}`).join("\n\n");

        // 2. Buscar DNA atual
        const brand = await prisma.brandProfile.findUnique({
            where: { id: brandId },
            include: {
                editorialPillars: true,
                audienceSegments: true
            }
        });

        // 3. Chamar IA para sugerir refinamento
        const prompt = `
Você é um Estrategista de Branding Senior. Sua tarefa é analisar materiais brutos (artigos, transcrições, notas) e sugerir atualizações no "DNA da Marca" de um cliente.

CONTEXTO ATUAL DA MARCA:
Nome: ${brand?.name}
Descrição Atual: ${brand?.description}
Tom de Voz Atual: ${brand?.toneOfVoice}
Pilares Iniciais: ${brand?.editorialPillars.map((p: any) => p.title).join(", ")}

NOVOS MATERIAIS DE CONHECIMENTO DISPONÍVEIS:
${knowledgeContext}

SUA TAREFA:
Baseado nos NOVOS MATERIAIS, gere uma versão refinada e profunda do DNA da marca.
Você deve retornar APENAS um JSON no seguinte formato:

{
  "description": "Uma bio/descrição mais rica e profunda baseada nos materiais",
  "toneOfVoice": "Um refinamento do tom de voz baseado no estilo dos materiais",
  "editorialPillars": [
    { "title": "Título do Pilar", "description": "O que abrange" }
  ],
  "audienceSegments": [
    { "name": "Nome do Segmento", "painPoints": ["dor 1", "dor 2"] }
  ]
}

REGRAS:
- Extraia a ESSÊNCIA TÉCNICA dos materiais.
- Crie pelo menos 3 e no máximo 5 Pilares Editoriais.
- Identifique dores reais do público nos textos.
- Seja extremamente específico e autoritário (especialista).
- Retorne APENAS o JSON, sem textos adicionais.
- Idioma: Português Brasileiro (PT-BR).
`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "Você é um especialista em branding e estratégia de conteúdo." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const suggestedDna = JSON.parse(response.choices[0].message.content || "{}");

        return NextResponse.json({ 
            success: true, 
            suggestions: suggestedDna 
        });

    } catch (error: any) {
        console.error("Erro ao refinar DNA:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

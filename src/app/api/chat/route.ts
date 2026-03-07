import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { messages } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Mensagens inválidas' }, { status: 400 });
        }

        const lastMessage = messages[messages.length - 1];

        // 1. Fetch ALL Knowledge Items for the context (Naïve local RAG to avoid Pinecone setup for the MVP)
        const brand = await prisma.brandProfile.findFirst({
            include: {
                knowledgeItems: {
                    take: 20, // Pegando as 20 notas mais recentes - Suficiente pro tamanho limite do GPT-4o
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!brand) throw new Error("Brand not found");

        const context = brand.knowledgeItems.map((item) => `[${item.type}] ${item.title}:\n${item.content}`).join('\n\n--- \n\n');

        const systemPrompt = `
      You are the AI avatar and Semantic Brain for ${brand.name}.
      Your job is to answer questions, brainstorm, or write drafts based SPECIFICALLY on the Knowledge Base provided below.
      
      Brand Voice: ${brand.toneOfVoice}
      
      KNOWLEDGE BASE INSUMOS:
      ${context}

      Rules:
      1. Always speak in Brazilian Portuguese (PT-BR).
      2. If the user asks something NOT covered by the knowledge base, politely inform them you don't have that specific context documented yet, but offer your analytical opinion based on the brand's general tone.
      3. Draw connections between different notes if relevant.
      4. Sound like a trusted, authoritative, and intelligent co-pilot.
    `;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages
            ],
            temperature: 0.7,
            stream: false // For simplicity, we are doing a single response MVP
        });

        const reply = response.choices[0].message.content;

        return NextResponse.json({ success: true, reply });

    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

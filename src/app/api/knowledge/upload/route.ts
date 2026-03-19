import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const formData = await req.formData();
        const file = formData.get('file') as Blob | null;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Polyfill for DOMMatrix (needed by pdf-parse on Node server)
        if (typeof global !== 'undefined' && !((global as any).DOMMatrix)) {
            (global as any).DOMMatrix = class DOMMatrix {
                constructor() {}
            };
        }

        const { createRequire } = await import('module');
        const nodeRequire = createRequire(import.meta.url);
        const pdfParser = nodeRequire('pdf-parse');
        
        const data = await pdfParser(buffer);

        return NextResponse.json({ success: true, text: data.text });
    } catch (error: any) {
        console.error("PDF Parsing Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

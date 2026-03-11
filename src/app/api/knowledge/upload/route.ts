import { NextResponse } from 'next/server';


export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as Blob | null;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const pdfModule = await import('pdf-parse');
        // @ts-ignore
        const parser = pdfModule.default || pdfModule;
        const data = await parser(buffer);

        return NextResponse.json({ success: true, text: data.text });
    } catch (error: any) {
        console.error("PDF Parsing Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { ContentGenerationService } from "@/services/content/ContentGenerationService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;
        const body = await req.json();
        const { versionId, userFeedback } = body;

        if (!versionId || !userFeedback) {
            return NextResponse.json({ error: "versionId and userFeedback are required" }, { status: 400 });
        }

        const newVersion = await ContentGenerationService.refineContent(id, versionId, userFeedback);

        return NextResponse.json({ success: true, version: newVersion });
    } catch (error: any) {
        console.error("Refine Content Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

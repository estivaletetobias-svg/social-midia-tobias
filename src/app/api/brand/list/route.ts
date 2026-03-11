import { NextResponse } from 'next/server';
import { BrandService } from '@/services/brand/BrandService';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceId = (session.user as any).workspaceId;

    try {
        const brands = await BrandService.listBrands(workspaceId);
        return NextResponse.json({ success: true, brands });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

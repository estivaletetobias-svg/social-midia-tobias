import { NextResponse } from 'next/server';
import { BrandService } from '@/services/brand/BrandService';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
        return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    try {
        const brand = await BrandService.getBrandProfile(workspaceId);
        return NextResponse.json(brand);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const brand = await BrandService.upsertBrandProfile(body);
        return NextResponse.json(brand);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

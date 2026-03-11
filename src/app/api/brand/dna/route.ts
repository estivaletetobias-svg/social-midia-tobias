import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('id');

        if (!brandId) {
            return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
        }

        const brand = await prisma.brandProfile.findUnique({
            where: { id: brandId },
            include: {
                editorialPillars: true,
                audienceSegments: true,
                socialProfiles: true,
            } as any
        });

        if (!brand) {
            return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: brand });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceId = (session.user as any).workspaceId;

    try {
        const body = await req.json();
        const { id, name, description, toneOfVoice, writingRules, editorialPillars, audienceSegments, socialProfiles } = body;

        let brandId = id;

        // If no ID, we CREATE a new brand profile
        if (!brandId) {
            const newBrand = await prisma.brandProfile.create({
                data: {
                    workspaceId,
                    name: name || "Novo Cliente",
                    description: description || "",
                    toneOfVoice: toneOfVoice || "",
                    writingRules: writingRules || [],
                }
            });
            brandId = newBrand.id;
        } else {
            // Update the main brand profile
            await prisma.brandProfile.update({
                where: { id: brandId },
                data: {
                    name,
                    description,
                    toneOfVoice,
                    writingRules: writingRules || [],
                }
            });
        }

        // Update Editorial Pillars (Delete and Recreate for simplicity in MVP)
        if (editorialPillars) {
            await prisma.editorialPillar.deleteMany({ where: { brandProfileId: brandId } });
            await prisma.editorialPillar.createMany({
                data: editorialPillars.map((p: any) => ({
                    brandProfileId: brandId,
                    title: p.title,
                    description: p.description || '',
                }))
            });
        }

        // Update Audience Segments
        if (audienceSegments) {
            await prisma.audienceSegment.deleteMany({ where: { brandProfileId: brandId } });
            await prisma.audienceSegment.createMany({
                data: audienceSegments.map((s: any) => ({
                    brandProfileId: brandId,
                    name: s.name,
                    painPoints: s.painPoints || [],
                    desires: s.desires || [],
                }))
            });
        }

        // Update Social Profiles
        if (socialProfiles) {
            await (prisma as any).socialProfile.deleteMany({ where: { brandProfileId: brandId } });
            await (prisma as any).socialProfile.createMany({
                data: socialProfiles.map((s: any) => ({
                    brandProfileId: brandId,
                    platform: s.platform.toLowerCase(),
                    handle: s.handle || '',
                    url: s.url || '',
                    isActive: s.isActive !== undefined ? s.isActive : true,
                }))
            });
        }

        return NextResponse.json({ success: true, brandId });
    } catch (error: any) {
        console.error('DNA Update Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const brand = await prisma.brandProfile.findFirst({
            include: {
                editorialPillars: true,
                audienceSegments: true,
                socialProfiles: true,
            }
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
    try {
        const body = await req.json();
        const { id, name, description, toneOfVoice, writingRules, editorialPillars, audienceSegments, socialProfiles } = body;

        // Se não tiver ID, pegamos o primeiro (comportamento de MVP)
        let brandId = id;
        if (!brandId) {
            const firstBrand = await prisma.brandProfile.findFirst();
            brandId = firstBrand?.id;
        }

        if (!brandId) {
            return NextResponse.json({ error: 'No brand profile to update' }, { status: 400 });
        }

        // Update the main brand profile
        const updatedBrand = await prisma.brandProfile.update({
            where: { id: brandId },
            data: {
                name,
                description,
                toneOfVoice,
                writingRules: writingRules || [],
            }
        });

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
            await prisma.socialProfile.deleteMany({ where: { brandProfileId: brandId } });
            await prisma.socialProfile.createMany({
                data: socialProfiles.map((s: any) => ({
                    brandProfileId: brandId,
                    platform: s.platform.toLowerCase(),
                    handle: s.handle || '',
                    url: s.url || '',
                    isActive: s.isActive !== undefined ? s.isActive : true,
                }))
            });
        }

        return NextResponse.json({ success: true, data: updatedBrand });
    } catch (error: any) {
        console.error('DNA Update Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

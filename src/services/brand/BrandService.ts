import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class BrandService {
    /**
     * Creates or updates a brand profile.
     */
    static async upsertBrandProfile(data: {
        id?: string;
        workspaceId: string;
        name: string;
        description?: string;
        toneOfVoice?: string;
        writingRules?: string[];
    }) {
        if (data.id) {
            return prisma.brandProfile.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    description: data.description,
                    toneOfVoice: data.toneOfVoice,
                    writingRules: data.writingRules,
                },
            });
        }

        return prisma.brandProfile.create({
            data: {
                workspaceId: data.workspaceId,
                name: data.name,
                description: data.description,
                toneOfVoice: data.toneOfVoice,
                writingRules: data.writingRules,
            },
        });
    }

    static async listBrands(workspaceId: string) {
        return prisma.brandProfile.findMany({
            where: { workspaceId },
            orderBy: { name: 'asc' },
        });
    }

    static async getBrandProfile(brandId: string) {
        return prisma.brandProfile.findUnique({
            where: { id: brandId },
            include: {
                voiceGuides: true,
                editorialPillars: true,
                audienceSegments: true,
                offers: true,
                socialProfiles: true,
            } as any,
        });
    }

    static async addPillar(brandProfileId: string, title: string, description: string) {
        return prisma.editorialPillar.create({
            data: {
                brandProfileId,
                title,
                description,
            },
        });
    }
}

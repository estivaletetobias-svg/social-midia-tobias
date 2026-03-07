import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class BrandService {
    /**
     * Creates or updates a brand profile with its voice guide and pillars.
     */
    static async upsertBrandProfile(data: {
        workspaceId: string;
        name: string;
        description?: string;
        toneOfVoice?: string;
        writingRules?: string[];
    }) {
        return prisma.brandProfile.upsert({
            where: { id: data.workspaceId }, // For MVP we assume 1 brand per workspace
            update: {
                name: data.name,
                description: data.description,
                toneOfVoice: data.toneOfVoice,
                writingRules: data.writingRules,
            },
            create: {
                workspaceId: data.workspaceId,
                name: data.name,
                description: data.description,
                toneOfVoice: data.toneOfVoice,
                writingRules: data.writingRules,
            },
        });
    }

    static async getBrandProfile(workspaceId: string) {
        return prisma.brandProfile.findFirst({
            where: { workspaceId },
            include: {
                voiceGuides: true,
                editorialPillars: true,
                audienceSegments: true,
                offers: true,
            },
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

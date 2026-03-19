import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const ContentStatus = {
    IDEA: 'idea',
    RESEARCH: 'research',
    DRAFT: 'draft',
    REVIEW: 'review',
    APPROVED: 'approved',
    SCHEDULED: 'scheduled',
    PUBLISHED: 'published',
    ARCHIVED: 'archived',
} as const;

export type ContentStatusType = typeof ContentStatus[keyof typeof ContentStatus];

export class WorkflowService {
    /**
     * Transition a content piece through states.
     * Includes validation and logging for audit trails.
     */
    static async transitionStatus(data: {
        contentPieceId: string;
        userId?: string;
        to: ContentStatusType;
        comment?: string;
    }) {
        const content = await prisma.contentPiece.findUnique({
            where: { id: data.contentPieceId },
        });

        if (!content) throw new Error('Content piece not found');

        const statusFrom = content.status;
        const statusTo = data.to;

        // Transition validation logic (can be expanded)
        if (statusFrom === statusTo) return content;

        return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const updated = await tx.contentPiece.update({
                where: { id: data.contentPieceId },
                data: { status: statusTo },
            });

            await tx.approvalLog.create({
                data: {
                    contentPieceId: data.contentPieceId,
                    statusFrom,
                    statusTo,
                    userId: data.userId,
                    comment: data.comment,
                },
            });

            return updated;
        });
    }

    static async getHistory(contentPieceId: string) {
        return prisma.approvalLog.findMany({
            where: { contentPieceId },
            orderBy: { createdAt: 'desc' },
        });
    }


}

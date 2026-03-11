import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export class AssetService {
    /**
     * Uploads an image from a URL or Base64 string.
     * Fallback to local storage (public/uploads) if S3 is not configured.
     */
    static async uploadAndPersist(
        imageSource: string,
        metadata: {
            brandProfileId: string;
            contentPieceId?: string;
            prompt?: string;
            model?: string;
            versionId?: string;
        }
    ) {
        const isS3Configured = 
            process.env.AWS_ACCESS_KEY_ID && 
            process.env.AWS_ACCESS_KEY_ID !== '...' &&
            process.env.AWS_SECRET_ACCESS_KEY && 
            process.env.AWS_SECRET_ACCESS_KEY !== '...';

        const fileName = `${uuidv4()}.png`;
        const key = `generated/${metadata.brandProfileId}/${fileName}`;
        let buffer: Buffer;

        // 1. Prepare Buffer
        if (imageSource.startsWith('data:image')) {
            const base64Data = imageSource.replace(/^data:image\/\w+;base64,/, '');
            buffer = Buffer.from(base64Data, 'base64');
        } else {
            const response = await fetch(imageSource);
            if (!response.ok) throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        }

        let finalUrl = '';

        if (isS3Configured) {
            try {
                const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
                const s3Client = new S3Client({
                    region: process.env.AWS_REGION || 'us-east-1',
                    credentials: {
                        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
                    }
                });

                await s3Client.send(
                    new PutObjectCommand({
                        Bucket: process.env.AWS_S3_BUCKET || 'ai-content-engine',
                        Key: key,
                        Body: buffer,
                        ContentType: 'image/png',
                    })
                );

                finalUrl = process.env.AWS_ENDPOINT_URL_S3
                    ? `${process.env.AWS_ENDPOINT_URL_S3}/${process.env.AWS_S3_BUCKET}/${key}`
                    : `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
            } catch (s3Error) {
                console.error("S3 Upload failed, falling back to data URL:", s3Error);
                finalUrl = imageSource.startsWith('data:image') ? imageSource : imageSource;
            }
        } else {
            // No S3, use Data URL or Local Path
            console.warn("AWS S3 not configured. Using direct source URL.");
            finalUrl = imageSource;
        }

        // 2. Persist in Database
        return prisma.asset.create({
            data: {
                brandProfileId: metadata.brandProfileId,
                contentPieceId: metadata.contentPieceId,
                type: 'image',
                url: finalUrl,
                key: key,
                prompt: metadata.prompt,
                model: metadata.model,
                metadata: metadata.versionId ? { versionId: metadata.versionId } : {},
            },
        });
    }
}

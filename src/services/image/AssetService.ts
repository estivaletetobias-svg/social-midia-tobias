import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';

export class AssetService {
    private static s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
        // Useful if using Cloudflare R2 or DigitalOcean Spaces
        // endpoint: process.env.AWS_ENDPOINT_URL_S3, 
    });

    private static bucketName = process.env.AWS_S3_BUCKET || 'ai-content-engine';

    /**
     * Uploads an image from a URL or Base64 string to S3/R2 and saves it in the database.
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
        const key = `generated/${metadata.brandProfileId}/${uuidv4()}.png`;
        let buffer: Buffer;

        // Detect if source is base64 (Google Imagen) or a URL (OpenAI DALL-E)
        if (imageSource.startsWith('data:image')) {
            const base64Data = imageSource.replace(/^data:image\/\w+;base64,/, '');
            buffer = Buffer.from(base64Data, 'base64');
        } else {
            const response = await fetch(imageSource);
            if (!response.ok) throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        }

        // Upload to S3/R2
        await this.s3Client.send(
            new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: buffer,
                ContentType: 'image/png',
                // ACL: 'public-read', // Depends on your S3 configuration
            })
        );

        // Calculate public URL (This assumes a standard S3 format. Change if using CDN/R2)
        const publicUrl = process.env.AWS_ENDPOINT_URL_S3
            ? `${process.env.AWS_ENDPOINT_URL_S3}/${this.bucketName}/${key}`
            : `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        // Persist in Prisma Database
        return prisma.asset.create({
            data: {
                brandProfileId: metadata.brandProfileId,
                contentPieceId: metadata.contentPieceId,
                type: 'image',
                url: publicUrl,
                key: key,
                prompt: metadata.prompt,
                model: metadata.model,
                metadata: metadata.versionId ? { versionId: metadata.versionId } : {},
            },
        });
    }
}

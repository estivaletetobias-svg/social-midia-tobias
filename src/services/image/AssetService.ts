import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

export class AssetService {
    /**
     * Uploads an image to Storage (Supabase or S3) and persists the record.
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
        const fileName = `${uuidv4()}.png`;
        const path = `generated/${metadata.brandProfileId}/${fileName}`;
        let buffer: Buffer;

        // 1. Prepare Buffer from source
        if (imageSource.startsWith('data:image')) {
            const base64Data = imageSource.replace(/^data:image\/\w+;base64,/, '');
            buffer = Buffer.from(base64Data, 'base64');
        } else {
            const response = await fetch(imageSource);
            if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        }

        let finalUrl = imageSource; // Default to source if everything fails

        // 2. Try Supabase Storage (Preferred)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseKey) {
            try {
                const supabase = createClient(supabaseUrl, supabaseKey);
                const { data, error } = await supabase.storage
                    .from('assets')
                    .upload(path, buffer, {
                        contentType: 'image/png',
                        upsert: true
                    });

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('assets')
                    .getPublicUrl(path);
                
                finalUrl = publicUrl;
            } catch (supaError) {
                console.error("Supabase Storage error:", supaError);
            }
        } 
        // 3. Fallback to S3 if configured
        else if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ACCESS_KEY_ID !== '...') {
            try {
                const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
                const s3Client = new S3Client({
                    region: process.env.AWS_REGION || 'us-east-1',
                    credentials: {
                        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
                    }
                });

                await s3Client.send(new PutObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET || 'ai-content-engine',
                    Key: path,
                    Body: buffer,
                    ContentType: 'image/png',
                }));

                finalUrl = process.env.AWS_ENDPOINT_URL_S3
                    ? `${process.env.AWS_ENDPOINT_URL_S3}/${process.env.AWS_S3_BUCKET}/${path}`
                    : `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${path}`;
            } catch (s3Error) {
                console.error("S3 Fallback failed:", s3Error);
            }
        }

        // 4. Record in Database
        return prisma.asset.create({
            data: {
                brandProfileId: metadata.brandProfileId,
                contentPieceId: metadata.contentPieceId,
                type: 'image',
                url: finalUrl,
                key: path,
                prompt: metadata.prompt,
                model: metadata.model,
                metadata: metadata.versionId ? { versionId: metadata.versionId } : {},
            },
        });
    }
}

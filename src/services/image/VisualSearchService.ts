import google from 'googlethis';
import axios from 'axios';

export class VisualSearchService {
    /**
     * Searches for images using Google (via googlethis) as a fallback/free option.
     */
    static async searchGoogle(query: string) {
        try {
            const images = await google.image(query, { safe: false });
            return images.map((img: any) => ({
                url: img.url,
                thumbnail: img.preview?.url || img.url,
                source: 'Google',
                width: img.width,
                height: img.height
            }));
        } catch (error) {
            console.error('Google search failed:', error);
            return [];
        }
    }

    /**
     * Searches for high-quality aesthetic images on Unsplash.
     * Note: Requires UNSPLASH_ACCESS_KEY in .env
     */
    static async searchUnsplash(query: string) {
        const accessKey = process.env.UNSPLASH_ACCESS_KEY;
        if (!accessKey) {
            console.warn('UNSPLASH_ACCESS_KEY not found in environment.');
            return [];
        }

        try {
            const response = await axios.get(`https://api.unsplash.com/search/photos`, {
                params: {
                    query,
                    per_page: 20,
                    client_id: accessKey
                }
            });

            return response.data.results.map((img: any) => ({
                url: img.urls.regular,
                thumbnail: img.urls.small,
                source: 'Unsplash',
                width: img.width,
                height: img.height,
                author: img.user.name
            }));
        } catch (error) {
            console.error('Unsplash search failed:', error);
            return [];
        }
    }
}

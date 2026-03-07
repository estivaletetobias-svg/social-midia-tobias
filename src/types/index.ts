/**
 * Global Type Definitions for AI Content Engine
 */

export type Platform = 'Instagram' | 'LinkedIn';

export type ContentFormat =
    | 'carousel'
    | 'short video script'
    | 'single image post'
    | 'article'
    | 'short post';

export type WorkflowStatus =
    | 'idea'
    | 'research'
    | 'draft'
    | 'review'
    | 'approved'
    | 'scheduled'
    | 'published'
    | 'archived';

export interface BrandContext {
    name: string;
    description: string;
    toneOfVoice: string;
    writingRules: string[];
    pillars: string[];
}

export interface GenerationStrategy {
    goal: string;
    message: string;
    audience: string;
    angle: string;
}

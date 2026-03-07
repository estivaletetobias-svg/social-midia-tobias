import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const workspace = await prisma.workspace.upsert({
        where: { id: 'default-workspace' },
        update: {},
        create: {
            id: 'default-workspace',
            name: 'Social Midia Tobias Workspace',
        },
    })

    const brand = await prisma.brandProfile.upsert({
        where: { id: 'tobias-brand' },
        update: {},
        create: {
            id: 'tobias-brand',
            workspaceId: workspace.id,
            name: 'Tobias Estivalete - AI Strategist',
            description: 'Expert in AI-driven content automation and digital strategy.',
            toneOfVoice: 'Professional, Authoritative, Innovative, yet Accessible.',
            writingRules: [
                'Avoid generic buzzwords like "game-changer"',
                'Use specific data points or real-world examples',
                'Maintain a professional expert voice',
                'End with a clear, strategic CTA'
            ],
            editorialPillars: {
                create: [
                    { title: 'AI Automation', description: 'Practical ways to use AI in business workflows.' },
                    { title: 'Content Strategy', description: 'Deep dives into building sustainable digital brands.' },
                    { title: 'Productivity', description: 'Systems for high-performance creative output.' }
                ]
            },
            voiceGuides: {
                create: [
                    {
                        platform: 'Instagram',
                        rules: ['Visual-first storytelling', 'Concise but punchy captions', 'Uses relevant hooks']
                    },
                    {
                        platform: 'LinkedIn',
                        rules: ['Thought leadership focus', 'Long-form insights', 'Professional networking tone']
                    }
                ]
            }
        },
    })

    console.log({ workspace, brand })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

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
            name: 'Tobias Estivalete | Performance & Saúde',
            description: 'Especialista em Performance, Saúde, Fitness e Musculação. www.tobiasestivalete.com.br',
            toneOfVoice: 'Autoritário, embasado cientificamente, motivador, direto e voltado para excelência.',
            writingRules: [
                'Evite jargões marombeiros exagerados (ex: "frango", "tá pago").',
                'Use dados ou princípios fisiológicos para justificar as orientações.',
                'Mantenha uma postura de mentor de alta performance.',
                'O objetivo final é entregar valor prático (o que comer, como treinar, como descansar).'
            ],
            editorialPillars: {
                create: [
                    { title: 'Nutrição e Saúde', description: 'Orientações sobre alimentação para hipertrofia, emagrecimento e longevidade.' },
                    { title: 'Treinamento de Força', description: 'Técnicas, biomecânica e planejamento de musculação.' },
                    { title: 'Alta Performance', description: 'Mentalidade, biohacking, sono e rotina de alto rendimento.' }
                ]
            },
            voiceGuides: {
                create: [
                    {
                        platform: 'Instagram',
                        rules: ['Estética prime', 'Textos quebrados em tópicos curtos', 'Foco no visual e no gancho inicial rápido (Hook)']
                    },
                    {
                        platform: 'LinkedIn',
                        rules: ['Foco na disciplina, rotina e como a saúde reflete no sucesso corporativo', 'Reflexões longas e bem estruturadas']
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

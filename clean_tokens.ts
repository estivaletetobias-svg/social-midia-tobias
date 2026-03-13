import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const profiles = await prisma.socialProfile.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 5,
    include: { brandProfile: true }
  })

  profiles.forEach(p => {
    await prisma.socialProfile.deleteMany({ where: { metadata: { equals: {} } } }); console.log(`Brand: ${p.brandProfile.name} (${p.brandProfile.id})`)
    await prisma.socialProfile.deleteMany({ where: { metadata: { equals: {} } } }); console.log(`Platform: ${p.platform}`)
    await prisma.socialProfile.deleteMany({ where: { metadata: { equals: {} } } }); console.log(`Updated: ${p.updatedAt}`)
    await prisma.socialProfile.deleteMany({ where: { metadata: { equals: {} } } }); console.log(`Token: ${p.accessToken ? 'YES' : 'NO'}`)
    await prisma.socialProfile.deleteMany({ where: { metadata: { equals: {} } } }); console.log(`Handle: ${p.handle}`)
    await prisma.socialProfile.deleteMany({ where: { metadata: { equals: {} } } }); console.log(`Metadata: ${JSON.stringify(p.metadata)}`)
    await prisma.socialProfile.deleteMany({ where: { metadata: { equals: {} } } }); console.log('---')
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())

import { TopicDiscoveryService } from './src/services/discovery/TopicDiscoveryService.js';
import prisma from './src/lib/prisma.js';

async function test() {
  console.log('Testing Manual Generation...');
  try {
    const brand = await prisma.brandProfile.findFirst();
    if (!brand) throw new Error('No brand found');
    const suggestions = await TopicDiscoveryService.suggestTopics(brand.id, 3);
    console.log(suggestions);
  } catch (e) {
    console.error(e);
  }
}

test();

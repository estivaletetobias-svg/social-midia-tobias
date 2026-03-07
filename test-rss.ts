import { RssDiscoveryService } from './src/services/discovery/RssDiscoveryService.js';

async function test() {
  console.log('Testing RSS...');
  try {
    // using a more fitness/performance friendly RSS for this specific test
    const res = await RssDiscoveryService.ingestNews('tobias-brand', 'https://feeds.feedburner.com/t-nation');
    console.log(res);
  } catch(e) {
    console.error(e);
  }
}

test();

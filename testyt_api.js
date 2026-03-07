const TranscriptClient = require('youtube-transcript-api');

async function test() {
    try {
        const list = await TranscriptClient.fetchTranscript('dQw4w9WgXcQ'); // not sure what method
        console.log(list);
    } catch (e) { console.error(e) }
}
test();

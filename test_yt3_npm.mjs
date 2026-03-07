import { YoutubeTranscript } from 'youtube-transcript';

(async () => {
    try {
        const tr = await YoutubeTranscript.fetchTranscript('kYx8D97w-fU');
        console.log(tr.length);
    } catch (e) {
        console.log("Error:", e);
    }
})();

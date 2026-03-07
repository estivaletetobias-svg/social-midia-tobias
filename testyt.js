async function x(url) {
  try {
     const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        const videoId = videoIdMatch ? videoIdMatch[1] : url;
        console.log("Video ID:", videoId);
        const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9"
            }
        });
        const html = await res.text();

        const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
        if (!captionMatch) return console.log('no captionTracks');
        const captionTracks = JSON.parse(captionMatch[1]);
        const track = captionTracks.find(t => t.languageCode === 'pt') || captionTracks[0];
        const captionUrl = track.baseUrl.replace(/\\u0026/g, '&');
        console.log("Caption URL:", captionUrl);

        const xmlRes = await fetch(captionUrl);
        const xmlContent = await xmlRes.text();
        // console.log("XML length:", xmlContent.length);

        const textRegex = /<text[^>]*>(.*?)<\/text>/g;
        let pieces = [];
        let r;
        while ((r = textRegex.exec(xmlContent)) !== null) {
            pieces.push(r[1]);
        }
        console.log("Extracted Pieces:", pieces.length, pieces.slice(0, 3));
  } catch(e) { console.error(e) }
}
x('https://www.youtube.com/watch?v=kYx8D97w-fU'); // Example Portuguese video or whatever

async function run(url) {
    try {
        const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        const videoId = videoIdMatch ? videoIdMatch[1] : url;
        console.log("Video ID:", videoId);
        const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7"
            }
        });
        const html = await res.text();

        const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
        if (!captionMatch) return console.log('no captionTracks');
        const captionTracks = JSON.parse(captionMatch[1]);

        const track = captionTracks.find(t => t.languageCode === 'pt') || captionTracks[0];
        const captionUrl = track.baseUrl.replace(/\\u0026/g, '&');
        console.log("Caption URL length:", captionUrl.length);

        const xmlRes = await fetch(captionUrl);
        const xmlContent = await xmlRes.text();
        console.log("XML length:", xmlContent.length);
        console.log("Sample XML:", xmlContent.substring(0, 500));

        const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/gi;
        let pieces = [];
        let r;
        while ((r = textRegex.exec(xmlContent)) !== null) {
            let piece = r[1];
            piece = piece.replace(/<[^>]*>?/gm, '');
            piece = piece.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
            if (piece) pieces.push(piece);
        }
        console.log("Extracted Pieces:", pieces.length, pieces.slice(0, 3));
        console.log("Final length:", pieces.join(' ').length);
    } catch (e) { console.error(e) }
}
run('https://www.youtube.com/watch?v=kYx8D97w-fU');

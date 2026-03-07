async function x() {
  const videoId = 'dQw4w9WgXcQ';
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
  const html = await res.text();
  const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
  if (!captionMatch) return console.log('no captionTracks');
  let captionUrl = JSON.parse(captionMatch[1])[0].baseUrl;
  captionUrl = captionUrl.replace(/\\u0026/g, '&');
  console.log('url:', captionUrl);
  const xmlRes = await fetch(captionUrl);
  const xmlContent = await xmlRes.text();
  console.log('xml starts with:', xmlContent.substring(0, 150));
  
  const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/gi;
        let pieces = [];
        let r;
        while ((r = textRegex.exec(xmlContent)) !== null) {
            let piece = r[1];
            piece = piece.replace(/<[^>]*>?/gm, '');
            piece = piece.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
            if (piece) pieces.push(piece);
        }
    console.log('extracted length:', pieces.length);
}
x();

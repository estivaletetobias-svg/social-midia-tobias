async function x() {
  const videoId = 'jNQXAC9IVRw'; // Me at the zoo
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
  const html = await res.text();
  const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
  if (!captionMatch) return console.log('no captionTracks');
  let captionUrl = JSON.parse(captionMatch[1])[0].baseUrl;
  captionUrl = captionUrl.replace(/\\u0026/g, '&');
  const xmlRes = await fetch(captionUrl);
  const xmlContent = await xmlRes.text();
  console.log('xml length:', xmlContent.length);
  console.log('first 50 chars:', xmlContent.substring(0, 50));
}
x();

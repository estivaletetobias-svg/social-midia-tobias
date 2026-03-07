async function x() {
  try {
    const res = await fetch('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    const html = await res.text();
    const match = html.match(/"captionTracks":\[(.*?)\]/);
    if (!match) return console.log('no match');
    const tracksStr = `[${match[1]}]`;
    const tracks = JSON.parse(tracksStr);
    const url = tracks[0].baseUrl;
    const res2 = await fetch(url);
    const xml = await res2.text();
    console.log(xml.substring(0, 500));
  } catch(e) { console.error(e) }
}
x()

const https = require('https');

async function getTranscript(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const match = data.match(/"captionTracks":\[(.*?)\]/);
                if (!match) return reject(new Error('No captions'));
                try {
                    const tracks = JSON.parse(`[${match[1]}]`);
                    const baseUrl = tracks[0].baseUrl.replace(/\\u0026/g, '&');
                    
                    https.get(baseUrl, (res2) => {
                       let xml = '';
                       res2.on('data', chunk => xml += chunk);
                       res2.on('end', () => {
                           const texts = [...xml.matchAll(/<text[^>]*>(.*?)<\/text>/g)];
                           resolve(texts.map(t => {
                               return unescapeHtml(t[1]);
                           }).join(' '));
                       });
                    });
                } catch(e) { reject(e) }
            });
        }).on('error', reject);
    });
}
function unescapeHtml(safe) {
    return safe.replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

getTranscript('https://www.youtube.com/watch?v=dQw4w9WgXcQ').then(console.log).catch(console.error);

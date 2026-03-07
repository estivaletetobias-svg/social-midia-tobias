async function x() {
    try {
        const res = await fetch('https://www.youtube.com/watch?v=kYx8D97w-fU');
        const html = await res.text();
        const fs = require('fs');
        fs.writeFileSync('ythtml.txt', html);
        console.log("Done");
    } catch (e) { }
}
x();

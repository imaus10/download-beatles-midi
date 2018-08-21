const fs = require('fs');
const puppeteer = require('puppeteer');
const request = require('request');

if (process.argv.length !== 3) {
    console.log('Usage: node index.js save_dir');
    process.exit(1);
}
const saveDir = process.argv[2];

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://www.midiworld.com/files/995/');
    const songs = await page.evaluate(() => {
        const songList = document.getElementById('page')
                                 .getElementsByTagName('ul')[0]
                                 .getElementsByTagName('li');
        return Array.from(songList).map((li) => {
            const songName = li.children[0].innerText;
            const downloadLink = li.children[1].href;
            return [songName, downloadLink];
        })
    });
    const fileRequests = songs.map(([songName, downloadLink]) => {
        return new Promise((resolve) => {
            request(downloadLink).pipe(fs.createWriteStream(`${saveDir}/${songName}.mid`))
                                 .on('close', resolve)
                                 .on('error', (error) => {
                                     console.error(`Problem downloading ${songName}:`, error);
                                 });
        });
    });
    await Promise.all(fileRequests);
    await browser.close();
})();

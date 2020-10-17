'use strict';
const puppeteer = require('puppeteer');

crawlPage();

function crawlPage() {
    (async () => {

        const args = [
            "--disable-setuid-sandbox",
            "--no-sandbox",
            "--blink-settings=imagesEnabled=false",
        ];
        const options = {
            args,
            headless: true,
            ignoreHTTPSErrors: true,
        };

        const browser = await puppeteer.launch(options);
        const page = await browser.newPage();
        await page.setViewport({
            width: 1920,
            height: 1080
        });
        await page.goto("https://nytimes.com", {
            waitUntil: 'networkidle0',
            timeout: 300000
        });

        const addresses = await page.$$eval('a', as => as.map(a => a.href));

        for (let i = 0; i < addresses.length; i++) {
            console.log(addresses[i]);
            const nameStart = addresses[i].lastIndexOf('/');
            const nameEnd = addresses[i].lastIndexOf('#');
            const name = addresses[i].substring(nameStart + 1, nameEnd);
            console.log({ name });
            try {
                await page.goto(addresses[i], { "waitUntil": "networkidle0", timeout: 300000 });
                await page.screenshot({
                    path: `screenshots/screenshots-${name}-${i}.png`,
                    fullPage: true
                });
                await page.screenshot({
                    path: `screenshots/screenshots-${name}-${i}-fold.png`,
                    fullPage: false
                });
            } catch (error) {
                console.error(error);
            };
        }

        await page.close();
        await browser.close();

    })().catch((error) => {
        console.error(error);
    });

}

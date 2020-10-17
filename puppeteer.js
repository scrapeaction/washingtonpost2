'use strict';
const puppeteer = require('puppeteer');

crawlPage();

function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}

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
            timeout: 0
        });

        const addresses = await page.$$eval('a', as => as.map(a => a.href));

        for (let i = 0; i < addresses.length; i++) {
            console.log(addresses[i]);
            try {
                await page.goto(addresses[i], { waitUntil: "networkidle0", timeout: 0 });

                await page.evaluate(async () => {
                    // Scroll down to bottom of page to activate lazy loading images
                    document.body.scrollIntoView(false);

                    // Wait for all remaining lazy loading images to load
                    await Promise.all(Array.from(document.getElementsByTagName('img'), image => {
                        if (image.complete) {
                            return;
                        }

                        return new Promise((resolve, reject) => {
                            image.addEventListener('load', resolve);
                            image.addEventListener('error', reject);
                        });
                    }));
                });

                await delay(4000);
                console.log(`waited for four seconds`);
                await page.screenshot({
                    path: `screenshots/screenshots-${i}.png`,
                    fullPage: true
                });
                await page.screenshot({
                    path: `screenshots/screenshots-${i}-fold.png`,
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

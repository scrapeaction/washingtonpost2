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
                // Get scroll width and height of the rendered page and set viewport
                const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
                const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
                await page.setViewport({ width: bodyWidth, height: bodyHeight });

                // Set the viewport before scrolling
                await page.setViewport({ width: 1366, height: 768 });

                // Get the height of the page after navigating to it.
                // This strategy to calculate height doesn't work always though. 
                const bodyHandle = await page.$('body');
                const { height } = await bodyHandle.boundingBox();
                await bodyHandle.dispose();

                // Scroll viewport by viewport, allow the content to load
                const calculatedVh = page.viewport().height;
                let vhIncrease = 0;
                while (vhIncrease + calculatedVh < height) {
                    // Here we pass the calculated viewport height to the context
                    // of the page and we scroll by that amount
                    await page.evaluate(_calculatedVh => {
                        window.scrollBy(0, _calculatedVh);
                    }, calculatedVh);
                    await waitFor(300);
                    vhIncrease = vhIncrease + calculatedVh;
                }

                // Setting the viewport to the full height might reveal extra elements
                await page.setViewport({ width: 1366, height: calculatedVh });

                // Scroll back to the top of the page by using evaluate again.
                await page.evaluate(_ => {
                    window.scrollTo(0, 0);
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

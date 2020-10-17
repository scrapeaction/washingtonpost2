'use strict';
const puppeteer = require('puppeteer');

crawlPage("https://www.nytimes.com/", "frontpage");
crawlPage("https://www.nytimes.com/section/world", "world");
crawlPage("https://www.nytimes.com/section/us", "us");
crawlPage("https://www.nytimes.com/section/politics", "politics");
crawlPage("https://www.nytimes.com/section/nyregion", "nyregion");
crawlPage("https://www.nytimes.com/section/business", "business");
crawlPage("https://www.nytimes.com/section/opinion", "opinion");
crawlPage("https://www.nytimes.com/section/technology", "technology");
crawlPage("https://www.nytimes.com/section/science", "science");
crawlPage("https://www.nytimes.com/section/health", "health");
crawlPage("https://www.nytimes.com/section/sports", "sports");
crawlPage("https://www.nytimes.com/section/arts", "arts");
crawlPage("https://www.nytimes.com/section/books", "books");
crawlPage("https://www.nytimes.com/section/style", "style");
crawlPage("https://www.nytimes.com/section/food", "food");
crawlPage("https://www.nytimes.com/section/travel", "travel");
crawlPage("https://www.nytimes.com/section/magazine", "magazine");
crawlPage("https://www.nytimes.com/section/t-magazine", "times-magazine");
crawlPage("https://www.nytimes.com/section/realestate", "real-estate");
crawlPage("https://www.nytimes.com/section/video", "video");




function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}

function crawlPage(url, prefix) {
    (async () => {

        const args = [
            "--disable-setuid-sandbox",
            "--no-sandbox",
            "--blink-settings=imagesEnabled=true",
        ];
        const options = {
            args,
            headless: true,
            ignoreHTTPSErrors: true
        };

        const browser = await puppeteer.launch(options);
        const page = await browser.newPage();
        await page.setViewport({
            width: 1920,
            height: 1080
        });
        
        await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 0
        });

        const addresses = await page.$$eval('a', as => as.map(a => a.href));

        for (let i = 0; i < addresses.length; i++) {
            console.log(`Now serving ${i} of ${addresses.length}: ${addresses[i]}`);
            try {
                await page.goto(addresses[i], { waitUntil: "networkidle0", timeout: 0 });

                const watchDog = page.waitForFunction(() => 'window.status === "ready"', { timeout: 0 });
                await watchDog;

                await page.screenshot({
                    path: `screenshots/${prefix}-${i}.png`,
                    fullPage: true
                });
                await page.screenshot({
                    path: `screenshots/${prefix}-${i}-fold.png`,
                    fullPage: false
                });
            } catch (error) {
                console.error(error);
            } finally {
                console.log(`Finished serving ${i} of ${addresses.length}: ${addresses[i]}`);
            };
        }

        await page.close();
        await browser.close();

    })().catch((error) => {
        console.error(error);
    });

}

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');
const path = require('path');

(async () => {
  // ...initialize Puppeteer...
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });
  const page = await browser.newPage();

  // Replace single cookie file loading with loading from 'cookies' folder
  const cookiesDir = path.join(__dirname, 'cookies');
  let allCookies = [];
  if (fs.existsSync(cookiesDir)) {
      const cookieFiles = fs.readdirSync(cookiesDir).filter(file => file.endsWith('.json'));
      for (const file of cookieFiles) {
          const filePath = path.join(cookiesDir, file);
          const cookies = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          if (Array.isArray(cookies)) {
              allCookies.push(...cookies);
          }
      }
  }
  if (allCookies.length > 0) await page.setCookie(...allCookies);

  // ...go to Epic Games Store...
  await page.goto('https://store.epicgames.com/en-US', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.css-cdosd6', { timeout: 10000 }); // Wait for free games section
  
  // ...collect game links with "Free Now"...
  const links = await page.evaluate(() => {
    const linksArr = [];
    const anchors = document.querySelectorAll('a.css-g3jcms');
    anchors.forEach(anchor => {
      // Check if the anchor text includes "Free Now"
      if (anchor.innerText.includes("Free Now")) {
        linksArr.push(anchor.href);
      }
    });
    return linksArr;
  });
  console.log("Found links:", links);

  // ...iterate over collected links...
  for (const gameLink of links) {
    try {
      console.log(`Processing: ${gameLink}`);
      await page.goto(gameLink, { waitUntil: 'networkidle2' });
      
      // Check for Cloudflare captcha
      const captchaDetected = await page.$('.cf_challenge_container');
      if (captchaDetected) {
        console.log("Captcha detected. Waiting for manual resolution...");
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }); // Wait up to 60 seconds
        console.log("Navigation completed after captcha.");
      }
      
      // FIX: Ensure hCaptcha widget is fully visible by scrolling it into view
      const hcaptcha = await page.$('.h-captcha');
      if (hcaptcha) {
        console.log("hCaptcha detected. Scrolling into view...");
        await page.evaluate(el => el.scrollIntoView(), hcaptcha);
        await page.waitForTimeout(3000); // Allow additional time for proper rendering
      }
      
      // Handle age gate pop-up if it appears
      const ageBtn = await page.$('#btn_age_continue');
      if (ageBtn) {
        await ageBtn.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
      }
      
      // Look for an active "Get" button; skip if not found.
      const getButton = await page.$('button[data-testid="purchase-cta-button"]:not([disabled])');
      if (!getButton) {
        console.log("No active 'Get' button found. Skipping...");
        continue;
      }
      
      // Click the 'Get' button.
      await getButton.click();
      
      // Wait 3 seconds for the payment iframe to become ready.
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Wait for the payment container iframe to load.
      await page.waitForSelector('#webPurchaseContainer iframe', { timeout: 15000 });
      const iframeElement = await page.$('#webPurchaseContainer iframe');
      const frame = await iframeElement.contentFrame();
      
      // Wait for the 'Place Order' button inside the iframe.
      await frame.waitForSelector('button.payment-btn--primary', { timeout: 15000 });
      
      // Wait until the 'Place Order' button has the proper CSS applied.
      await frame.waitForFunction(() => {
        const btn = document.querySelector('button.payment-btn--primary');
        if (!btn) return false;
        const style = window.getComputedStyle(btn);
        // Create dummy element for background-color.
        const dummyBg = document.createElement('div');
        dummyBg.style.backgroundColor = 'var(--pmt-ui-color-highlight)';
        document.body.appendChild(dummyBg);
        const expectedBg = window.getComputedStyle(dummyBg).backgroundColor;
        dummyBg.remove();
        // Create dummy element for text color.
        const dummyColor = document.createElement('div');
        dummyColor.style.color = 'var(--pmt-ui-color-basic-white)';
        document.body.appendChild(dummyColor);
        const expectedColor = window.getComputedStyle(dummyColor).color;
        dummyColor.remove();
        return style.backgroundColor === expectedBg && style.color === expectedColor;
      }, { timeout: 15000 });
      
      const placeOrderBtn = await frame.$('button.payment-btn--primary');
      await placeOrderBtn.click();
      
      console.log("Clicked 'Place Order'. Waiting 10 seconds for captcha/completion...");
      await new Promise(resolve => setTimeout(resolve, 10000000));
      
    } catch (err) {
      console.log(`Error processing ${gameLink}: ${err.message}`);
    }
  }
  
  await browser.close();
})();

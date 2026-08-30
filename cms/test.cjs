const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));
  
  await page.goto('http://localhost:5173/login');
  await page.waitForSelector('input[type="text"]');
  await page.type('input[type="text"]', 'admin');
  await page.type('input[type="password"]', 'admin');
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 1000));
  await page.goto('http://localhost:5173/dashboard');
  await new Promise(r => setTimeout(r, 1000));
  
  console.log('Current URL:', page.url());
  await page.screenshot({ path: 'dashboard.png' });
  
  await browser.close();
})();

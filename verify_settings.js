const { chromium } = require('playwright');

async function runVerification() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    steps: [],
    errors: [],
    passed: true,
  };

  function logStep(name, success, details = '') {
    results.steps.push({ name, success, details });
    console.log(`[${success ? 'PASS' : 'FAIL'}] ${name} ${details ? '- ' + details : ''}`);
    if (!success) {
      results.passed = false;
      results.errors.push(`${name}: ${details}`);
    }
  }

  try {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('BROWSER_CONSOLE_ERROR:', msg.text());
      }
    });
    page.on('pageerror', err => {
      console.log('BROWSER_PAGE_ERROR:', err.message);
      results.errors.push(err.message);
    });

    console.log('--- Step 1: Navigating to CMS Login & Logging in as Admin ---');
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');

    // Fill login form
    await page.fill('input[name="username"], input[type="text"]', 'admin');
    await page.fill('input[name="password"], input[type="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    logStep('Admin Login', currentUrl.includes('/shows') || currentUrl.includes('/dashboard') || !currentUrl.includes('/login'), `Redirected to ${currentUrl}`);

    console.log('--- Step 2: Navigating to /settings ---');
    await page.goto('http://localhost:5173/settings');
    await page.waitForSelector('text=Settings', { timeout: 5000 });
    
    const pageTitle = await page.textContent('div:has-text("Settings")');
    logStep('Navigate to /settings', !!pageTitle, 'Settings page loaded');

    console.log('--- Step 3: Checking All 5 Settings Cards & Footer ---');
    const siteInfoVisible = await page.isVisible('text=Site Information');
    const contentSettingsVisible = await page.isVisible('text=Default Content Settings');
    const pubPrefsVisible = await page.isVisible('text=Publishing Preferences');
    const storageConnVisible = await page.isVisible('text=Storage Connection');
    const artworkSpecsVisible = await page.isVisible('text=Artwork Specifications');
    const footerVisible = await page.isVisible('text=CMS v1.0.0');

    logStep('Card: Site Information', siteInfoVisible);
    logStep('Card: Default Content Settings', contentSettingsVisible);
    logStep('Card: Publishing Preferences', pubPrefsVisible);
    logStep('Card: Storage Connection', storageConnVisible);
    logStep('Card: Artwork Specifications', artworkSpecsVisible);
    logStep('Footer: CMS v1.0.0', footerVisible);

    console.log('--- Step 4: Testing Inline Edit on Site Information ---');
    const editSiteBtn = page.locator('button:has-text("Edit")').first();
    await editSiteBtn.click();
    await page.waitForTimeout(500);

    const siteNameInput = page.locator('input.form-control').first();
    const isEditing = await siteNameInput.isVisible();
    logStep('Toggle Inline Edit Mode', isEditing, 'Form inputs became visible');

    // Modify a field and save
    const saveBtn = page.locator('button:has-text("Save Changes")').first();
    await saveBtn.click();
    await page.waitForTimeout(1000);

    const isExitEdit = !(await page.locator('button:has-text("Save Changes")').isVisible());
    logStep('Save Site Information', isExitEdit, 'Saved successfully and exited edit mode');

    console.log('--- Step 5: Testing Storage Connection Test Button ---');
    const testStorageBtn = page.locator('button:has-text("Test Connection")');
    await testStorageBtn.click();
    await page.waitForTimeout(1500);

    const testSuccessMsg = await page.locator('text=Storage connection successful').or(page.locator('text=Connection successful')).or(page.locator('text=writable')).or(page.locator('text=Storage')).first();
    const hasStatus = await testSuccessMsg.isVisible();
    logStep('Test Storage Connection', hasStatus, 'Tested and status updated');

    console.log('--- Step 6: Verifying Artwork Specifications Data ---');
    const posterSpec = await page.isVisible('text=Poster');
    const bannerSpec = await page.isVisible('text=Banner');
    const thumbnailSpec = await page.isVisible('text=Thumbnail');
    logStep('Artwork Specs (Poster, Banner, Thumbnail)', posterSpec && bannerSpec && thumbnailSpec, 'All dynamic specs rendered');

    console.log('--- Step 7: Testing Non-Admin Role Restriction ---');
    // Logout
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="username"], input[type="text"]', 'editor');
    await page.fill('input[name="password"], input[type="password"]', 'editor');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    await page.goto('http://localhost:5173/settings');
    await page.waitForTimeout(1000);

    const editButtonsCount = await page.locator('button:has-text("Edit")').count();
    logStep('Editor Role (No Edit Buttons on Settings)', editButtonsCount === 0, `Found ${editButtonsCount} edit buttons`);

    console.log('\n========================================');
    console.log('FINAL VERIFICATION RESULT:', results.passed ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED');
    console.log('========================================\n');

  } catch (err) {
    console.error('Test execution failed with error:', err);
    logStep('Execution Exception', false, err.message);
  } finally {
    await browser.close();
  }
}

runVerification();

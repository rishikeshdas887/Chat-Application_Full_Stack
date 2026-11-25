const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = '/home/whitedevil/.gemini/antigravity/brain/b4f08ce3-45d6-4a76-a7dd-987d84caf18a/screenshots';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function runDirectEntryTest() {
  console.log('--- STARTING DIRECT CHAT ENTRY TEST ---');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // 1. Visit Welcome Screen
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // Verify 1-Click Direct Button is present
    const directBtn = page.getByRole('button', { name: /Enter as|Enter Chat Directly/i }).first();
    const isDirectVisible = await directBtn.isVisible();
    console.log(`Direct entry button visible: ${isDirectVisible}`);
    if (!isDirectVisible) {
      throw new Error('FAILED: Direct entry button is not visible on welcome screen!');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '36_welcome_screen_direct_entry_card.png') });

    // 2. Click Direct Entry
    console.log('Clicking 1-Click Direct Entry button...');
    await directBtn.click();
    await page.waitForURL('**/chat', { timeout: 8000 });
    console.log('✓ Successfully entered /chat via 1-Click Direct Entry!');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '37_direct_chat_entered.png') });

    // 3. Log out to test phone direct entry
    console.log('Logging out to test Phone Direct Entry...');
    const logoutBtn = page.getByRole('button', { name: /Log Out/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForURL('**/', { timeout: 5000 });
    }

    // 4. Test Phone Number Form Direct Entry
    console.log('Testing Phone Number Form Direct Entry...');
    const phoneOptionBtn = page.getByRole('button', { name: /Continue with Phone & Authenticator/i });
    await phoneOptionBtn.click();
    await page.waitForTimeout(400);

    await page.locator('#phone-input').fill('+919876543210');
    const directPhoneBtn = page.getByRole('button', { name: /Enter Chat Directly with this Number/i });
    await directPhoneBtn.click();
    await page.waitForURL('**/chat', { timeout: 8000 });
    console.log('✓ Successfully entered /chat directly from Phone Number Form!');

    // 5. Log out to test registration seamless entry
    console.log('Logging out to test Registration Seamless Entry...');
    await page.getByRole('button', { name: /Log Out/i }).click();
    await page.waitForTimeout(500);

    // 6. Test Make an Account
    const registerOptionBtn = page.getByRole('button', { name: /Make an Account/i });
    await registerOptionBtn.click();
    await page.waitForTimeout(400);

    const testUname = `Alex${Math.floor(100 + Math.random() * 900)}`;
    const testPnum = `+9191234${Math.floor(10000 + Math.random() * 90000)}`;

    await page.locator('#reg-username').fill(testUname);
    await page.locator('#reg-phone').fill(testPnum);
    await page.locator('#reg-password').fill('SecurePassword123');

    console.log(`Submitting new registration for ${testUname} (${testPnum})...`);
    await page.getByRole('button', { name: /Create Account/i }).click();

    await page.waitForURL('**/chat', { timeout: 10000 });
    console.log(`✓ Registration seamlessly auto-logged in and entered /chat as ${testUname}!`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '38_registered_user_direct_chat.png') });

    console.log('\n========================================');
    console.log('ALL DIRECT CHAT ENTRY TESTS PASSED!');
    console.log('========================================');
  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runDirectEntryTest();

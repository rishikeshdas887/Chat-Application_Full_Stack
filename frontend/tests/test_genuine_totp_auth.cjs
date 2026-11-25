const { chromium } = require('playwright');
const { authenticator } = require('otplib');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.resolve('/home/whitedevil/.gemini/antigravity/brain/b4f08ce3-45d6-4a76-a7dd-987d84caf18a/screenshots');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function runGenuineTotpVerification() {
  console.log('--- STARTING GENUINE TOTP AUTHENTICATION TEST ---');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // 1. Visit Login Page
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // 2. Select Phone & Authenticator
    const phoneBtn = page.getByRole('button', { name: /Continue with Phone/i });
    await phoneBtn.click();
    await page.waitForTimeout(400);

    const testPhone = `+9198765${Math.floor(10000 + Math.random() * 90000)}`;
    await page.locator('#phone-input').fill(testPhone);
    await page.getByRole('button', { name: /Continue to Authenticator/i }).click();

    // 3. Wait for Authenticator Screen
    await page.waitForSelector('text=Google Authenticator', { timeout: 8000 });
    console.log('✓ Google Authenticator screen loaded');

    // 4. Verify Bypass UI is 100% GONE
    const bypassButtonCount = await page.locator('button:has-text("123456")').count();
    const bypassTextCount = await page.locator('text=Quick testing bypass code').count();
    console.log(`Bypass button count: ${bypassButtonCount}, Bypass text count: ${bypassTextCount}`);
    if (bypassButtonCount > 0 || bypassTextCount > 0) {
      throw new Error('FAILED: Quick testing bypass code is still present in the UI!');
    }
    console.log('✓ Confirmed: Quick testing bypass code has been completely removed from UI.');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '33_clean_authenticator_screen_no_bypass.png') });

    // 5. Test entering fake code '123456'
    console.log('Attempting to authenticate with fake bypass code 123456...');
    const inputs = page.locator('input[type="text"][inputmode="numeric"]');
    for (let i = 0; i < 6; i++) {
      await inputs.nth(i).fill(String(i + 1));
    }
    await page.waitForTimeout(500);

    const verifyBtn = page.getByRole('button', { name: /Verify & Sign In/i });
    if (await verifyBtn.isVisible()) {
      await verifyBtn.click();
    }
    await page.waitForTimeout(600);

    // Check if error is displayed and still on the same page
    const currentUrl = page.url();
    const errorMsgVisible = await page.locator('text=Invalid 6-digit Authenticator code').isVisible();
    console.log(`URL after entering fake code: ${currentUrl}`);
    console.log(`Error message visible: ${errorMsgVisible}`);

    if (currentUrl.includes('/chat')) {
      throw new Error('FAILED: Fake code 123456 was able to bypass authentication!');
    }
    console.log('✓ Confirmed: Fake code 123456 was strictly rejected!');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '34_fake_code_rejected.png') });

    // 6. Extract genuine Secret Setup Key
    const secretKey = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="totp-secret-key"]');
      if (el) return el.textContent.trim();
      const spans = Array.from(document.querySelectorAll('span'));
      const label = spans.find((s) => s.textContent.includes('SECRET SETUP KEY') || s.textContent.includes('Secret Setup Key'));
      return label ? label.parentElement.querySelector('span:last-child').textContent.trim() : null;
    });

    console.log('Extracted Secret Setup Key:', secretKey);
    if (!secretKey) {
      throw new Error('FAILED: Could not find Secret Setup Key on screen');
    }

    // 7. Generate Genuine TOTP Code using Authenticator standard algorithm (RFC 6238)
    const genuineTotp = authenticator.generate(secretKey);
    console.log('Generated genuine Authenticator TOTP token:', genuineTotp);

    // 8. Fill in genuine Authenticator token
    for (let i = 0; i < 6; i++) {
      await inputs.nth(i).fill(genuineTotp[i]);
    }
    await page.waitForTimeout(500);

    if (await verifyBtn.isVisible()) {
      await verifyBtn.click().catch(() => {});
    }

    // 9. Verify transition to /chat
    await page.waitForURL('**/chat', { timeout: 10000 });
    console.log('✓ Confirmed: Successfully authenticated and transitioned to /chat via genuine Authenticator TOTP!');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '35_authenticated_via_genuine_totp.png') });

    console.log('\n========================================');
    console.log('ALL GENUINE TOTP VERIFICATION TESTS PASSED!');
    console.log('========================================');
  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runGenuineTotpVerification();

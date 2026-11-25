const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = '/home/whitedevil/.gemini/antigravity/brain/b4f08ce3-45d6-4a76-a7dd-987d84caf18a/screenshots';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const VIEWPORTS = [
  { name: '1_desktop_laptop', width: 1440, height: 900, isMobile: false },
  { name: '2_tablet', width: 768, height: 1024, isMobile: true },
  { name: '3_mobile_modern', width: 390, height: 844, isMobile: true },
  { name: '4_mobile_small_legacy', width: 320, height: 568, isMobile: true },
];

async function runResponsiveTestSuite() {
  console.log('=== STARTING MULTI-DEVICE RESPONSIVENESS VERIFICATION ===\n');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (let i = 0; i < VIEWPORTS.length; i++) {
      const vp = VIEWPORTS[i];
      const testPhone = `+91987654${i}210`;
      console.log(`Testing viewport: ${vp.name} (${vp.width}x${vp.height})...`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile,
        hasTouch: vp.isMobile,
      });
      const page = await context.newPage();

      // 1. Start fresh with clean state
      await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);

      // Verify no horizontal overflow
      const authScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const authClientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      console.log(`  [Auth] scrollWidth: ${authScrollWidth}, clientWidth: ${authClientWidth}`);
      if (authScrollWidth > authClientWidth + 2) {
        throw new Error(`FAIL: Horizontal overflow detected on Auth page at ${vp.width}px!`);
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `responsive_auth_${vp.name}.png`) });

      // 2. Test OTP Screen scaling
      const phoneOptionBtn = page.getByRole('button', { name: /Continue with Phone & Authenticator/i });
      if (await phoneOptionBtn.isVisible()) {
        await phoneOptionBtn.click();
        await page.waitForTimeout(300);
        await page.locator('#phone-input').fill(testPhone);
        await page.getByRole('button', { name: /Continue to Authenticator/i }).click();
        await page.waitForSelector('text=Google Authenticator', { timeout: 10000 });

        // Check if all 6 OTP inputs are within viewport
        const otpInputs = page.locator('input[type="text"][inputmode="numeric"]');
        const count = await otpInputs.count();
        console.log(`  [OTP] Found ${count} digit input boxes`);
        if (count === 6) {
          const firstBox = await otpInputs.first().boundingBox();
          const lastBox = await otpInputs.last().boundingBox();
          console.log(`  [OTP] First box X: ${firstBox?.x}, Last box X+Width: ${(lastBox?.x || 0) + (lastBox?.width || 0)}`);
          if (firstBox && lastBox && (lastBox.x + lastBox.width > vp.width)) {
            throw new Error(`FAIL: 6-digit OTP inputs overflowed screen at ${vp.width}px!`);
          }
        }

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, `responsive_otp_${vp.name}.png`) });
      }

      // 3. Enter Chat Directly
      await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);
      const directBtn = page.getByRole('button', { name: /Enter as|Enter Chat Directly/i }).first();
      if (await directBtn.isVisible()) {
        await directBtn.click();
      } else {
        await page.evaluate(() => {
          localStorage.setItem('chatapp_user', JSON.stringify({ userId: 1, username: 'Rishikesh', phoneNumber: '+916297799544', token: 'demo-token' }));
          localStorage.setItem('chatapp_token', 'demo-token');
        });
        await page.goto('http://localhost:5173/chat', { waitUntil: 'domcontentloaded' });
      }
      await page.waitForURL('**/chat', { timeout: 8000 });
      await page.waitForTimeout(500);

      // Verify no horizontal overflow on chat page
      const chatScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const chatClientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      console.log(`  [Chat] scrollWidth: ${chatScrollWidth}, clientWidth: ${chatClientWidth}`);
      if (chatScrollWidth > chatClientWidth + 2) {
        throw new Error(`FAIL: Horizontal overflow detected on Chat page at ${vp.width}px!`);
      }

      // Check Mobile Hamburger Menu behavior on tablet/mobile
      if (vp.width <= 768) {
        const toggleBtn = page.locator('button[title="Toggle Sidebar"]').first();
        const isToggleVisible = await toggleBtn.isVisible();
        console.log(`  [Mobile] Sidebar toggle button visible: ${isToggleVisible}`);
        if (!isToggleVisible) {
          throw new Error('FAIL: Mobile sidebar toggle button should be visible on <= 768px screens!');
        }

        // Test opening mobile sidebar drawer
        await toggleBtn.click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, `responsive_chat_drawer_${vp.name}.png`) });

        // Close sidebar drawer
        const backdrop = page.locator('div[style*="rgba(0, 0, 0, 0.5)"]');
        if (await backdrop.isVisible()) {
          await backdrop.click({ position: { x: 5, y: 5 } }).catch(() => {});
          await page.waitForTimeout(300);
        }
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `responsive_chat_${vp.name}.png`) });
      console.log(`✓ Viewport ${vp.name} passed all responsive checks!\n`);

      await context.close();
    }

    console.log('====================================================');
    console.log('ALL MULTI-DEVICE RESPONSIVE CHECKS PASSED PERFECTLY!');
    console.log('====================================================');
  } catch (err) {
    console.error('Responsive test failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runResponsiveTestSuite();

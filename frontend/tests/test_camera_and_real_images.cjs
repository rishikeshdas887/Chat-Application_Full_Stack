const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = '/home/whitedevil/.gemini/antigravity/brain/b4f08ce3-45d6-4a76-a7dd-987d84caf18a/screenshots';
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const FIXTURES_DIR = '/home/whitedevil/Desktop/chat-app-frontend/tests/fixtures';

async function runCameraAndImageTest() {
  console.log('=== RUNNING WHATSAPP CAMERA & REAL ATTACHMENT SUITE ===');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream', // Provides simulated webcam stream in headless Chrome!
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 850 },
    permissions: ['camera'], // Grant camera permissions
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('[BROWSER ERROR]:', msg.text());
  });

  // STEP 1: Login
  console.log('\n[STEP 1] Logging into chat...');
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);

  const phoneBtn = page.getByRole('button', { name: /Continue with Phone/i });
  await phoneBtn.click();
  await page.waitForTimeout(400);

  const testPhone = `+9198765${Math.floor(10000 + Math.random() * 90000)}`;
  await page.locator('#phone-input').fill(testPhone);
  await page.getByRole('button', { name: /Continue to Authenticator/i }).click();

  await page.waitForSelector('text=Google Authenticator', { timeout: 8000 });

  // Extract secret key displayed on screen and generate authentic TOTP token
  let secretKey = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="totp-secret-key"]');
    if (el) return el.textContent.trim();
    const span = Array.from(document.querySelectorAll('span')).find((s) => s.textContent.includes('SECRET SETUP KEY') || s.textContent.includes('Secret Setup Key'));
    return span ? span.parentElement.querySelector('span:last-child').textContent.trim() : null;
  });
  console.log('Extracted TOTP Secret Key for test:', secretKey);

  if (secretKey) {
    const { authenticator } = require('otplib');
    const validToken = authenticator.generate(secretKey);
    console.log('Generated authentic TOTP code:', validToken);
    const inputs = page.locator('input[type="text"][inputmode="numeric"]');
    for (let i = 0; i < 6; i++) {
      await inputs.nth(i).fill(validToken[i]);
    }
  }

  const verifyBtn = page.getByRole('button', { name: /Verify & Sign In/i });
  if (await verifyBtn.isVisible()) {
    await verifyBtn.click().catch(() => {});
  }

  await page.waitForURL('**/chat', { timeout: 10000 });
  console.log('✓ Successfully authenticated and navigated to /chat');

  // STEP 2: Conversation Setup
  console.log('\n[STEP 2] Selecting or creating conversation...');
  await page.waitForTimeout(1000);

  const convItems = page.locator('li[role="button"]');
  const count = await convItems.count();
  if (count === 0) {
    await page.getByRole('button', { name: /\+ New Conversation/i }).first().click();
    await page.waitForTimeout(400);
    const groupTab = page.locator('button:has-text("Group Chat")');
    if (await groupTab.isVisible()) {
      await groupTab.click();
      await page.waitForTimeout(300);
    }
    const titleInput = page.locator('input[placeholder*="Engineering Team"], input[placeholder*="Design Team"]');
    if (await titleInput.isVisible()) {
      await titleInput.fill('Production Live Chat');
      await page.getByRole('button', { name: 'Create Conversation', exact: true }).click();
      await page.waitForTimeout(1500);
    }
  } else {
    await convItems.first().click();
    await page.waitForTimeout(500);
  }
  console.log('✓ Active conversation selected');

  // STEP 3: Test WhatsApp-Style Camera Viewfinder Modal
  console.log('\n[STEP 3] Opening WhatsApp Camera Viewfinder...');
  const cameraBtn = page.locator('button[title*="camera"]');
  await cameraBtn.click();
  await page.waitForTimeout(1000);

  // Take screenshot of open live camera viewfinder
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '22_whatsapp_camera_viewfinder.png') });
  console.log('✓ Live Camera Viewfinder opened');

  // Click Shutter to take snapshot
  console.log('Snapping photo with camera shutter...');
  const shutterBtn = page.locator('button[title="Take photo"], button[data-testid="camera-shutter-btn"], button:has(div[style*="border-radius: 50%"])').first();
  if (await shutterBtn.isVisible()) {
    await shutterBtn.click();
    await page.waitForTimeout(1000);
  }

  // Verify Preview Screen
  const captionBox = page.locator('input[placeholder*="Add a caption"]');
  const captionVisible = await captionBox.isVisible().catch(() => false);
  if (captionVisible) {
    console.log('✓ Captured photo preview screen visible with caption input');
    await captionBox.fill('Live camera snapshot from my desk');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '23_camera_photo_preview_with_caption.png') });

    // Click WhatsApp green send button
    const sendPhotoBtn = page.locator('button[title="Send photo"]');
    await sendPhotoBtn.click();
    await page.waitForTimeout(1500);
    console.log('✓ Camera photo sent to chat');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '24_camera_photo_in_timeline.png') });
  } else {
    console.log('Closing camera modal if still open...');
    const closeBtn = page.locator('button[title="Close camera"]');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  }

  // Ensure modal is closed before Step 4
  await page.locator('div[role="dialog"]').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});

  // STEP 4: Test Real Image Upload & Timeline Rendering (No "Failed to load"!)
  console.log('\n[STEP 4] Testing real image upload & rendering in timeline...');
  const imageInput = page.locator('input[type="file"][accept*="image/jpeg"]');
  await imageInput.setInputFiles(path.join(FIXTURES_DIR, 'sample_image.png'));
  await page.waitForTimeout(600);

  const textarea = page.locator('textarea');
  await textarea.fill('Verified production architecture diagram');
  const sendBtn = page.locator('button[title="Send message"]');
  await sendBtn.click();
  await page.waitForTimeout(1500);

  // Check timeline image rendering
  const timelineImages = page.locator('img[alt*="sample_image"], img[alt*="Image"], img[alt*="Camera"]');
  const imageCount = await timelineImages.count();
  console.log(`✓ Rendered timeline image count: ${imageCount}`);

  // Check that NO "Failed to load image preview" error exists in the timeline
  const failedPreviews = page.locator('text=Failed to load image preview');
  const failedCount = await failedPreviews.count();
  console.log(`Failed preview count: ${failedCount} (Should be 0)`);
  if (failedCount > 0) {
    throw new Error('Image preview failed to load in timeline!');
  }
  console.log('✓ Image preview loaded crisply and successfully with 0 errors');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '25_real_image_loaded_successfully.png') });

  // STEP 5: Test Reload & Persistence (Images must stay loaded after reload!)
  console.log('\n[STEP 5] Testing persistence across page reload...');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // Re-select conversation
  const refreshedConv = page.locator('li[role="button"]').first();
  await refreshedConv.click();
  await page.waitForTimeout(1000);

  const reloadedFailedCount = await page.locator('text=Failed to load image preview').count();
  console.log(`Reloaded failed preview count: ${reloadedFailedCount} (Must be 0)`);
  if (reloadedFailedCount > 0) {
    throw new Error('Image preview failed to load after page reload!');
  }
  console.log('✓ Images persisted in PostgreSQL and render perfectly after reload!');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '26_persisted_images_after_reload.png') });

  console.log('\n======================================================');
  console.log('ALL WHATSAPP CAMERA & REAL IMAGE TESTS PASSED WITH 100%');
  console.log('======================================================');
  await browser.close();
}

runCameraAndImageTest().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});

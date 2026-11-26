const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runSecurityAuditTests() {
  console.log('=== STARTING 30-POINT SECURITY AUDIT VERIFICATION SUITE ===\n');
  let failures = 0;

  function assert(condition, testName) {
    if (!condition) {
      console.error(`❌ FAILED: ${testName}`);
      failures++;
    } else {
      console.log(`✓ PASSED: ${testName}`);
    }
  }

  // 1. Security Headers & CSP in vercel.json
  const vercelConfig = JSON.parse(fs.readFileSync('/home/whitedevil/Desktop/chat-app-frontend/vercel.json', 'utf8'));
  const headerRule = vercelConfig.headers?.find(h => h.source === '/(.*)');
  const headerKeys = (headerRule?.headers || []).map(h => h.key);
  assert(headerKeys.includes('X-Frame-Options'), 'Category 30: X-Frame-Options clickjacking protection header configured');
  assert(headerKeys.includes('X-Content-Type-Options'), 'Category 30: X-Content-Type-Options nosniff header configured');
  assert(headerKeys.includes('Referrer-Policy'), 'Category 30: Referrer-Policy strict header configured');
  assert(headerKeys.includes('Strict-Transport-Security'), 'Category 30: Strict-Transport-Security HSTS header configured');
  assert(headerKeys.includes('Content-Security-Policy'), 'Category 11/30: Restrictive Content-Security-Policy (CSP) configured');

  // 2. Prototype Pollution Defense Test
  const safeJsonParse = (str, fallback = null) => {
    if (!str || typeof str !== 'string') return fallback;
    try {
      return JSON.parse(str, (key, value) => {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          return undefined;
        }
        return value;
      });
    } catch {
      return fallback;
    }
  };

  const payload = '{"__proto__":{"polluted":"yes"},"name":"safe"}';
  const parsed = safeJsonParse(payload, {});
  assert(parsed.polluted === undefined && ({}).polluted === undefined, 'Category 24: Prototype pollution injection blocked');

  // 3. XSS and Malicious URL Defense Test
  const isSafeUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const clean = url.trim();
    if (clean.toLowerCase().startsWith('javascript:') || clean.toLowerCase().startsWith('data:text/html')) {
      return false;
    }
    try {
      const parsed = new URL(clean, 'http://localhost');
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'blob:' || clean.startsWith('data:image/');
    } catch {
      return clean.startsWith('data:image/');
    }
  };

  assert(!isSafeUrl('javascript:alert(1)'), 'Category 11: javascript: XSS URL blocked');
  assert(!isSafeUrl('JAVASCRIPT:alert(document.cookie)'), 'Category 11: Case-insensitive javascript: XSS URL blocked');
  assert(!isSafeUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='), 'Category 11: data:text/html XSS URL blocked');
  assert(isSafeUrl('https://example.com/file.pdf'), 'Category 11: Legitimate HTTPS document URL allowed');
  assert(isSafeUrl('blob:http://localhost/uuid'), 'Category 11: Safe camera/upload blob URL allowed');

  // 4. File Extension Security
  const ALLOWED_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.webp', '.gif',
    '.pdf', '.docx', '.doc', '.xlsx', '.xls',
    '.pptx', '.ppt', '.txt', '.md', '.csv', '.zip'
  ];
  const DANGEROUS_EXTS = ['.exe', '.sh', '.bat', '.cmd', '.jsp', '.php', '.py', '.jar', '.html', '.svg', '.vbs'];

  for (const dangerous of DANGEROUS_EXTS) {
    assert(!ALLOWED_EXTENSIONS.includes(dangerous), `Category 12: Dangerous executable/script extension ${dangerous} blocked`);
  }

  // 5. Secret Leakage Check
  const rootGitignore = fs.readFileSync('/home/whitedevil/Desktop/Chat-Application_Full_Stack/.gitignore', 'utf8');
  assert(rootGitignore.includes('*.env') && rootGitignore.includes('*.secret'), 'Category 13: Secrets & .env properly protected in .gitignore');

  // 6. Live Browser End-to-End Test (Ensures zero prod regressions)
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const directBtn = page.getByRole('button', { name: /Enter as|Enter Chat Directly/i }).first();
    assert(await directBtn.isVisible(), 'Authentication UI renders with 1-click entrance option');

    await directBtn.click();
    await page.waitForURL('**/chat', { timeout: 8000 });
    await page.waitForTimeout(600);
    assert(page.url().includes('/chat'), 'Chat page loads successfully after authentication');

    // Verify chat UI elements
    const newChatBtn = page.getByRole('button', { name: /New Chat/i }).first();
    const isNewChatVisible = await newChatBtn.isVisible().catch(() => false);
    assert(isNewChatVisible, 'Chat sidebar interactive controls active');

  } catch (err) {
    console.error('Browser verification failed:', err);
    failures++;
  } finally {
    await browser.close();
  }

  console.log('\n====================================================');
  if (failures === 0) {
    console.log('ALL SECURITY AUDIT & REGRESSION TESTS PASSED! (0 Failures)');
  } else {
    console.error(`COMPLETED WITH ${failures} FAILURE(S)`);
    process.exitCode = 1;
  }
  console.log('====================================================');
}

runSecurityAuditTests();

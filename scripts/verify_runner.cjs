const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));

  console.log('Navigating to http://localhost:5804/...');
  await page.goto('http://localhost:5804/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const titlePath = path.resolve('e:/solarena/runner_title_clean.png');
  await page.screenshot({ path: titlePath });
  console.log('Saved title screenshot to:', titlePath);

  // Click start run or press Enter
  console.log('Starting run...');
  const startBtn = page.locator('text=START RUN');
  if (await startBtn.isVisible()) {
    await startBtn.click();
  } else {
    await page.keyboard.press('Enter');
  }

  await page.waitForTimeout(1500);
  const play2dPath = path.resolve('e:/solarena/runner_gameplay_2d.png');
  await page.screenshot({ path: play2dPath });
  console.log('Saved 2D gameplay screenshot to:', play2dPath);

  // Jump in 2D to verify jumping leg pose!
  console.log('Jumping in 2D...');
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(220);
  const jump2dPath = path.resolve('e:/solarena/runner_jump_2d.png');
  await page.screenshot({ path: jump2dPath });
  console.log('Saved 2D jump screenshot to:', jump2dPath);

  await page.waitForTimeout(600);

  // Press SPACE to shift to 3D mode
  console.log('Pressing Space for 3D Dimension Shift...');
  await page.keyboard.press('Space');
  await page.waitForTimeout(800);

  const play3dPath = path.resolve('e:/solarena/runner_gameplay_3d.png');
  await page.screenshot({ path: play3dPath });
  console.log('Saved 3D dimension shift screenshot to:', play3dPath);

  // Check logs for any "poki"
  const pokiLogs = logs.filter(l => /poki/i.test(l));
  console.log('Poki logs count:', pokiLogs.length);
  if (pokiLogs.length > 0) {
    console.warn('Found poki logs:', pokiLogs);
  }

  await browser.close();
  console.log('Verification finished successfully.');
})();

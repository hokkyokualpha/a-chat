const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Accessing https://a-chat-uo57ppsmja-an.a.run.app...');
    await page.goto('https://a-chat-uo57ppsmja-an.a.run.app', { waitUntil: 'networkidle' });
    
    // エラーメッセージを確認
    const errorText = await page.textContent('body').catch(() => '');
    console.log('Page content:', errorText.substring(0, 500));
    
    // エラーバナーを確認
    const errorBanner = await page.locator('[class*="error"]').first().textContent().catch(() => null);
    if (errorBanner) {
      console.log('Error banner found:', errorBanner);
    }
    
    // ネットワークリクエストを監視
    page.on('response', response => {
      if (response.url().includes('/api/sessions')) {
        console.log(`Session API response: ${response.status()} ${response.statusText()}`);
        response.text().then(text => {
          console.log('Response body:', text);
        }).catch(() => {});
      }
    });
    
    // ページを再読み込みしてセッション作成を試行
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // コンソールエラーを確認
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    if (errors.length > 0) {
      console.log('Console errors:', errors);
    }
    
    // スクリーンショットを保存
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('Screenshot saved to error-screenshot.png');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();


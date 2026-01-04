const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Accessing https://a-chat-173601101972.asia-northeast1.run.app...');
    await page.goto('https://a-chat-173601101972.asia-northeast1.run.app', { waitUntil: 'networkidle', timeout: 30000 });
    
    // セッション作成を待つ
    await page.waitForTimeout(3000);
    
    // エラーバナーを確認
    const errorBanner = await page.locator('[class*="error"]').first().textContent().catch(() => null);
    if (errorBanner) {
      console.log('Initial error banner:', errorBanner);
    }
    
    // ネットワークリクエストを監視
    const apiResponses = [];
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/')) {
        apiResponses.push({
          url,
          status: response.status(),
          statusText: response.statusText()
        });
        if (response.status() !== 200 && response.status() !== 201) {
          response.text().then(text => {
            console.log(`API Error [${response.status()}]: ${url}`);
            console.log('Response body:', text.substring(0, 500));
          }).catch(() => {});
        }
      }
    });
    
    // コンソールエラーを確認
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log('Console error:', msg.text());
      }
    });
    
    // メッセージ入力欄を探す
    const inputSelector = 'input[type="text"], textarea, [contenteditable="true"], [placeholder*="メッセージ"]';
    const input = await page.locator(inputSelector).first();
    
    if (await input.count() === 0) {
      console.log('Input field not found. Available elements:');
      const bodyText = await page.textContent('body');
      console.log('Body text:', bodyText.substring(0, 500));
      await page.screenshot({ path: 'chat-error-1.png' });
    } else {
      console.log('Input field found, typing message...');
      await input.fill('Hello, this is a test message');
      await page.waitForTimeout(1000);
      
      // 送信ボタンを探してクリック
      const sendButton = await page.locator('button[type="submit"], button:has-text("送信"), [aria-label*="送信"]').first();
      if (await sendButton.count() > 0) {
        await sendButton.click();
      } else {
        // Enterキーで送信を試みる
        await input.press('Enter');
      }
      
      console.log('Message sent, waiting for response...');
      await page.waitForTimeout(5000);
      
      // エラーバナーを再確認
      const errorAfterSend = await page.locator('[class*="error"]').first().textContent().catch(() => null);
      if (errorAfterSend) {
        console.log('Error after sending message:', errorAfterSend);
      }
      
      // メッセージリストを確認
      const messages = await page.locator('[class*="message"], [class*="Message"]').all();
      console.log('Messages found:', messages.length);
      
      await page.screenshot({ path: 'chat-error-2.png' });
    }
    
    // APIレスポンスのサマリー
    console.log('\nAPI Responses:');
    apiResponses.forEach(r => {
      console.log(`  ${r.status} ${r.statusText}: ${r.url}`);
    });
    
    if (errors.length > 0) {
      console.log('\nConsole Errors:', errors);
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'chat-error-exception.png' });
  } finally {
    await browser.close();
  }
})();


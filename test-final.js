const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  let testPassed = true;
  const errors = [];
  
  try {
    console.log('=== Final Chat Test ===');
    console.log('1. Accessing application...');
    await page.goto('https://a-chat-173601101972.asia-northeast1.run.app', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Check for initial error
    const initialError = await page.locator('[class*="error"]').first().textContent().catch(() => null);
    if (initialError && initialError.includes('セッション')) {
      errors.push('Initial session error: ' + initialError);
      testPassed = false;
    }
    
    console.log('2. Sending test message...');
    const input = await page.locator('input[type="text"], textarea, [placeholder*="メッセージ"]').first();
    if (await input.count() === 0) {
      errors.push('Input field not found');
      testPassed = false;
    } else {
      await input.fill('こんにちは、これはテストです');
      await page.waitForTimeout(1000);
      
      const sendButton = await page.locator('button[type="submit"], button:has-text("送信")').first();
      if (await sendButton.count() > 0) {
        await sendButton.click();
      } else {
        await input.press('Enter');
      }
      
      console.log('3. Waiting for AI response...');
      await page.waitForTimeout(10000);
      
      // Check for error after sending
      const errorAfterSend = await page.locator('[class*="error"]').first().textContent().catch(() => null);
      if (errorAfterSend) {
        errors.push('Error after sending: ' + errorAfterSend);
        testPassed = false;
      }
      
      // Check for assistant message
      const messages = await page.locator('[class*="message"], [class*="Message"]').all();
      const messageTexts = await Promise.all(messages.map(m => m.textContent().catch(() => '')));
      const hasAssistantResponse = messageTexts.some(text => 
        text && !text.includes('こんにちは、これはテストです') && text.length > 20
      );
      
      if (!hasAssistantResponse) {
        errors.push('No assistant response found');
        testPassed = false;
      }
      
      console.log('4. Messages found:', messages.length);
      console.log('5. Has assistant response:', hasAssistantResponse);
    }
    
    await page.screenshot({ path: 'final-test-result.png' });
    
    console.log('\n=== Test Results ===');
    if (testPassed && errors.length === 0) {
      console.log('✅ ALL TESTS PASSED');
      console.log('✅ No errors detected');
      console.log('✅ Chat functionality working correctly');
    } else {
      console.log('❌ TESTS FAILED');
      errors.forEach(e => console.log('  -', e));
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'final-test-error.png' });
    testPassed = false;
  } finally {
    await browser.close();
  }
  
  process.exit(testPassed ? 0 : 1);
})();


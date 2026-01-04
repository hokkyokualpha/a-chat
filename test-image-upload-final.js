const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('=== Image Upload Final Test ===');
    console.log('1. Accessing application...');
    await page.goto('https://a-chat-173601101972.asia-northeast1.run.app', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Check for file input
    console.log('2. Checking for file input...');
    const fileInput = await page.locator('input[type="file"]').first();
    const fileInputCount = await fileInput.count();
    console.log('   File input found:', fileInputCount > 0);
    
    if (fileInputCount === 0) {
      console.log('   ❌ Image upload feature is not available');
      await page.screenshot({ path: 'image-upload-final-test-failed.png', fullPage: true });
      return;
    }
    
    // Create a test image file
    console.log('3. Creating test image...');
    const testImagePath = path.join(__dirname, 'test-image.png');
    
    // Create a simple 1x1 PNG image (minimal valid PNG)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 image
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE,
      0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF,
      0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0x00, 0x00, 0x00,
      0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82  // IEND
    ]);
    
    fs.writeFileSync(testImagePath, pngBuffer);
    console.log('   Test image created');
    
    // Upload the image
    console.log('4. Uploading image...');
    await fileInput.setInputFiles(testImagePath);
    await page.waitForTimeout(2000);
    
    // Check if image preview is shown
    const imagePreview = await page.locator('[class*="preview"], [class*="image"]').first();
    const hasPreview = await imagePreview.count() > 0;
    console.log('   Image preview shown:', hasPreview);
    
    // Check for upload button icon
    const uploadButton = await page.locator('label[for="image-upload"], [class*="upload"]').first();
    const uploadButtonCount = await uploadButton.count();
    console.log('   Upload button found:', uploadButtonCount > 0);
    
    // Take screenshot
    await page.screenshot({ path: 'image-upload-final-test.png', fullPage: true });
    console.log('   Screenshot saved');
    
    // Try to send a message with image
    console.log('5. Testing message send with image...');
    const textarea = await page.locator('textarea').first();
    if (await textarea.count() > 0) {
      await textarea.fill('この画像について説明してください');
      await page.waitForTimeout(1000);
      
      const sendButton = await page.locator('button[type="submit"]').first();
      if (await sendButton.count() > 0) {
        await sendButton.click();
        console.log('   Message sent');
        
        // Wait for response
        await page.waitForTimeout(10000);
        
        // Check for error
        const errorBanner = await page.locator('[class*="error"]').first().textContent().catch(() => null);
        if (errorBanner) {
          console.log('   ❌ Error:', errorBanner);
        } else {
          console.log('   ✅ No errors detected');
        }
        
        // Check for assistant message
        const messages = await page.locator('[class*="message"]').all();
        console.log('   Total messages:', messages.length);
        
        await page.screenshot({ path: 'image-upload-final-test-after-send.png', fullPage: true });
      }
    }
    
    // Clean up
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    
    console.log('\n✅ Test completed');
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'image-upload-final-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();


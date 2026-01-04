const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('=== Image Upload Test ===');
    console.log('1. Accessing application...');
    await page.goto('https://a-chat-173601101972.asia-northeast1.run.app', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Check for file input
    const fileInput = await page.locator('input[type="file"]').first();
    const fileInputCount = await fileInput.count();
    
    console.log('2. Checking for file input...');
    console.log('   File input found:', fileInputCount > 0);
    
    if (fileInputCount === 0) {
      console.log('   ❌ Image upload feature is not implemented');
      console.log('   Looking for upload button or icon...');
      
      // Check for upload button
      const uploadButton = await page.locator('button:has-text("画像"), button:has-text("upload"), button:has-text("添付"), [aria-label*="画像"], [aria-label*="upload"]').first();
      const uploadButtonCount = await uploadButton.count();
      console.log('   Upload button found:', uploadButtonCount > 0);
      
      // Take screenshot
      await page.screenshot({ path: 'image-upload-test.png', fullPage: true });
      console.log('   Screenshot saved to image-upload-test.png');
    } else {
      console.log('3. Testing image upload...');
      
      // Create a test image file
      const fs = require('fs');
      const path = require('path');
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
      await fileInput.setInputFiles(testImagePath);
      console.log('   Image file selected');
      
      await page.waitForTimeout(2000);
      
      // Check if image is displayed or uploaded
      const imagePreview = await page.locator('img[src*="blob"], img[src*="data:"], [class*="preview"], [class*="image"]').first();
      const hasPreview = await imagePreview.count() > 0;
      console.log('   Image preview shown:', hasPreview);
      
      // Clean up
      fs.unlinkSync(testImagePath);
    }
    
    // Check page structure
    const pageText = await page.textContent('body');
    console.log('\n4. Page structure check:');
    console.log('   Page loaded:', pageText ? 'Yes' : 'No');
    
    await page.screenshot({ path: 'image-upload-test-result.png', fullPage: true });
    console.log('\n✅ Test completed');
    console.log('   Screenshot saved to image-upload-test-result.png');
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'image-upload-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();


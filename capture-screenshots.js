import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const APP_URL = 'http://localhost:5174';
const OUTPUT_DIR = join(__dirname, 'public', 'screenshots');

// Screenshot configurations
const screenshots = [
  // Mobile screenshots (narrow form factor)
  {
    name: 'mobile-dashboard',
    path: '/',
    viewport: { width: 375, height: 667 },
    formFactor: 'narrow',
    label: 'Student Dashboard - Interactive English Learning'
  },
  {
    name: 'mobile-courses',
    path: '/',
    viewport: { width: 414, height: 896 },
    formFactor: 'narrow',
    label: 'Browse English Courses',
    waitFor: 1000
  },
  {
    name: 'mobile-gamification',
    path: '/',
    viewport: { width: 375, height: 667 },
    formFactor: 'narrow',
    label: 'Achievements and Progress Tracking'
  },
  
  // Tablet screenshots
  {
    name: 'tablet-dashboard',
    path: '/',
    viewport: { width: 768, height: 1024 },
    formFactor: 'wide',
    label: 'Learning Platform - Tablet View'
  },
  
  // Desktop screenshots (wide form factor)
  {
    name: 'desktop-dashboard',
    path: '/',
    viewport: { width: 1280, height: 720 },
    formFactor: 'wide',
    label: 'Complete Learning Management System'
  },
  {
    name: 'desktop-full',
    path: '/',
    viewport: { width: 1920, height: 1080 },
    formFactor: 'wide',
    label: 'Full Desktop Experience'
  }
];

async function captureScreenshots() {
  console.log('📸 Starting screenshot capture...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (const config of screenshots) {
      console.log(`📷 Capturing: ${config.name} (${config.viewport.width}x${config.viewport.height})`);
      
      const page = await browser.newPage();
      await page.setViewport({
        width: config.viewport.width,
        height: config.viewport.height,
        deviceScaleFactor: 2 // High DPI for better quality
      });

      try {
        await page.goto(`${APP_URL}${config.path}`, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });

        // Wait for additional time if specified
        if (config.waitFor) {
          await new Promise(resolve => setTimeout(resolve, config.waitFor));
        } else {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Take screenshot
        const outputPath = join(OUTPUT_DIR, `${config.name}.png`);
        await page.screenshot({
          path: outputPath,
          fullPage: false
        });

        console.log(`✅ Saved: ${config.name}.png`);
      } catch (error) {
        console.error(`❌ Error capturing ${config.name}:`, error.message);
      } finally {
        await page.close();
      }
    }

    console.log('\n✨ Screenshot capture complete!');
    console.log(`📁 Screenshots saved to: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await browser.close();
  }
}

// Check if dev server is running
console.log(`🌐 Connecting to: ${APP_URL}`);
console.log('⚠️  Make sure the dev server is running (npm run dev)\n');

captureScreenshots().catch(console.error);

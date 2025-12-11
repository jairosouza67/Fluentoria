import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [192, 512];
const inputFile = join(__dirname, 'public', 'logo.png');
const outputDir = join(__dirname, 'public');

async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  for (const size of sizes) {
    const outputFile = join(outputDir, `icon-${size}x${size}.png`);
    
    try {
      await sharp(inputFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputFile);
      
      console.log(`✅ Created: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Error creating icon-${size}x${size}.png:`, error.message);
    }
  }

  console.log('\n✨ Icon generation complete!');
}

generateIcons();

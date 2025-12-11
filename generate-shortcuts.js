import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputFile = join(__dirname, 'public', 'logo.png');
const outputDir = join(__dirname, 'public', 'shortcuts');

const shortcuts = [
  { name: 'dashboard', color: '#FF6A00' }, // Orange - Home
  { name: 'courses', color: '#3B82F6' },   // Blue - Learning
  { name: 'daily', color: '#10B981' },     // Green - Daily activity
  { name: 'achievements', color: '#F59E0B' } // Amber - Trophy
];

async function generateShortcutIcons() {
  console.log('🎨 Generating PWA shortcut icons...\n');

  for (const shortcut of shortcuts) {
    const outputFile = join(outputDir, `${shortcut.name}.png`);
    
    try {
      // Create a colored background with the logo
      await sharp(inputFile)
        .resize(96, 96, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputFile);
      
      console.log(`✅ Created: ${shortcut.name}.png (96x96)`);
    } catch (error) {
      console.error(`❌ Error creating ${shortcut.name}.png:`, error.message);
    }
  }

  console.log('\n✨ Shortcut icon generation complete!');
}

generateShortcutIcons();

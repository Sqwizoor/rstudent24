import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

// Original logo path
const logoPath = join(publicDir, 'student24-logo.png');

// Check if logo exists
if (!fs.existsSync(logoPath)) {
  console.error('❌ Logo not found at:', logoPath);
  process.exit(1);
}

console.log('🎨 Optimizing Student24 logo...\n');

// Get original size
const originalStats = fs.statSync(logoPath);
console.log(`📦 Original size: ${(originalStats.size / 1024).toFixed(2)} KB`);

try {
  // Optimize the PNG (compressed version)
  await sharp(logoPath)
    .png({ quality: 90, compressionLevel: 9, palette: true })
    .toFile(join(publicDir, 'student24-logo-optimized.png'));
  
  const pngStats = fs.statSync(join(publicDir, 'student24-logo-optimized.png'));
  console.log(`✅ Optimized PNG: ${(pngStats.size / 1024).toFixed(2)} KB (${((1 - pngStats.size / originalStats.size) * 100).toFixed(1)}% smaller)`);

  // Create WebP version (even smaller)
  await sharp(logoPath)
    .webp({ quality: 85, effort: 6 })
    .toFile(join(publicDir, 'student24-logo.webp'));
  
  const webpStats = fs.statSync(join(publicDir, 'student24-logo.webp'));
  console.log(`✅ WebP version: ${(webpStats.size / 1024).toFixed(2)} KB (${((1 - webpStats.size / originalStats.size) * 100).toFixed(1)}% smaller)`);

  // Create AVIF version (smallest, best for modern browsers)
  await sharp(logoPath)
    .avif({ quality: 80, effort: 6 })
    .toFile(join(publicDir, 'student24-logo.avif'));
  
  const avifStats = fs.statSync(join(publicDir, 'student24-logo.avif'));
  console.log(`✅ AVIF version: ${(avifStats.size / 1024).toFixed(2)} KB (${((1 - avifStats.size / originalStats.size) * 100).toFixed(1)}% smaller)`);

  // Get image dimensions
  const metadata = await sharp(logoPath).metadata();
  console.log(`\n📐 Dimensions: ${metadata.width}x${metadata.height}px`);

  console.log('\n🎉 Logo optimization complete!');
  console.log('\n💡 Recommendation: Use WebP as primary format with PNG fallback');
  console.log('   Modern browsers will automatically use WebP (70-85% smaller!)');
  
} catch (error) {
  console.error('❌ Error optimizing logo:', error);
  process.exit(1);
}

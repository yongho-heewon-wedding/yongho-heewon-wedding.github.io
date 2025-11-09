const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration
const QUALITY = 92; // High quality: 90-95% recommended for wedding photos
const GALLERY_DIR = './pictures/gallery';
const HEADER_DIR = './pictures/header';
const BACKUP_GALLERY = './pictures/gallery_original';
const BACKUP_HEADER = './pictures/header_original';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m'
};

async function optimizeImage(inputPath, outputPath, quality = QUALITY) {
  try {
    const stats = fs.statSync(inputPath);
    const originalSize = stats.size;

    const ext = path.extname(inputPath).toLowerCase();
    const baseName = path.basename(inputPath, ext);
    const outputDir = path.dirname(outputPath);
    const webpPath = path.join(outputDir, `${baseName}.webp`);

    // Convert to WebP
    await sharp(inputPath)
      .webp({ quality: quality, effort: 6 })
      .toFile(webpPath);

    const webpStats = fs.statSync(webpPath);
    const webpSize = webpStats.size;
    const savings = ((originalSize - webpSize) / originalSize * 100).toFixed(1);

    console.log(`${colors.green}✓${colors.reset} ${path.basename(inputPath)}`);
    console.log(`  ${formatBytes(originalSize)} → ${formatBytes(webpSize)} (${colors.yellow}-${savings}%${colors.reset})`);

    return {
      original: originalSize,
      webp: webpSize,
      savings: parseFloat(savings)
    };
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Error processing ${inputPath}:`, error.message);
    throw error;
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function backupAndOptimize(sourceDir, backupDir, testMode = false) {
  if (!fs.existsSync(sourceDir)) {
    console.log(`${colors.yellow}Warning:${colors.reset} ${sourceDir} does not exist`);
    return { totalOriginal: 0, totalWebP: 0, count: 0 };
  }

  const files = fs.readdirSync(sourceDir)
    .filter(f => /\.(jpg|jpeg|png)$/i.test(f))
    .sort();

  if (files.length === 0) {
    console.log(`${colors.yellow}No images found in ${sourceDir}${colors.reset}`);
    return { totalOriginal: 0, totalWebP: 0, count: 0 };
  }

  // In test mode, only process first 2 images
  const filesToProcess = testMode ? files.slice(0, 2) : files;

  let totalOriginal = 0;
  let totalWebP = 0;

  for (const file of filesToProcess) {
    const sourcePath = path.join(sourceDir, file);
    const backupPath = path.join(backupDir, file);

    // Backup original if not already backed up
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(sourcePath, backupPath);
      if (!testMode) {
        console.log(`${colors.blue}Backed up:${colors.reset} ${file}`);
      }
    }

    // Optimize and convert to WebP
    const result = await optimizeImage(sourcePath, sourcePath, QUALITY);
    totalOriginal += result.original;
    totalWebP += result.webp;
  }

  return {
    totalOriginal,
    totalWebP,
    count: filesToProcess.length
  };
}

async function main() {
  const args = process.argv.slice(2);
  const testMode = args.includes('--test');

  console.log(`\n${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.blue}  Wedding Photo Optimization${colors.reset}`);
  console.log(`${colors.blue}  Quality: ${QUALITY}% (High Quality)${colors.reset}`);
  if (testMode) {
    console.log(`${colors.yellow}  TEST MODE: Only first 2 images${colors.reset}`);
  }
  console.log(`${colors.blue}========================================${colors.reset}\n`);

  let grandTotalOriginal = 0;
  let grandTotalWebP = 0;
  let grandTotalCount = 0;

  // Process gallery images
  console.log(`${colors.blue}Processing Gallery Images...${colors.reset}`);
  const galleryResults = await backupAndOptimize(GALLERY_DIR, BACKUP_GALLERY, testMode);
  grandTotalOriginal += galleryResults.totalOriginal;
  grandTotalWebP += galleryResults.totalWebP;
  grandTotalCount += galleryResults.count;

  console.log();

  // Process header image
  console.log(`${colors.blue}Processing Header Image...${colors.reset}`);
  const headerResults = await backupAndOptimize(HEADER_DIR, BACKUP_HEADER, testMode);
  grandTotalOriginal += headerResults.totalOriginal;
  grandTotalWebP += headerResults.totalWebP;
  grandTotalCount += headerResults.count;

  // Summary
  const totalSavings = ((grandTotalOriginal - grandTotalWebP) / grandTotalOriginal * 100).toFixed(1);

  console.log(`\n${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.green}Summary${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}`);
  console.log(`Images processed: ${colors.yellow}${grandTotalCount}${colors.reset}`);
  console.log(`Original size:    ${colors.yellow}${formatBytes(grandTotalOriginal)}${colors.reset}`);
  console.log(`WebP size:        ${colors.green}${formatBytes(grandTotalWebP)}${colors.reset}`);
  console.log(`Total savings:    ${colors.green}-${totalSavings}% (${formatBytes(grandTotalOriginal - grandTotalWebP)})${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}\n`);

  if (testMode) {
    console.log(`${colors.yellow}This was a TEST run. Check the images and run without --test to optimize all images.${colors.reset}\n`);
  } else {
    console.log(`${colors.green}✓ All images optimized successfully!${colors.reset}`);
    console.log(`${colors.blue}Original images backed up to:${colors.reset}`);
    console.log(`  - ${BACKUP_GALLERY}`);
    console.log(`  - ${BACKUP_HEADER}\n`);
  }
}

main().catch(error => {
  console.error(`${colors.red}Error:${colors.reset}`, error);
  process.exit(1);
});

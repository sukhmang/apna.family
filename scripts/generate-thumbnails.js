#!/usr/bin/env node

/**
 * Thumbnail Generation Script
 * 
 * Generates thumbnails for all images in public/images/ folder
 * and saves them to public/images/thumbnails/
 * 
 * Requirements: npm install sharp
 * 
 * Usage: npm run generate-thumbnails
 *    or: node scripts/generate-thumbnails.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const THUMBNAILS_DIR = path.join(IMAGES_DIR, 'thumbnails');

// Supported image extensions (videos don't need thumbnails - they play directly)
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

// Thumbnail dimensions
const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_QUALITY = 80;

async function generateThumbnails() {
  try {
    // Check if images directory exists
    if (!fs.existsSync(IMAGES_DIR)) {
      console.error(`❌ Error: Images directory not found at ${IMAGES_DIR}`);
      process.exit(1);
    }

    // Create thumbnails directory if it doesn't exist
    if (!fs.existsSync(THUMBNAILS_DIR)) {
      fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
      console.log(`📁 Created thumbnails directory: ${THUMBNAILS_DIR}`);
    }

    // Try to import sharp
    let sharp;
    try {
      sharp = (await import('sharp')).default;
    } catch (error) {
      console.error('❌ Error: sharp is not installed.');
      console.error('   Please install it by running: npm install sharp');
      console.error('   Or: npm install --save-dev sharp');
      process.exit(1);
    }

    // Read all files in the images directory
    const files = fs.readdirSync(IMAGES_DIR);

    // Filter for image files only (exclude videos, JSON, README, etc.)
    const imageFiles = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return IMAGE_EXTENSIONS.includes(ext);
      })
      .filter(file => {
        // Skip files that are already in thumbnails folder
        return !file.startsWith('thumbnails');
      });

    // Step 1: Remove thumbnails for images that no longer exist
    let removedCount = 0;
    if (fs.existsSync(THUMBNAILS_DIR)) {
      const thumbnailFiles = fs.readdirSync(THUMBNAILS_DIR);
      
      for (const thumbnailFile of thumbnailFiles) {
        // Thumbnails are saved as .jpg, but source images might have different extensions
        // Extract base name (without .jpg extension)
        const baseName = thumbnailFile.replace(/\.jpg$/i, '');
        
        // Check if any image file with this base name exists
        const matchingImage = imageFiles.find(imgFile => {
          const imgBaseName = imgFile.replace(/\.[^/.]+$/, '');
          return imgBaseName === baseName;
        });
        
        if (!matchingImage) {
          // No matching image found - delete the thumbnail
          const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailFile);
          try {
            fs.unlinkSync(thumbnailPath);
            removedCount++;
            console.log(`🗑️  Removed orphaned thumbnail: ${thumbnailFile}`);
          } catch (error) {
            console.error(`❌ Error removing thumbnail ${thumbnailFile}:`, error.message);
          }
        }
      }
      
      if (removedCount > 0) {
        console.log('');
      }
    }

    if (imageFiles.length === 0) {
      console.log('⚠️  No image files found in', IMAGES_DIR);
      console.log('   Supported formats:', IMAGE_EXTENSIONS.join(', '));
      if (removedCount > 0) {
        console.log(`\n📊 Summary:`);
        console.log(`   🗑️  Removed: ${removedCount} orphaned thumbnail(s)`);
      }
      return;
    }

    console.log(`🖼️  Found ${imageFiles.length} image file(s) to process...\n`);

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    // Step 2: Process each image (generate or skip)
    for (const file of imageFiles) {
      const inputPath = path.join(IMAGES_DIR, file);
      const baseName = file.replace(/\.[^/.]+$/, '');
      
      // Thumbnails are always saved as .jpg regardless of source format
      const thumbnailPath = path.join(THUMBNAILS_DIR, `${baseName}.jpg`);

      try {
        // Check if thumbnail already exists and is newer than source
        if (fs.existsSync(thumbnailPath)) {
          const inputStats = fs.statSync(inputPath);
          const outputStats = fs.statSync(thumbnailPath);
          
          if (outputStats.mtime >= inputStats.mtime) {
            console.log(`⏭️  Skipped (already exists): ${file}`);
            skipped++;
            continue;
          }
        }

        // Generate thumbnail - convert all to JPEG for consistency and smaller file size
        await sharp(inputPath)
          .resize(THUMBNAIL_WIDTH, null, {
            withoutEnlargement: true,
            fit: 'inside'
          })
          .jpeg({ quality: THUMBNAIL_QUALITY })
          .toFile(thumbnailPath);

        console.log(`✅ Generated: ${file} → thumbnails/${baseName}.jpg`);
        
        processed++;
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
        errors++;
      }
    }

    console.log(`\n📊 Summary:`);
    if (removedCount > 0) {
      console.log(`   🗑️  Removed: ${removedCount} orphaned thumbnail(s)`);
    }
    console.log(`   ✅ Processed: ${processed}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    if (errors > 0) {
      console.log(`   ❌ Errors: ${errors}`);
    }
    console.log(`\n💡 Tip: Thumbnails are saved in ${THUMBNAILS_DIR}`);
    console.log(`   The gallery will automatically use thumbnails in grid view.`);

  } catch (error) {
    console.error('❌ Error generating thumbnails:', error.message);
    process.exit(1);
  }
}

// Run the script
generateThumbnails();


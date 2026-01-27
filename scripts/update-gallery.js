#!/usr/bin/env node

/**
 * Gallery Image Updater Script
 * 
 * Scans the public/images/ folder and automatically updates images.json
 * with all image files found.
 * 
 * Usage: npm run update-gallery
 *    or: node scripts/update-gallery.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const IMAGES_JSON = path.join(IMAGES_DIR, 'images.json');

// Supported image and video extensions
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'];
const ALL_EXTENSIONS = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS];

function updateGalleryImages() {
  try {
    // Check if images directory exists
    if (!fs.existsSync(IMAGES_DIR)) {
      console.error(`❌ Error: Images directory not found at ${IMAGES_DIR}`);
      process.exit(1);
    }

    // Read all files in the images directory
    const files = fs.readdirSync(IMAGES_DIR);

    // Filter for image and video files only (exclude JSON, README, and other non-media files)
    const mediaFiles = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ALL_EXTENSIONS.includes(ext);
      })
      .sort(); // Sort alphabetically for consistent ordering

    if (mediaFiles.length === 0) {
      console.log('⚠️  No media files found in', IMAGES_DIR);
      console.log('   Supported formats:', ALL_EXTENSIONS.join(', '));
      
      // Create empty array if no images
      const emptyJson = JSON.stringify([], null, 2);
      fs.writeFileSync(IMAGES_JSON, emptyJson + '\n');
      console.log('✅ Created empty images.json');
      return;
    }

    // Create JSON array
    const jsonContent = JSON.stringify(mediaFiles, null, 2);

    // Write to images.json
    fs.writeFileSync(IMAGES_JSON, jsonContent + '\n');

    // Report results
    console.log('✅ Successfully updated images.json');
    console.log(`   Found ${mediaFiles.length} media file(s):`);
    
    const imageCount = mediaFiles.filter(f => IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase())).length;
    const videoCount = mediaFiles.filter(f => VIDEO_EXTENSIONS.includes(path.extname(f).toLowerCase())).length;
    
    console.log(`   - ${imageCount} image(s)`);
    console.log(`   - ${videoCount} video(s)`);
    
    mediaFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });

    // Show file size info
    const stats = fs.statSync(IMAGES_JSON);
    console.log(`\n   File size: ${(stats.size / 1024).toFixed(2)} KB`);

  } catch (error) {
    console.error('❌ Error updating gallery images:', error.message);
    process.exit(1);
  }
}

// Run the script
updateGalleryImages();

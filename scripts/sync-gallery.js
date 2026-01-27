#!/usr/bin/env node

/**
 * Master Gallery Sync Script
 * 
 * One-stop script to sync the entire gallery system when files are added/removed.
 * This script runs all necessary operations:
 * 1. Updates gallery.csv (adds new files from local folder AND Cloudinary, removes deleted files)
 * 2. Generates thumbnails for new local images (Cloudinary videos don't need thumbnails)
 * 3. Syncs images.json from gallery.csv (preserves sort order)
 * 
 * Supports:
 * - Local images/videos in public/images/{family}/
 * - Cloudinary videos (fetched via API)
 * 
 * Usage: npm run sync-gallery --family=grewal
 *    or: node scripts/sync-gallery.js --family=grewal
 *    or: node scripts/sync-gallery.js (defaults to 'grewal')
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

// Parse command line arguments for --family parameter
const args = process.argv.slice(2);
const familyArg = args.find(arg => arg.startsWith('--family='));
const familyId = familyArg ? familyArg.split('=')[1] : 'grewal'; // Default to 'grewal'

console.log(`🔄 Starting gallery sync for family: ${familyId}\n`);

try {
  // Step 1: Update gallery.csv
  console.log('📝 Step 1: Syncing gallery.csv with files...');
  console.log('─'.repeat(50));
  try {
    execSync(`node scripts/update-gallery-csv.js --family=${familyId}`, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit'
    });
    console.log('');
  } catch (error) {
    console.error('❌ Error updating gallery.csv:', error.message);
    process.exit(1);
  }

  // Step 2: Generate thumbnails
  console.log('🖼️  Step 2: Generating thumbnails...');
  console.log('─'.repeat(50));
  try {
    execSync(`node scripts/generate-thumbnails.js --family=${familyId}`, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit'
    });
    console.log('');
  } catch (error) {
    // Check if it's just a missing sharp error
    if (error.message.includes('sharp') || error.stderr?.toString().includes('sharp')) {
      console.error('⚠️  Warning: sharp is not installed. Skipping thumbnail generation.');
      console.error('   Install it with: npm install sharp');
      console.error(`   Then run: node scripts/generate-thumbnails.js --family=${familyId}\n`);
    } else {
      console.error('❌ Error generating thumbnails:', error.message);
      // Don't exit - continue with images.json sync
    }
  }

  // Step 3: Sync images.json from gallery.csv
  console.log('📋 Step 3: Syncing images.json from gallery.csv...');
  console.log('─'.repeat(50));
  try {
    execSync(`node scripts/sync-images-json-from-csv.js --family=${familyId}`, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit'
    });
    console.log('');
  } catch (error) {
    console.error('❌ Error syncing images.json:', error.message);
    process.exit(1);
  }

  console.log('✅ Gallery sync complete!');
  console.log('\n📊 Summary:');
  console.log('   ✅ gallery.csv updated');
  console.log('   ✅ Thumbnails generated (if sharp is installed)');
  console.log('   ✅ images.json synced from gallery.csv');
  console.log('\n💡 Your gallery is now fully synced and ready!');

} catch (error) {
  console.error('❌ Fatal error during gallery sync:', error.message);
  process.exit(1);
}


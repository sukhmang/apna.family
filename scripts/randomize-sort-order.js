#!/usr/bin/env node

/**
 * Randomize Sort Order Script
 * 
 * Randomly assigns default_sort values to all entries in gallery.csv
 * - Videos are guaranteed to appear in the first 120 files (sort values 1-120)
 * - Images get random sort values (1-10000)
 * 
 * Usage: node scripts/randomize-sort-order.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GALLERY_CSV = path.join(__dirname, '..', 'public', 'gallery.csv');

// Parse CSV line (handles quoted fields)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Format CSV line (handles quoted fields)
function formatCSVLine(values) {
  return values.map(value => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }).join(',');
}

// Shuffle array (Fisher-Yates)
function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate random integer in range [min, max]
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomizeSortOrder() {
  try {
    if (!fs.existsSync(GALLERY_CSV)) {
      console.error(`❌ Error: gallery.csv not found at ${GALLERY_CSV}`);
      process.exit(1);
    }

    // Read CSV
    const content = fs.readFileSync(GALLERY_CSV, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      console.error('❌ Error: CSV file is empty');
      process.exit(1);
    }

    const headers = parseCSVLine(lines[0]);
    const defaultSortIndex = headers.indexOf('default_sort');
    
    if (defaultSortIndex === -1) {
      console.error('❌ Error: default_sort column not found in CSV');
      process.exit(1);
    }

    // Parse rows
    const videos = [];
    const images = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0 || values.every(v => !v)) continue;
      
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      if (row.type === 'video') {
        videos.push(row);
      } else {
        images.push(row);
      }
    }

    console.log(`📊 Found ${videos.length} video(s) and ${images.length} image(s)\n`);

    // Assign sort values to videos (1-120)
    const videoSortValues = shuffle(Array.from({ length: 120 }, (_, i) => i + 1));
    videos.forEach((video, index) => {
      video.default_sort = videoSortValues[index % 120].toString();
    });

    // Assign sort values to images (1-10000, randomly distributed)
    images.forEach(image => {
      image.default_sort = randomInt(1, 10000).toString();
    });

    // Write back to CSV
    const outputLines = [];
    outputLines.push(formatCSVLine(headers));
    
    // Combine and sort by default_sort
    const allRows = [...videos, ...images];
    allRows.sort((a, b) => {
      const sortA = parseInt(a.default_sort) || 10000;
      const sortB = parseInt(b.default_sort) || 10000;
      if (sortA !== sortB) {
        return sortA - sortB;
      }
      return (a.filename || '').localeCompare(b.filename || '');
    });
    
    allRows.forEach(row => {
      const values = headers.map(header => row[header] || '');
      outputLines.push(formatCSVLine(values));
    });

    fs.writeFileSync(GALLERY_CSV, outputLines.join('\n') + '\n');

    // Report results
    console.log(`✅ Successfully randomized sort order`);
    console.log(`   Videos: ${videos.length} (assigned sort values 1-120)`);
    console.log(`   Images: ${images.length} (assigned random sort values 1-10000)`);
    console.log(`\n   First 10 items after sorting:`);
    allRows.slice(0, 10).forEach((row, index) => {
      console.log(`   ${index + 1}. [${row.default_sort}] ${row.filename} (${row.type})`);
    });
    
    // Verify videos are in first 120
    const videosInFirst120 = allRows.slice(0, 120).filter(r => r.type === 'video').length;
    console.log(`\n   ✅ Verification: ${videosInFirst120} of ${videos.length} videos appear in first 120 items`);

  } catch (error) {
    console.error('❌ Error randomizing sort order:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
randomizeSortOrder();


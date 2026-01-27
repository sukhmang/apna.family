#!/usr/bin/env node

/**
 * Sync images.json from gallery.csv
 * 
 * Updates images.json to match the files and order from gallery.csv
 * Files are ordered by default_sort value (ascending)
 * 
 * Usage: node scripts/sync-images-json-from-csv.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GALLERY_CSV = path.join(__dirname, '..', 'public', 'gallery.csv');
const IMAGES_JSON = path.join(__dirname, '..', 'public', 'images', 'images.json');

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

function syncImagesJsonFromCSV() {
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
    const filenameIndex = headers.indexOf('filename');
    const defaultSortIndex = headers.indexOf('default_sort');
    
    if (filenameIndex === -1) {
      console.error('❌ Error: filename column not found in CSV');
      process.exit(1);
    }

    // Parse rows and extract filenames
    const entries = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0 || values.every(v => !v)) continue;
      
      const filename = values[filenameIndex]?.trim();
      const defaultSort = values[defaultSortIndex]?.trim() || '10000';
      
      if (filename) {
        entries.push({
          filename,
          sort: parseInt(defaultSort) || 10000
        });
      }
    }

    // Sort by default_sort, then by filename
    entries.sort((a, b) => {
      if (a.sort !== b.sort) {
        return a.sort - b.sort;
      }
      return a.filename.localeCompare(b.filename);
    });

    // Extract just the filenames in order
    const filenames = entries.map(entry => entry.filename);

    // Write to images.json
    const jsonContent = JSON.stringify(filenames, null, 2);
    fs.writeFileSync(IMAGES_JSON, jsonContent + '\n');

    // Report results
    console.log(`✅ Successfully synced images.json from gallery.csv`);
    console.log(`   Total files: ${filenames.length}`);
    console.log(`   Files are ordered by default_sort value\n`);
    
    console.log(`   First 10 files:`);
    filenames.slice(0, 10).forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
    
    if (filenames.length > 10) {
      console.log(`   ... and ${filenames.length - 10} more`);
    }

  } catch (error) {
    console.error('❌ Error syncing images.json:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
syncImagesJsonFromCSV();


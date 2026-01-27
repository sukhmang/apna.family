#!/usr/bin/env node

/**
 * Fetch Cloudinary Images Script
 * 
 * Queries Cloudinary account to get list of all image resources.
 * Returns an array of image URLs that can be used in gallery.csv and images.json
 * 
 * Usage: node scripts/fetch-cloudinary-images.js
 */

import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryConfig, validateCloudinaryConfig } from './cloudinary-config.js';

// Configure Cloudinary
cloudinary.config(cloudinaryConfig);

/**
 * Fetch all images from Cloudinary
 * @returns {Promise<Array<{url: string, publicId: string, filename: string}>>}
 */
export async function fetchCloudinaryImages() {
  if (!validateCloudinaryConfig()) {
    return [];
  }

  try {
    console.log('☁️  Fetching images from Cloudinary...');
    
    // Fetch all resources with resource_type 'image'
    const resources = [];
    let nextCursor = null;
    
    do {
      const result = await cloudinary.search
        .expression('resource_type:image')
        .max_results(500)
        .next_cursor(nextCursor)
        .execute();
      
      resources.push(...result.resources);
      nextCursor = result.next_cursor;
    } while (nextCursor);

    console.log(`   Found ${resources.length} image(s) in Cloudinary\n`);

    // Convert to gallery format
    const images = resources.map(resource => {
      // Get the full URL (secure HTTPS)
      const url = cloudinary.url(resource.public_id, {
        resource_type: 'image',
        secure: true,
      });

      // Extract filename from public_id
      const filename = resource.public_id.split('/').pop();

      return {
        url,
        publicId: resource.public_id,
        filename: filename || resource.public_id,
        format: resource.format || 'jpg',
        bytes: resource.bytes || 0,
      };
    });

    return images;
  } catch (error) {
    console.error('❌ Error fetching Cloudinary images:', error.message || error);
    if (error.http_code === 401) {
      console.error('   Authentication failed. Please check your Cloudinary credentials.');
    } else if (error.http_code) {
      console.error(`   HTTP Error ${error.http_code}: ${error.message || 'Unknown error'}`);
    } else {
      console.error('   Full error:', error);
    }
    return [];
  }
}

// If run directly, output JSON
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchCloudinaryImages()
    .then(images => {
      console.log(JSON.stringify(images.map(i => i.url), null, 2));
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}


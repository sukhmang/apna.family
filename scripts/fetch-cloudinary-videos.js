#!/usr/bin/env node

/**
 * Fetch Cloudinary Videos Script
 * 
 * Queries Cloudinary account to get list of all video resources.
 * Returns an array of video URLs that can be used in gallery.csv and images.json
 * 
 * Usage: node scripts/fetch-cloudinary-videos.js
 */

import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryConfig, validateCloudinaryConfig } from './cloudinary-config.js';

// Configure Cloudinary
cloudinary.config(cloudinaryConfig);

// Video extensions to look for
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];

/**
 * Fetch all videos from Cloudinary
 * @returns {Promise<Array<{url: string, publicId: string, filename: string}>>}
 */
export async function fetchCloudinaryVideos() {
  if (!validateCloudinaryConfig()) {
    return [];
  }

  try {
    console.log('☁️  Fetching videos from Cloudinary...');
    
    // Fetch all resources with resource_type 'video'
    const resources = [];
    let nextCursor = null;
    
    do {
      const result = await cloudinary.search
        .expression('resource_type:video')
        .max_results(500)
        .next_cursor(nextCursor)
        .execute();
      
      resources.push(...result.resources);
      nextCursor = result.next_cursor;
    } while (nextCursor);

    console.log(`   Found ${resources.length} video(s) in Cloudinary\n`);

    // Convert to gallery format
    const videos = resources.map(resource => {
      // Get the full URL (secure HTTPS)
      const url = cloudinary.url(resource.public_id, {
        resource_type: 'video',
        secure: true,
      });

      // Extract filename from public_id
      const filename = resource.public_id.split('/').pop();

      return {
        url,
        publicId: resource.public_id,
        filename: filename || resource.public_id,
        format: resource.format || 'mp4',
        bytes: resource.bytes || 0,
      };
    });

    return videos;
  } catch (error) {
    console.error('❌ Error fetching Cloudinary videos:', error.message || error);
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
  fetchCloudinaryVideos()
    .then(videos => {
      console.log(JSON.stringify(videos.map(v => v.url), null, 2));
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}


#!/usr/bin/env node

/**
 * Cloudinary Image Upload Script
 * 
 * Uploads all images from public/images/ to Cloudinary CDN
 * and generates a new images.json with CDN URLs.
 * 
 * Usage: 
 *   1. Set environment variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *   2. Or run: CLOUDINARY_CLOUD_NAME=xxx CLOUDINARY_API_KEY=xxx CLOUDINARY_API_SECRET=xxx node scripts/upload-to-cdn.js
 *   3. Or the script will prompt you for credentials
 */

import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images')
const IMAGES_JSON = path.join(IMAGES_DIR, 'images.json')
const IMAGES_JSON_BACKUP = path.join(IMAGES_DIR, 'images.json.backup')
const IMAGES_JSON_CDN = path.join(IMAGES_DIR, 'images.json.cdn')

// Supported image extensions
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']

// Create readline interface for prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function getCredentials() {
  // Try environment variables first
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME
  let apiKey = process.env.CLOUDINARY_API_KEY
  let apiSecret = process.env.CLOUDINARY_API_SECRET

  // If not in env, prompt user
  if (!cloudName || !apiKey || !apiSecret) {
    console.log('\n📋 Cloudinary Credentials Required')
    console.log('Get these from: https://cloudinary.com/console\n')
    
    if (!cloudName) {
      cloudName = await question('Enter Cloud Name: ')
    }
    if (!apiKey) {
      apiKey = await question('Enter API Key: ')
    }
    if (!apiSecret) {
      apiSecret = await question('Enter API Secret: ')
    }
  }

  return { cloudName, apiKey, apiSecret }
}

function uploadImage(cloudinary, filePath, filename) {
  return new Promise((resolve, reject) => {
    const publicId = `baljit-grewal-memorial/${filename.replace(/\.[^/.]+$/, '')}`
    
    cloudinary.uploader.upload(
      filePath,
      {
        public_id: publicId,
        folder: 'baljit-grewal-memorial',
        resource_type: 'auto', // Auto-detect image/video
        overwrite: false, // Don't overwrite existing
        use_filename: true,
        unique_filename: false
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result.secure_url) // Use HTTPS URL
        }
      }
    )
  })
}

async function uploadAllImages() {
  try {
    // Get credentials
    const { cloudName, apiKey, apiSecret } = await getCredentials()

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    })

    console.log('\n✅ Cloudinary configured')
    console.log(`   Cloud Name: ${cloudName}\n`)

    // Check if images directory exists
    if (!fs.existsSync(IMAGES_DIR)) {
      console.error(`❌ Error: Images directory not found at ${IMAGES_DIR}`)
      process.exit(1)
    }

    // Read current images.json to preserve order
    let currentImageList = []
    let imageFiles = []
    
    if (fs.existsSync(IMAGES_JSON)) {
      const jsonContent = fs.readFileSync(IMAGES_JSON, 'utf-8')
      currentImageList = JSON.parse(jsonContent)
      console.log(`📄 Found ${currentImageList.length} images in images.json`)
      
      // Extract filenames from current list (handles both local paths and CDN URLs)
      imageFiles = currentImageList.map(item => {
        if (item.startsWith('http://') || item.startsWith('https://')) {
          // It's a CDN URL, extract filename
          return item.split('/').pop().split('?')[0]
        } else {
          // It's already a filename
          return item
        }
      })
    } else {
      // No images.json, read from directory
      const allFiles = fs.readdirSync(IMAGES_DIR)
      imageFiles = allFiles.filter(file => {
        const ext = path.extname(file).toLowerCase()
        return IMAGE_EXTENSIONS.includes(ext)
      }).sort()
    }

    console.log(`📸 Found ${imageFiles.length} image files to upload\n`)

    if (imageFiles.length === 0) {
      console.log('⚠️  No image files found. Nothing to upload.')
      rl.close()
      return
    }

    // Create backup of original images.json
    if (fs.existsSync(IMAGES_JSON)) {
      fs.copyFileSync(IMAGES_JSON, IMAGES_JSON_BACKUP)
      console.log(`💾 Backed up original images.json to images.json.backup\n`)
    }

    // Upload images and collect CDN URLs (preserve order)
    const cdnUrls = []
    let uploaded = 0
    let skipped = 0
    let errors = 0

    console.log('🚀 Starting upload...\n')

    for (const filename of imageFiles) {
      const filePath = path.join(IMAGES_DIR, filename)
      
      // Check if file exists locally
      if (!fs.existsSync(filePath)) {
        console.log(`   ⚠️  ${filename} not found locally, skipping...`)
        errors++
        continue
      }
      
      try {
        process.stdout.write(`   Uploading ${filename}... `)
        const cdnUrl = await uploadImage(cloudinary, filePath, filename)
        cdnUrls.push(cdnUrl)
        uploaded++
        console.log('✅')
      } catch (error) {
        if (error.message.includes('already exists') || error.http_code === 409) {
          // Image already uploaded, generate URL from public_id
          const publicId = `baljit-grewal-memorial/${filename.replace(/\.[^/.]+$/, '')}`
          const existingUrl = cloudinary.url(publicId, { 
            secure: true,
            resource_type: 'auto'
          })
          cdnUrls.push(existingUrl)
          skipped++
          console.log('⏭️  (already exists)')
        } else {
          errors++
          console.log(`❌ Error: ${error.message}`)
        }
      }
    }

    // Save new images.json with CDN URLs
    const jsonContent = JSON.stringify(sortedUrls, null, 2)
    fs.writeFileSync(IMAGES_JSON_CDN, jsonContent + '\n')

    console.log(`\n✅ Upload complete!`)
    console.log(`   Uploaded: ${uploaded}`)
    console.log(`   Skipped (already exists): ${skipped}`)
    console.log(`   Errors: ${errors}`)
    console.log(`\n📄 CDN URLs saved to: images.json.cdn`)
    console.log(`\n📋 Next steps:`)
    console.log(`   1. Review images.json.cdn`)
    console.log(`   2. If it looks good, replace images.json:`)
    console.log(`      cp public/images/images.json.cdn public/images/images.json`)
    console.log(`   3. Your Gallery will now use CDN URLs!`)

    rl.close()
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    rl.close()
    process.exit(1)
  }
}

// Run the upload
uploadAllImages()


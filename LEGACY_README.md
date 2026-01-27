# The Baljit Grewal Memorial Site

A responsive, single-page React application serving as a digital memorial for Baljit Singh Grewal. Built with accessibility in mind, especially for elderly users.

## Tech Stack

- **React** (Vite)
- **React Router** (Routing)
- **Styled Components** (CSS-in-JS)
- **Lucide React** (Icons)

## Project Structure

```
src/
  ├── components/
  │   ├── Layout.jsx         # Main container with centered content
  │   ├── Hero.jsx           # Hero section with portrait, info, and CTA buttons
  │   ├── StickyNav.jsx      # Sticky navigation bar (Watch, Events, Stories, Gallery)
  │   ├── LivestreamCard.jsx # Video section (Slideshow & Funeral Service)
  │   ├── EventDetailsCard.jsx # Event details with collapsible past events
  │   ├── StoriesCard.jsx    # Stories section with "Submit your story" button
  │   ├── Gallery.jsx        # Photo/video gallery with infinite scroll
  │   ├── Lightbox.jsx       # Full-screen lightbox modal for gallery items
  │   └── HomeVideos.jsx     # Home videos page (homevideos.baljitgrewal.ca subdomain)
  ├── styles/
  │   ├── theme.js           # Design system theme (colors, typography, spacing)
  │   └── GlobalStyles.js    # Global CSS styles
  ├── constants.js           # Easy-to-edit data (name, dates, videos, events)
  ├── App.jsx                # Main app component with ThemeProvider
  └── main.jsx               # Entry point
public/
  ├── images/
  │   ├── images.json        # List of gallery image filenames
  │   └── [image files]      # Gallery images and GIFs
  ├── images/program/
  │   └── program.JPG        # Funeral program image
  ├── portrait.png           # Hero section portrait
  └── favicon.svg            # Tree of Life favicon
scripts/
  └── update-gallery.js      # Script to auto-update images.json
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Features

### Hero Section
- Memorial portrait, name, and dates
- Welcome message
- Two CTA buttons: "Slideshow" and "Service" (scroll to video section)
- Horizontal layout on desktop, stacked on mobile

### Watch Section
- **Slideshow Video**: Looping memorial slideshow (top)
- **Funeral Service Video**: Recorded service video (bottom)
- Videos displayed directly (no modal or preview overlay)
- Both videos visible and ready to play
- Responsive layout for all screen sizes

### Event Details
- **Current Events**: Celebration of Life prominently displayed
- **Past Events**: Collapsible section containing:
  - Funeral Service (with program modal)
  - Bhog & Antim Ardas
- Event information includes:
  - Date and time (with timezone)
  - Venue name and full address
  - "Get Directions" button (Google Maps)
  - "Show Program" button (opens full-screen modal)
  - RSVP information (for Celebration of Life)
- Badges for special event types (e.g., "Open House Style", "RSVP Event")

### Stories
- **Stories section** for sharing memories and stories
- "Coming soon" badge indicating stories will be displayed here
- **"Submit your story!" button** that opens email client with:
  - Pre-filled subject: "My favorite story about Bill Grewal"
  - Pre-filled body template for easy submission

### Gallery
- **Infinite Scroll**: Automatically loads more images as you scroll
  - Initial load: First 24 items load automatically if gallery is visible on page load
  - Additional items load as user scrolls near them (50px before entering viewport)
- **Lazy Loading**: Images/videos only load when entering viewport (50px before)
  - Uses IntersectionObserver for efficient viewport detection
  - Items already visible on page load start loading immediately
- **Thumbnail System**: 
  - **Local images**: Use optimized thumbnails in grid view (400px width, ~100-200KB each)
  - **Cloudinary images**: Use on-the-fly thumbnails (400x400px, auto quality)
  - Full-resolution images load only in lightbox
  - Automatic fallback to full image if thumbnail missing
- **Video Support**: 
  - **Local videos**: MP4s autoplay, loop, and are muted in grid view
  - **Cloudinary videos**: Optimized for mobile with aggressive compression
    - **Grid view**: 480px width, economy quality, modern codecs, no audio track
    - **Lightbox**: Full quality with modern codecs
    - **Poster/thumbnail**: Static JPG frame (400x400px) generated from video
  - **Video Progress Bar**: Shows video length, current progress, and remaining time
    - Appears as overlay on videos in grid view
    - Updates in real-time as video plays
  - **Video Loading Indicator**: Subtle icon overlay appears on videos that haven't loaded yet
    - Disappears once video is ready to play
  - **Smart Playback**: Videos automatically pause when scrolled out of view
    - Resume playing when scrolled back into view (50% visibility threshold)
  - Videos play with sound, autoplay, and loop in lightbox
- **Filter Toggle**: Slideable toggle to filter by:
  - Both (default)
  - Images Only
  - Videos Only
- **CSV-Based Sorting**: Gallery order controlled by `gallery.csv` with `default_sort` column
  - **Video Priority**: Videos appear in first 150 positions (use `npm run sort-gallery-csv`)
  - Videos prioritized to appear in first 150 items
  - Custom sort order for curated display
- **Lightbox**: Full-screen viewing with:
  - Auto-hiding navigation buttons (appear on hover, hide after 1s inactivity)
  - Keyboard navigation (Arrow keys, Escape)
  - Swipe gestures (mobile and desktop)
  - Image counter
- **Badge**: "More pictures coming soon!" notification
- **Image Management**: Uses `public/images/images.json` (synced from `gallery.csv`)

### Navigation
- **Sticky navigation bar** with four sections:
  - **Watch**: Scrolls to video section
  - **Events**: Scrolls to event information (renamed from "Event Details")
  - **Stories**: Scrolls to stories section
  - **Gallery**: Scrolls to photo gallery
- **Active section tracking**: Automatically highlights the current section based on scroll position
  - Active section has **bold text** and **primary color**
  - **Sliding underline indicator** animates to the active section
  - Underline only appears after scrolling past the hero section (when portrait image appears)
- **Animated portrait**: Portrait image appears in navbar after scrolling past hero section
- Smooth scrolling with proper offset for sticky nav
- Full-width responsive design (works correctly on mobile)

## Configuration

### Home Videos

The home videos page is hosted on a dedicated subdomain: **`homevideos.baljitgrewal.ca`**

**Access:**
- **Primary URL**: `https://homevideos.baljitgrewal.ca`
- **Legacy redirect**: `https://baljitgrewal.ca/homevideos` automatically redirects to the subdomain

The page displays embedded YouTube videos in a card layout with timeline, grid, and list views. To add videos:

1. Edit `src/constants.js`
2. Add video objects to the `HOME_VIDEOS` array:

```javascript
export const HOME_VIDEOS = [
  {
    id: "VIDEO_ID_HERE", // YouTube video ID from URL: youtube.com/watch?v=VIDEO_ID
    title: "Video Title",
    description: "Brief description of what happens in the video",
    location: "Edmonton, Canada", // or "India", "Vancouver", etc.
    year: 1990,
    appearances: ["Baljit Grewal", "Family Member 1", "Family Member 2"], // Who appears in the video
  },
  // Add more videos...
]
```

**Fields:**
- `id` (required): YouTube video ID
- `title` (required): Video title
- `description` (optional): Brief description
- `location` (optional): Location where video was taken
- `year` (optional): Year the video was taken
- `appearances` (optional): Array of people who appear in the video

**Note:** This is a "secret" endpoint - it's not linked in the navigation, but accessible via direct URL. The subdomain is configured in Vercel and uses the same codebase as the main site.

---

Edit `src/constants.js` to update:

### Memorial Information
```javascript
export const MEMORIAL_DATA = {
  name: "Baljit Singh Grewal",
  birthDate: "January 1, 1953",
  deathDate: "January 16, 2026",
  portraitImage: "/portrait.png",
  welcomeMessage: "..."
}
```

### Event Details
```javascript
export const EVENT_DATA = {
  // Main Funeral Service (now in Past Events)
  displayDate: "Thursday, January 22nd, 2026",
  displayTime: "12:00 PM MST",
  venueName: "Park Place Funeral Home",
  address: { ... },
  programPdfUrl: "/images/program/program.JPG",
  
  // YouTube Videos
  youtubeVideoId: "CtLesw1JaBA",        // Funeral Service video
  youtubeLoopVideoId: "Rg4KB7H9cRw",    // Slideshow video
  
  // Additional Events
  additionalEvents: [
    {
      name: "Celebration of Life in Vancouver",
      date: "Sunday, January 25th, 2026",
      time: "12:00 - 4:30 PM PST",
      isPast: false,  // Set to true for past events
      // ... other event details
    }
  ]
}
```

## Gallery Management

### Current Gallery Statistics

- **Total Files**: 697+ media files
- **Images**: 656+ files
- **Videos (MP4)**: 41+ files
- **Total Size**: ~1.2GB
- **Location**: `public/images/` (local) + Cloudinary (hosted)
- **Thumbnails**: Generated on-demand (saved to `public/images/thumbnails/`) or Cloudinary on-the-fly

### Gallery Workflow

The gallery uses a **CSV-based management system** for metadata and sorting:

1. **`gallery.csv`** - Master file containing all metadata (filename, type, alt text, category, year, date, tags, default_sort)
2. **`images.json`** - Simple array of filenames, synced from CSV and sorted by `default_sort`

### Adding New Media Files

1. **Place files** in `public/images/` folder
   - Supported formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`, `.svg`, `.mp4`, `.webm`, `.mov`

2. **Run the master sync script**:
   ```bash
   npm run sync-gallery
   ```
   This single command will:
   - Update `gallery.csv` (adds new files from local + Cloudinary, removes deleted files)
   - Generate thumbnails for new local images
   - Sync `images.json` from CSV (preserves sort order)

3. **Sort the gallery** (optional, but recommended):
   ```bash
   npm run sort-gallery-csv
   ```
   This ensures videos appear in the first 150 positions, images after.

   **This is the recommended workflow!** Two commands sync and sort everything.

   **Alternative (manual steps):**
   - `npm run update-gallery-csv` - Sync CSV only
   - `npm run generate-thumbnails` - Generate thumbnails only
   - `node scripts/sync-images-json-from-csv.js` - Sync images.json only

### Customizing Sort Order

Edit `gallery.csv` and set `default_sort` values:
- Lower numbers = appear first
- Videos are currently set to appear in first 150 items
- Default for new files: 10000 (appears at end)

Then sync:
```bash
node scripts/sync-images-json-from-csv.js
```

### Gallery Features

- **Infinite Scroll**: Loads 24 items initially, more as you scroll
  - First 24 items load automatically if gallery is visible on page load
- **Lazy Loading**: Images/videos only load when near viewport (50px before)
  - Uses IntersectionObserver for efficient detection
  - Items already visible start loading immediately
- **Thumbnail System**: Images use thumbnails in grid, full-res in lightbox
- **Video Support**: 
  - **Optimized for mobile**: Cloudinary videos use aggressive compression in grid view
    - 480px width, economy quality, modern codecs, no audio
  - **Progress Bar**: Real-time progress overlay showing length, current time, and remaining time
  - **Loading Indicator**: Icon overlay on videos that haven't loaded yet
  - **Smart Playback**: Videos pause when out of view, resume when in view
  - MP4s autoplay (muted) in grid, with sound in lightbox
- **Filter Toggle**: Switch between Images, Videos, or Both
- **Lightbox**: Click any item to view full-screen
  - Navigation buttons appear on hover
  - Auto-hide after 1 second of mouse inactivity
  - Keyboard and swipe navigation

## Design System

The project uses a centralized theme system in `src/styles/theme.js` that defines:
- Colors (background, text, accents)
- Typography (font sizes, weights, family)
- Spacing scale
- Shadows and border radius
- Breakpoints for responsive design

All components use styled-components and access the theme via the `ThemeProvider`.

## Accessibility Features

- Large, readable text (especially for elderly users)
- High contrast colors
- Obvious, large buttons
- Keyboard navigation throughout
- Screen reader support
- Smooth scrolling with proper offsets
- Touch-friendly controls on mobile

## Deployment

The site is deployed using Vercel. Just push your commits and merge the branch to Main, and it auto deploys to:
- **Main site**: `www.baljitgrewal.ca` (or `baljitgrewal.ca`)
- **Home Videos subdomain**: `homevideos.baljitgrewal.ca`

Both domains are served from the same Vercel deployment. The subdomain is configured in Vercel's domain settings and uses DNS CNAME records pointing to Vercel.

**Subdomain Configuration:**
- The home videos page is served on the `homevideos.baljitgrewal.ca` subdomain
- The old `/homevideos` route on the main domain automatically redirects to the subdomain (configured in `vercel.json`)
- Subdomain detection is handled in `App.jsx` to serve the correct component based on hostname

### Build for Production
```bash
npm run build
```

The `dist/` folder contains the production-ready static files.

### Cloudinary Setup (for Video Hosting)

To use Cloudinary for hosting videos (recommended to keep repo size small):

1. **Sign up** at https://cloudinary.com (free tier: 25GB storage, 25GB bandwidth/month)

2. **Get your credentials** from https://console.cloudinary.com/settings/api-keys

3. **Create `.env` file** in project root:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Upload videos** to Cloudinary (via dashboard or API)

5. **Run sync script** - it will automatically:
   - Fetch all videos from Cloudinary
   - Add them to `gallery.csv`
   - Sync `images.json`
   ```bash
   npm run sync-gallery
   ```

**Benefits:**
- ✅ Videos stored in Cloudinary (not in repo)
- ✅ Smaller repo size (only images + thumbnails)
- ✅ Faster deployments
- ✅ Better performance (CDN delivery)
- ✅ Automatic sync with existing workflow

**Note:** The gallery code already supports Cloudinary URLs - just add them to `images.json` or let the sync script handle it!

### Video Optimization Details

The gallery implements aggressive video optimization to reduce data usage, especially important for mobile users:

**Grid View Optimization:**
- **Resolution**: Capped at 480px width (sufficient for mobile grid view)
- **Quality**: `q_auto:eco` - Economy quality mode (aggressive compression)
- **Codec**: `f_auto` - Automatically uses modern codecs (AV1/H.265) which are ~30% smaller
- **Audio**: `ac_none` - Removed audio track (saves ~10% more, videos autoplay muted anyway)
- **Result**: Videos are ~70-80% smaller than original, perfect for grid view

**Lightbox View:**
- **Quality**: `q_auto` - High quality but still optimized
- **Codec**: `f_auto` - Modern codecs for best compression
- **Result**: Full quality viewing experience with optimized file sizes

**Poster/Thumbnail:**
- **Format**: Static JPG frame extracted from video
- **Size**: 400x400px, auto quality
- **Usage**: Shows before video loads, provides instant visual feedback

**Smart Playback:**
- Videos automatically pause when scrolled out of viewport (saves bandwidth)
- Resume playing when scrolled back into view (50% visibility threshold)
- Uses IntersectionObserver for efficient viewport detection

### Important Notes

- **Current Gallery Size**: ~307MB (647 images, 4 local videos)
- **Thumbnail System**: Reduces initial load from 100MB+ to ~5MB
- **Video Hosting**: Use Cloudinary for videos to keep repo under Vercel limits
- **Hybrid Approach** (Recommended): 
  - **Local**: Keep 1-2 key images locally (e.g., portrait)
  - **Cloudinary**: All other images and videos hosted externally
  - **Thumbnails**: Local images use generated thumbnails, Cloudinary images use on-the-fly thumbnails
- **Program Image**: Place program image at `public/images/program/program.JPG`
- **Portrait**: Place hero portrait at `public/portrait.png`
- **Deployment**: Vercel free tier has ~250MB limit - use Cloudinary for videos!

## Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Gallery Management
- `npm run sync-gallery` - **Master script**: Syncs everything (CSV, thumbnails, images.json) - Use this when adding/removing files
  - Works with **local files** (in `public/images/`) and **Cloudinary** (images + videos fetched via API)
- `npm run update-gallery` - Auto-update `images.json` from `public/images/` folder (simple list)
- `npm run update-gallery-csv` - Sync `gallery.csv` with files (adds new, removes deleted)
  - **Cloudinary Support**: Automatically fetches images and videos from your Cloudinary account
- `npm run generate-thumbnails` - Generate thumbnails for all local images (requires `sharp` package)
  - Only processes local images (Cloudinary images use on-the-fly thumbnails)
- `npm run sort-gallery-csv` - **Sort gallery with video priority** - Assigns videos to first 150 positions, images after
  - Can be run anytime to re-sort the gallery
  - Videos get sort values 1-150, images get 151-10000
- `node scripts/randomize-sort-order.js` - Randomly assign sort orders (videos in first 150) - Legacy, use `sort-gallery-csv` instead
- `node scripts/sync-images-json-from-csv.js` - Sync `images.json` from `gallery.csv` (preserves sort order)


---

## Recent Updates

- ✅ Converted from livestream to recorded videos
- ✅ Removed modal/preview overlay - videos show directly
- ✅ Added collapsible "Past Events" section
- ✅ Changed "Download Program" to "Show Program" (modal)
- ✅ Updated navigation from "Watch Live" to "Watch"
- ✅ Added infinite scroll to gallery (replaced pagination)
- ✅ Added slideable filter toggle (Images/Videos/Both)
- ✅ Lightbox navigation buttons auto-hide on mouse inactivity
- ✅ Tree of Life favicon
- ✅ **MP4 video support** - Videos autoplay in grid (muted), with sound in lightbox
- ✅ **Thumbnail system** - Optimized thumbnails for images (400px, ~100-200KB)
- ✅ **CSV-based gallery management** - Full metadata support with `gallery.csv`
- ✅ **Custom sort ordering** - `default_sort` column controls display order
- ✅ **Video prioritization** - Videos appear in first 150 items (increased from 120)
- ✅ **Gallery sync scripts** - Automated CSV/JSON synchronization
- ✅ **Active section tracking** - Navbar automatically highlights current section based on scroll position
- ✅ **Sliding underline indicator** - Animated underline that moves to active navbar item
- ✅ **Stories section** - New section with "Submit your story" email button
- ✅ **Video optimization** - Cloudinary videos optimized for mobile (480px, economy quality, no audio)
- ✅ **Video progress bars** - Real-time progress overlay on gallery videos
- ✅ **Video loading indicators** - Icon overlay on videos that haven't loaded yet
- ✅ **Smart video playback** - Videos pause when out of view, resume when in view
- ✅ **Improved lazy loading** - First 24 items load automatically if gallery is visible
- ✅ **Mobile layout fixes** - Full-width navbar and content on mobile devices

---

## Reference Documentation

### Scripts Documentation

#### sync-gallery.js ⭐ **MASTER SCRIPT**

**One-stop script to sync the entire gallery system when files are added/removed.**

**Usage:**
```bash
npm run sync-gallery
```

**What it does:**
1. **Updates `gallery.csv`** - Adds new files from:
   - **Local folder** (`public/images/`) - images and videos
   - **Cloudinary** (via API) - videos only
   - Automatically fetches all videos from your Cloudinary account
   - Removes entries for deleted files (local or Cloudinary)
2. **Generates thumbnails** - Creates thumbnails for new local images (skips existing ones)
   - Cloudinary videos don't need thumbnails (they play directly)
3. **Syncs `images.json`** - Updates from CSV, preserving sort order

**When to use:**
- **After adding new images** to `public/images/`
- **After uploading videos to Cloudinary**
- **After deleting files** from `public/images/` or Cloudinary
- **After renaming files** in `public/images/`
- **Any time you modify the gallery**

**This is the recommended script for regular gallery maintenance.**

**Cloudinary Support:**
- Requires `.env` file with Cloudinary credentials (see Cloudinary Setup above)
- Automatically detects and syncs images and videos from your Cloudinary account
- If Cloudinary credentials are missing, script continues with local files only

**After syncing, run sort script:**
```bash
npm run sort-gallery-csv
```
This ensures videos appear in the first 150 positions.

---

#### update-gallery.js

Automatically scans the `public/images/` folder and updates `images.json` with all media files found.

**Usage:**
```bash
npm run update-gallery
```

**What it does:**
1. Scans `public/images/` for media files
2. Filters for supported formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`, `.svg`, `.mp4`, `.webm`, `.mov`
3. Sorts filenames alphabetically
4. Updates `public/images/images.json` with the list
5. Reports image and video counts

**When to use:**
- Quick update of `images.json` without CSV metadata
- Simple file list generation

**Note:** For full metadata management, use `update-gallery-csv.js` instead.

---

#### update-gallery-csv.js (Now with Cloudinary Support!)

**Syncs `gallery.csv` with actual files in `public/images/` AND Cloudinary images/videos.**

**Usage:**
```bash
npm run update-gallery-csv
```

**What it does:**
1. **Scans local folder** (`public/images/`) for images and videos
2. **Fetches Cloudinary resources** via API (if credentials configured):
   - Images from Cloudinary
   - Videos from Cloudinary
3. **Removes entries** for files that no longer exist (local or Cloudinary)
4. **Adds new entries** for files not in CSV:
   - Local files: `filename.jpg` or `video.mp4`
   - Cloudinary images: Full URL `https://res.cloudinary.com/.../image.jpg`
   - Cloudinary videos: Full URL `https://res.cloudinary.com/.../video.mp4`
5. **Sets `default_sort`** to 10000 for new entries

**Cloudinary Integration:**
- Automatically queries your Cloudinary account for all images and videos
- Uses Cloudinary API to get secure HTTPS URLs
- Detects if a CSV entry is a Cloudinary URL (starts with `http://` or `https://`)
- Validates that Cloudinary URLs still exist before keeping them

**Output:**
- Shows breakdown: Images, Videos, GIFs
- Shows source breakdown: Local files vs Cloudinary (with video/image counts)
- Lists all added/removed files

#### sort-gallery-csv.js ⭐ **NEW - Gallery Sorter**

**Sorts gallery.csv with video priority - videos appear in first 150 positions.**

**Usage:**
```bash
npm run sort-gallery-csv
```

**What it does:**
1. **Separates videos and images** from CSV
2. **Assigns videos** to sort values 1-150 (first 150 positions)
3. **Assigns images** to sort values 151-10000 (after videos)
4. **Randomizes order** within each group for variety
5. **Writes sorted CSV** back to file

**When to use:**
- **After uploading new videos** - Ensures they appear early in gallery
- **After adding many images** - Re-balances the sort order
- **Anytime you want to re-sort** - Run this to apply video priority

**Features:**
- Videos always appear in first 150 items
- Images appear after videos
- Can be run multiple times (re-randomizes each time)
- Preserves all metadata (alt, category, tags, etc.)

**Example output:**
```
📊 Found 41 video(s) and 656 image(s)
✅ Successfully sorted gallery.csv
   Videos: 41 (assigned sort values 1-150)
   Images: 656 (assigned sort values 151-10000)
✅ Verification: 41 of 41 videos appear in first 150 items
```

---

#### fetch-cloudinary-videos.js

**Fetches all videos from your Cloudinary account.**

**Usage:**
```bash
node scripts/fetch-cloudinary-videos.js
```

**What it does:**
- Queries Cloudinary API for all video resources
- Returns array of video URLs
- Used internally by `update-gallery-csv.js`

**Requirements:**
- `.env` file with Cloudinary credentials
- `cloudinary` package installed

---

#### fetch-cloudinary-images.js

**Fetches all images from your Cloudinary account.**

**Usage:**
```bash
node scripts/fetch-cloudinary-images.js
```

**What it does:**
- Queries Cloudinary API for all image resources
- Returns array of image URLs
- Used internally by `update-gallery-csv.js`

**Requirements:**
- `.env` file with Cloudinary credentials
- `cloudinary` package installed

Syncs `gallery.csv` with actual files in `public/images/`. This is the recommended script for gallery management.

**Usage:**
```bash
npm run update-gallery-csv
```

**What it does:**
1. Reads existing `gallery.csv` entries
2. **Removes** entries for files that no longer exist
3. **Adds** entries for new files (images, MP4s, GIFs)
4. Sets `default_sort` to 10000 for new entries (or entries without sort value)
5. Preserves existing metadata (alt text, category, tags, etc.)
6. Sorts output by `default_sort` value

**When to use:**
- After adding new images/videos to `public/images/`
- After deleting files from `public/images/`
- To sync CSV with actual files

**Output:**
- Updated `gallery.csv` with all current files
- New files get default metadata (filename as alt text, empty category/tags)

---

#### generate-thumbnails.js

Generates optimized thumbnails for all images in the gallery.

**Usage:**
```bash
npm run generate-thumbnails
```

**Requirements:**
```bash
npm install sharp
```

**What it does:**
1. Scans `public/images/` for image files (excludes videos/GIFs)
2. Creates `public/images/thumbnails/` directory if needed
3. Generates JPEG thumbnails (400px width, 80% quality, ~100-200KB each)
4. Skips images that already have up-to-date thumbnails
5. All thumbnails saved as `.jpg` regardless of original format

**When to use:**
- After adding new images
- To optimize gallery performance (thumbnails load much faster)
- Initial setup for existing image collection

**Performance Impact:**
- Grid view: Loads ~5MB of thumbnails instead of 100MB+ of full images
- Lightbox: Still loads full-resolution images

---

#### randomize-sort-order.js

Randomly assigns `default_sort` values to all entries in `gallery.csv`.

**Usage:**
```bash
node scripts/randomize-sort-order.js
```

**What it does:**
1. Reads `gallery.csv` and separates videos from images
2. Assigns videos random sort values 1-150 (ensures all videos in first 150 items)
3. Assigns images random sort values 1-10000
4. Sorts all entries by `default_sort` value
5. Writes updated CSV

**When to use:**
- One-time initialization of sort order
- To randomize gallery display order
- To ensure videos appear prominently (first 150 items)

**Note:** After running, sync `images.json` with `sync-images-json-from-csv.js`

---

#### sync-images-json-from-csv.js

Syncs `images.json` from `gallery.csv`, preserving the sort order.

**Usage:**
```bash
node scripts/sync-images-json-from-csv.js
```

**What it does:**
1. Reads `gallery.csv` and extracts filenames
2. Sorts by `default_sort` value (ascending)
3. Writes ordered filenames to `public/images/images.json`

**When to use:**
- After editing `gallery.csv` sort order
- After running `randomize-sort-order.js`
- To ensure `images.json` matches CSV order

**Why needed:**
- Gallery component reads from `images.json` (simple array)
- CSV contains metadata and sort order
- This script bridges the two, ensuring gallery displays in correct order

---

### Gallery Images Documentation

#### How to Add Images

1. **Place your images** in `public/images/` folder
   - Supported formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
   - GIFs are fully supported and will display as animated

2. **Update `images.json`** to include your image filenames:
   ```json
   [
     "image001.jpg",
     "image002.jpg",
     "memory001.gif",
     "photo003.jpg"
   ]
   ```

3. **That's it!** The gallery will automatically:
   - Load images from this list
   - Detect image type (GIF, JPG, etc.) from filename
   - Lazy load images for better performance
   - Display them in a responsive grid

#### Gallery Tips

- **Naming**: Use descriptive filenames (they'll be used as alt text)
- **Organization**: Keep all images in `public/images/` folder
- **Performance**: Images are lazy-loaded (only load when scrolled into view)
- **Infinite Scroll**: Gallery loads 24 images initially, then loads more as you scroll down
- **Filter Toggle**: Use the slideable toggle to filter by Images, Videos, or Both

#### Example `images.json`

```json
[
  "family-photo-2020.jpg",
  "wedding-celebration.jpg",
  "memory-animation.gif",
  "travel-photo-2019.jpg"
]
```

#### Technical Note

The gallery uses intelligent lazy loading with Intersection Observer API, so users won't download all images at once. Images only load when they're about to enter the viewport (50px before).

---

### Gallery CSV Format Guide (Legacy)

> **Note**: The gallery currently uses `images.json` instead of CSV. This section is kept for reference if you need to migrate back to CSV-based metadata in the future.

#### File Location

Place your `gallery.csv` file in the `public/` folder:
```
public/gallery.csv
```

#### CSV Format

The CSV file should have a header row with the following columns (in any order):

**Required Columns:**
- **filename** - The filename of the image/GIF (e.g., `image001.jpg`, `memory.gif`)
- **type** - Either `image`, `gif`, or `video`

**Optional Columns:**
- **alt** - Alternative text for accessibility (also accepts: `description`, `caption`)
- **url** - Full URL path (if not provided, defaults to `/images/{filename}`)
- **thumbnail** - Thumbnail image path (if not provided, uses `url`)
- **category** - Category for filtering (e.g., "Family", "Events", "Travel")
- **year** - Year for filtering (e.g., "2020", "2015")
- **date** - Full date in YYYY-MM-DD format (e.g., "2020-05-15")
- **tags** - Comma-separated tags (e.g., "family,home,celebration")

#### Example CSV

```csv
filename,type,alt,category,year,date,tags
image001.jpg,image,Family gathering at home,Family,2020,2020-05-15,"family,home,celebration"
image002.jpg,image,Wedding celebration,Events,2015,2015-08-20,"wedding,celebration,family"
memory001.gif,gif,Animated memory,Family,2018,2018-12-25,"family,christmas,animated"
image003.jpg,image,Travel memory,Travel,2019,2019-07-10,"travel,vacation"
```

#### File Organization

**Recommended Folder Structure:**
```
public/
  ├── gallery.csv
  ├── images/
  │   ├── image001.jpg
  │   ├── image002.jpg
  │   ├── image003.jpg
  │   └── ...
  └── gifs/
      ├── memory001.gif
      ├── memory002.gif
      └── ...
```

**Filename Paths:**
In your CSV, you can reference files in two ways:

1. **Just filename** (recommended if all files are in `/images/`):
   ```csv
   filename,type
   image001.jpg,image
   ```

2. **Full path** (if files are in different folders):
   ```csv
   filename,url
   image001.jpg,/images/image001.jpg
   memory001.gif,/gifs/memory001.gif
   ```

#### Tips for Large Galleries (200+ items)

1. **Use consistent naming**: `image001.jpg`, `image002.jpg`, etc. makes it easier to manage
2. **Batch processing**: Use Excel, Google Sheets, or a script to generate the CSV
3. **Categories**: Group similar images with categories for easy filtering
4. **Dates**: Include dates for chronological sorting
5. **Thumbnails**: For very large images, consider creating smaller thumbnail versions

#### CSV Generation Tips

**Using Excel/Google Sheets:**
1. Create columns: filename, type, alt, category, year, date, tags
2. Fill in your data
3. Export as CSV (UTF-8 encoding recommended)
4. Save as `gallery.csv` in the `public/` folder

**Using a Script (Node.js example):**
```javascript
const fs = require('fs');
const images = fs.readdirSync('./public/images');
const gifs = fs.readdirSync('./public/gifs');

let csv = 'filename,type,alt,category,year,date\n';

images.forEach((img, i) => {
  csv += `${img},image,Memory ${i + 1},Family,2020,2020-01-01\n`;
});

gifs.forEach((gif, i) => {
  csv += `${gif},gif,Animated Memory ${i + 1},Family,2020,2020-01-01\n`;
});

fs.writeFileSync('./public/gallery.csv', csv);
```

#### Supported File Types

- **Images**: `.jpg`, `.jpeg`, `.png`, `.webp`
- **GIFs**: `.gif` (animated GIFs are fully supported)
- **Videos**: `.mp4`, `.webm` (if you add videos later)

#### Troubleshooting

**Images not showing?**
- Check that files exist in the `public/` folder
- Verify the filename in CSV matches the actual file name (case-sensitive)
- Check browser console for 404 errors

**CSV not loading?**
- Ensure file is in `public/` folder (not `src/`)
- Check CSV format (comma-separated, proper quotes for fields with commas)
- Verify file encoding is UTF-8

**Performance issues?**
- The gallery uses infinite scroll (24 items initially) for performance
- Images are lazy-loaded
- Consider optimizing image sizes before uploading

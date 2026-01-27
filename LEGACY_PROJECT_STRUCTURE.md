# Project Structure & Dependencies

## File & Folder Structure

```
thefriendlybill/
│
├── .env                          # Environment variables (Cloudinary credentials) - NOT in git
├── .env.example                  # Template for environment variables
├── .gitignore                    # Git ignore rules (excludes .env, node_modules, etc.)
├── index.html                    # HTML entry point - root template for React app
├── package.json                  # NPM dependencies and scripts configuration
├── package-lock.json             # Locked dependency versions
├── vercel.json                   # Vercel deployment config (redirects, rewrites for SPA routing)
├── vite.config.js                # Vite build tool configuration
│
├── README.md                      # Main project documentation
├── PROJECT_STRUCTURE.md          # This file - project structure documentation
├── SUBDOMAIN_MIGRATION_PLAN.md   # Plan for migrating /homevideos to subdomain
├── SUBDOMAIN_SETUP_INSTRUCTIONS.md # Step-by-step subdomain setup guide
│
├── public/                        # Static assets served directly
│   ├── favicon.svg               # Tree of Life favicon
│   ├── portrait.png              # Hero section portrait image
│   ├── gallery.csv               # Master gallery metadata file (filename, type, alt, category, year, date, tags, default_sort)
│   │
│   └── images/                    # Gallery media files
│       ├── images.json           # Simple array of filenames/URLs, synced from gallery.csv, sorted by default_sort
│       ├── program/              # Funeral program image
│       │   └── program.JPG       # Program PDF/image displayed in modal
│       ├── thumbnails/           # Generated thumbnail images (400px width, ~100-200KB each)
│       │   └── [thumbnail files] # Auto-generated .jpg thumbnails for local images
│       └── [media files]         # Local images (.jpg, .jpeg, .png) and videos (.mp4)
│
├── scripts/                       # Node.js utility scripts for gallery management
│   ├── cloudinary-config.js      # Cloudinary SDK configuration helper
│   ├── fetch-cloudinary-images.js # Fetches all images from Cloudinary API
│   ├── fetch-cloudinary-videos.js # Fetches all videos from Cloudinary API
│   ├── generate-thumbnails.js    # Generates optimized thumbnails for local images (requires sharp)
│   ├── randomize-sort-order.js   # Legacy: Randomly assigns sort values (use sort-gallery-csv instead)
│   ├── sort-gallery-csv.js       # Sorts gallery.csv with video priority (videos in first 150 positions)
│   ├── sync-gallery.js           # Master sync script - runs update-gallery-csv, generate-thumbnails, sync-images-json
│   ├── sync-images-json-from-csv.js # Syncs images.json from gallery.csv (preserves sort order)
│   ├── update-gallery-csv.js     # Syncs gallery.csv with local files + Cloudinary (adds new, removes deleted)
│   ├── update-gallery.js         # Legacy: Simple script to update images.json from folder (use sync-gallery instead)
│   └── upload-to-cdn.js          # Utility to upload local files to Cloudinary
│
└── src/                           # React application source code
    ├── main.jsx                   # React entry point - mounts App component to #root
    ├── index.css                  # Minimal global CSS (most styles use styled-components)
    ├── App.jsx                    # Main app component - routing, subdomain detection, ThemeProvider
    ├── constants.js               # Easy-to-edit data (memorial info, events, home videos)
    │
    ├── components/                # React components
    │   ├── Layout.jsx             # Main container component - centered content wrapper (max-width: 600px)
    │   ├── Hero.jsx               # Hero section - portrait, name, dates, welcome message, CTA buttons (Memories, Service)
    │   ├── StickyNav.jsx          # Sticky navigation bar - Watch, Events (hidden), Stories, Gallery with active section tracking
    │   ├── LivestreamCard.jsx     # Watch section - Memories video (looping) and Funeral Service video
    │   ├── EventDetailsCard.jsx   # Events section - current/past events, RSVP, program modal (currently hidden)
    │   ├── StoriesCard.jsx        # Stories section - "Submit your story" email button, coming soon badge
    │   ├── Gallery.jsx             # Photo/video gallery - infinite scroll, lazy loading, filters, lightbox integration
    │   ├── Lightbox.jsx           # Full-screen modal for viewing gallery items - keyboard/swipe navigation
    │   └── HomeVideos.jsx         # Home videos page - password-protected YouTube video collection (subdomain)
    │
    ├── styles/                    # Styling system
    │   ├── theme.js               # Design system theme - colors, typography, spacing, shadows, breakpoints
    │   └── GlobalStyles.js        # Global CSS-in-JS styles (styled-components) - resets, base styles
    │
    └── utils/                      # Utility functions
        └── csvParser.js           # CSV parsing utilities (handles quoted fields, commas in values)
```

## NPM Packages & Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **react** | ^19.2.3 | Core React library - UI component framework |
| **react-dom** | ^19.2.3 | React DOM renderer - renders React to browser DOM |
| **react-router-dom** | ^7.13.0 | Client-side routing - handles `/homevideos` route and subdomain routing |
| **styled-components** | ^6.3.8 | CSS-in-JS styling - component-scoped styles with theme support |
| **lucide-react** | ^0.562.0 | Icon library - provides all icons (Video, Calendar, Images, etc.) |
| **cloudinary** | ^2.9.0 | Cloudinary SDK - API client for fetching images/videos from Cloudinary |
| **dotenv** | ^17.2.3 | Environment variable loader - loads `.env` file for Cloudinary credentials |
| **sharp** | ^0.34.5 | Image processing - generates optimized thumbnails (native binary, fast) |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **vite** | ^7.3.1 | Build tool & dev server - fast HMR, optimized production builds |
| **@vitejs/plugin-react** | ^5.1.2 | Vite plugin for React - JSX transformation, Fast Refresh |

## Environment Variables (.env)

The `.env` file (not in git) contains Cloudinary credentials for fetching hosted media:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here    # Your Cloudinary cloud name
CLOUDINARY_API_KEY=your_api_key_here         # API key for authentication
CLOUDINARY_API_SECRET=your_api_secret_here   # API secret for authentication
```

**Purpose:**
- Allows scripts to fetch images and videos from your Cloudinary account
- Used by `update-gallery-csv.js` to sync Cloudinary media into `gallery.csv`
- Required for `sync-gallery` script to work with Cloudinary

**Setup:**
1. Copy `.env.example` to `.env`
2. Get credentials from: https://console.cloudinary.com/settings/api-keys
3. Fill in your actual values
4. `.env` is gitignored for security

## NPM Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| **dev** | `npm run dev` | Start Vite dev server (localhost:5173) |
| **build** | `npm run build` | Build production bundle to `dist/` folder |
| **preview** | `npm run preview` | Preview production build locally |
| **sync-gallery** | `npm run sync-gallery` | ⭐ Master script - syncs CSV, generates thumbnails, updates images.json |
| **update-gallery-csv** | `npm run update-gallery-csv` | Syncs gallery.csv with local files + Cloudinary |
| **generate-thumbnails** | `npm run generate-thumbnails` | Generates thumbnails for local images (requires sharp) |
| **sort-gallery-csv** | `npm run sort-gallery-csv` | Sorts gallery with video priority (videos in first 150 positions) |
| **update-gallery** | `npm run update-gallery` | Legacy: Simple images.json update (use sync-gallery instead) |
| **upload-to-cdn** | `npm run upload-to-cdn` | Utility to upload local files to Cloudinary |

## Key Configuration Files

### `vercel.json`
- **Rewrites**: All routes (`/*`) → `/index.html` (enables React Router client-side routing)
- **Redirects**: `/homevideos` → `https://homevideos.baljitgrewal.ca` (permanent 301 redirect)

### `vite.config.js`
- Minimal config - uses React plugin for JSX transformation
- Fast Refresh enabled for development

### `package.json`
- `"type": "module"` - Uses ES modules (import/export syntax)
- Scripts for development, building, and gallery management

## Data Flow

1. **Gallery Management:**
   - `gallery.csv` → Master metadata file (editable)
   - `sync-gallery` → Updates CSV, generates thumbnails, syncs `images.json`
   - `images.json` → Simple array read by Gallery component (sorted by `default_sort`)

2. **Media Sources:**
   - **Local**: Files in `public/images/` (images + some videos)
   - **Cloudinary**: Images and videos fetched via API (URLs in CSV)

3. **Component Data:**
   - `src/constants.js` → Memorial data, events, home videos
   - Components read from constants or fetch `images.json`

## Build Output

- **Development**: Served by Vite dev server (no build step)
- **Production**: `npm run build` → Creates `dist/` folder with:
  - Optimized JavaScript bundles
  - Processed CSS
  - Static assets (images, etc.)
  - `index.html` with asset references

## Deployment

- **Platform**: Vercel
- **Main Domain**: `baljitgrewal.ca` / `www.baljitgrewal.ca`
- **Subdomain**: `homevideos.baljitgrewal.ca` (same deployment, different routing)
- **Auto-deploy**: Push to main branch triggers deployment

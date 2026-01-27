
# The Apna Family Network

**apna.family** is a multi-tenant React application designed to serve as a digital heritage platform for connected families. It hosts interactive family trees, memorial profiles, and private video vaults across multiple family subdomains (e.g., `grewal.apna.family`, `wong.apna.family`).

The project uses a **"Single Codebase, Multiple Tenants"** architecture. A single Vercel deployment handles traffic for all subdomains, dynamically rendering the correct content based on the hostname.

---

## 🏗 Architecture & Routing

The application uses a **Subdomain-Driven Routing** strategy controlled by `App.jsx`.

| Domain | Route | Component/Template | Purpose |
| --- | --- | --- | --- |
| **apna.family** | `/` | `<GlobalTree />` | The "Root" landing page. Interactive tree navigating to family portals. |
| **{family}.apna.family** | `/` | `<FamilyPortal />` | Landing page for a specific family (e.g., The Grewals). |
| **{family}.apna.family** | `/homevideos` | `<VideoVault />` | Password-protected video grid for that family. |
| **{family}.apna.family** | `/{personId}` | `<MemorialProfile />` | Individual memorial site (e.g., `/baljit`) reusing the robust memorial template. |

---

## 🛠 Tech Stack

* **Core:** React 19 (Vite), React Router 7
* **Styling:** Styled Components (Themed per family)
* **Infrastructure:** Vercel (Wildcard Subdomains), Namecheap (Custom Nameservers)
* **Media:** Cloudinary (Video Hosting/Optimization), Sharp (Thumbnail Generation)
* **Data:** JSON-based flat files (Decoupled from code)

---

## 📂 Project Structure

The project has moved from a flat structure to a domain-driven layout to support multiple templates.

```text
src/
  ├── components/              # 🧩 SHARED COMPONENTS
  │   ├── Skeletons/           # Loading skeleton components
  │   │   ├── ProfileSkeleton.jsx
  │   │   ├── MemoriesSkeleton.jsx
  │   │   ├── GallerySkeleton.jsx
  │   │   └── FamilyHeroSkeleton.jsx
  │   ├── Navbar.jsx           # Context-aware navigation with breadcrumbs
  │   ├── Layout.jsx           # Global layout wrapper
  │   ├── Lightbox.jsx         # Image/video lightbox modal
  │   └── NavigationLoader.jsx # Route transition overlay
  │
  ├── templates/               # 🏭 PAGE TEMPLATES
  │   ├── GlobalTree/          # Root landing page (apna.family)
  │   │   └── LandingPage.jsx
  │   ├── FamilyPortal/        # Family landing pages
  │   │   ├── FamilyPage.jsx
  │   │   └── FamilyHero.jsx
  │   ├── MemorialProfile/     # Individual memorial pages
  │   │   ├── MemorialPage.jsx # Wrapper with PersonContext
  │   │   ├── ProfilePage.jsx  # Main page composition
  │   │   ├── Profile.jsx      # Profile section (was Hero)
  │   │   ├── VideoSection.jsx # Memories section (videos + stories)
  │   │   ├── Gallery.jsx      # Photo gallery
  │   │   ├── Events.jsx       # Event details (optional)
  │   │   ├── Stories.jsx      # Stories section (merged into Memories)
  │   │   └── Hero.jsx         # Legacy (replaced by Profile)
  │   └── VideoVault/          # Home videos page
  │       ├── VideoVaultPage.jsx
  │       └── VideoGrid.jsx
  │
  ├── contexts/                # 🔄 REACT CONTEXTS
  │   ├── FamilyContext.jsx    # Family data & theme
  │   └── PersonContext.jsx    # Person/memorial data
  │
  ├── data/                    # 🧠 DATA FILES
  │   ├── families/            # Family configuration (theme, displayName)
  │   │   ├── grewal.json
  │   │   └── wong.json
  │   ├── people/              # Full memorial profiles (heavy content)
  │   │   ├── grewal-baljit.json
  │   │   └── wong-jane.json
  │   └── tree.json            # Master directory (lightweight structure)
  │                            # Contains all people, relationships, basic info
  │                            # People with hasFullProfile: true have detailed memorials
  │
  ├── utils/                   # 🛠 UTILITY FUNCTIONS
  │   ├── subdomain.js         # Subdomain parsing logic
  │   ├── dataLoader.js        # Dynamic JSON data loading
  │   ├── loadingDelay.js     # Minimum loading delay utility
  │   ├── treeLoader.js        # tree.json loading & querying
  │   ├── treeUtils.js         # ID conversion (tree.json ↔ file system)
  │   └── csvParser.js         # Gallery CSV parsing
  │
  ├── styles/                  # 🎨 STYLING
  │   ├── theme.js             # Theme configuration
  │   └── GlobalStyles.js      # Global CSS styles
  │
  ├── custom/                  # 🎨 CUSTOM OVERRIDES
  │   └── README.md            # Documentation for custom pages
  │
  ├── overrideRegistry.js      # Custom page override mapping
  ├── App.jsx                  # 🚦 Traffic Controller (routing)
  ├── main.jsx                 # React entry point
  ├── index.css                # Base CSS
  └── constants.js             # ⚠️ DEPRECATED (data moved to JSON)

public/
  ├── images/
  │   ├── grewal/              # Grewal family media
  │   │   ├── gallery.csv      # Gallery metadata
  │   │   ├── images.json      # Generated gallery index
  │   │   ├── thumbnails/      # Generated thumbnails
  │   │   └── program/         # Event programs
  │   └── wong/                # Wong family media
  └── portrait.png             # Default portrait (legacy)

```

---

## 🚀 Getting Started

### 1. Installation

```bash
npm install

```

### 2. Environment Setup

Create a `.env` file for Cloudinary (required for video hosting and gallery scripts):

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

```

### 3. Run Development Server

```bash
npm run dev

```

> **Note on Localhost:** Subdomains don't work natively on `localhost`.
> To test `grewal.apna.family` locally, you may need to edit your `/etc/hosts` file or manually hardcode the `subdomain` variable in `App.jsx` during testing.

---

## ⚙️ Configuration Guide

### Adding a New Family (`grewal`)

1. **Add people to `tree.json`** with the new `familyId` (e.g., `"grewal"`). The family will be automatically discovered from `tree.json`.
2. **Optional:** Create `src/data/families/grewal.json` to customize:
   - Family display name
   - Theme colors
   - Home videos password
   - Description
3. Create a folder `public/images/grewal/` for their assets.
4. **Important:** If you create a new `families/{familyId}.json` file, you must **rebuild the app** (`npm run build`) for it to be discovered. The app uses Vite's `import.meta.glob` which is evaluated at build time. However, families will still appear on the root landing page even without a config file (with a default display name).

### Adding a New Person

**Option 1: Minimal Profile (from tree.json)**
1. Add person entry to `src/data/tree.json` with:
   - `id`: `"{personId}_{familyId}"` (e.g., `"sukhman_grewal"`)
   - `firstName`, `lastName`, and other basic info
   - `hasFullProfile: false` (or omit - defaults to false)
   - `familyId`: `"grewal"` (optional, can be derived from ID)
2. Person will be **immediately available** at `grewal.apna.family/sukhman` (no rebuild needed)
3. Profile will show basic info from tree.json (name, dates, relationships)
4. **No rebuild required** - `tree.json` changes are picked up immediately

**Option 2: Full Memorial Profile**
1. Add person entry to `src/data/tree.json` with `hasFullProfile: true`
2. Create `src/data/people/grewal-{personId}.json` (e.g., `grewal-baljit.json`)
3. Fill in the full structure:
   - `memorialData`: Name, dates, bio, portrait image
   - `eventData`: Funeral service details, YouTube video IDs
   - `homeVideos`: Array of home video objects
4. **Important:** You must **rebuild the app** (`npm run build`) for the person JSON file to be discovered. The app uses Vite's `import.meta.glob` which is evaluated at build time. However, the person will still be accessible with a minimal profile from `tree.json` until the rebuild completes.

**ID Format Conversion:**
- tree.json uses: `"baljit_grewal"` (personId_familyId)
- File system uses: `"grewal-baljit.json"` (familyId-personId)
- The system automatically converts between formats

**Build Requirements:**
- **`tree.json` changes:** No rebuild needed - changes are picked up immediately
- **New `families/{id}.json` files:** Rebuild required (`npm run build`)
- **New `people/{familyId}-{personId}.json` files:** Rebuild required (`npm run build`)
- **Note:** The app gracefully handles missing files - families get default names, people get minimal profiles from `tree.json`

**Example tree.json Entry:**
```json
{
  "id": "baljit_grewal",
  "firstName": "Baljit",
  "lastName": "Grewal",
  "familyId": "grewal",
  "hasFullProfile": true,
  "dob": "1953-01-01",
  "dod": "2026-01-16",
  "isDeceased": true,
  "parents": ["ranjit_singh_grewal", "kulwant_kaur"],
  "children": ["sukhman_grewal", "varinder_grewal", "vanita_grewal"]
}
```

---

## 📸 Media & Gallery Workflow

We use a **Hybrid Media System**:

* **Photos:** Stored locally in `public/images/{family}/` (for speed/simplicity) OR Cloudinary.
* **Videos:** Hosted on **Cloudinary** (to keep repo light and save bandwidth).
* **Optimization:** The app requests specific Cloudinary transformations (480p for grid, 4k for lightbox).

### Gallery Structure & Person-Specific Images

The gallery system supports **both family-level and person-specific images**:

**Gallery CSV Format:**
```csv
filename,type,alt,category,year,date,tags,default_sort,personId
image1.jpg,image,Description,,,,,1,baljit
image2.jpg,image,Description,,,,,2,
video1.mp4,video,Description,,,,,3,sukhman
```

- **`personId` column (optional):** Associates images with specific people
- **Empty `personId`:** Image is family-level (shown on all person pages)
- **With `personId`:** Image only shown on that person's profile

**Gallery Display Logic:**
- **Family page:** Shows all images (family-level + all person-specific)
- **Person page:** Shows person-specific images + family-level images (shared gallery)

### The "Sync" Workflow

Each family has its own gallery. To update the media for a family:

1. **Drop Files:** Put photos in `public/images/{family}/`.
2. **Upload Videos:** Upload MP4s to Cloudinary (tag them with the family name if needed).
3. **Run the Master Script:**
```bash
npm run sync-gallery --family=grewal
```

**What the script does:**

1. **Scans:** Looks at `public/images/grewal/` and your Cloudinary account.
2. **Updates CSV:** Syncs `public/images/grewal/gallery.csv` with new items.
3. **Generates Thumbnails:** Creates efficient JPEGs for local images.
4. **Updates JSON:** Writes `images.json` for the frontend to read.

**To Associate Images with Specific People:**

1. Edit `public/images/{family}/gallery.csv` manually
2. Add `personId` column if it doesn't exist: `filename,type,alt,category,year,date,tags,default_sort,personId`
3. Set `personId` value for person-specific images (e.g., `baljit`, `sukhman`)
4. Leave `personId` empty for family-level images (shown on all profiles)
5. Re-run: `npm run sync-images-json-from-csv --family=grewal`

**Example gallery.csv with personId:**
```csv
filename,type,alt,category,year,date,tags,default_sort,personId
baljit_portrait.jpg,image,Baljit Portrait,,,,,1,baljit
family_photo.jpg,image,Family Photo,,,,,2,
sukhman_wedding.jpg,image,Sukhman Wedding,,,,,3,sukhman
```

**Gallery Display Rules:**
- **Family page (`grewal.apna.family/`):** Shows ALL images (family + all person-specific)
- **Person page (`grewal.apna.family/baljit`):** Shows person-specific images + family-level images
- **Empty personId:** Image is shared across all profiles in the family

---

## 🌐 Deployment & DNS

### Infrastructure

* **Host:** Vercel (Hobby Tier).
* **DNS Provider:** Namecheap.
* **Routing:** Wildcard CNAME.

### DNS Configuration (Namecheap)

The domain uses **Custom Nameservers** to give Vercel full control over subdomains.

* **Nameserver 1:** `ns1.vercel-dns.com`
* **Nameserver 2:** `ns2.vercel-dns.com`

### Vercel Configuration

* **Root Domain:** `apna.family`
* **Wildcard Domain:** `*.apna.family` added in Settings → Domains.
* **Framework:** Vite.
* **Build Command:** `npm run build`
* **Output Directory:** `dist`

---

## 📜 Scripts Reference

| Script | Command | Purpose |
| --- | --- | --- |
| **dev** | `npm run dev` | Start local server. |
| **build** | `npm run build` | Production build. |
| **sync-gallery** | `npm run sync-gallery` | **Master Script:** Syncs CSV, Cloudinary, and Thumbnails. |
| **sort-gallery** | `npm run sort-gallery-csv` | Prioritizes videos (slots 1–150) and randomizes images. |
| **gen-thumbs** | `npm run generate-thumbnails` | Manually regenerates local thumbnails using `sharp`. |

---

## 🛠 Utility Files (`src/utils/`)

### `subdomain.js`
**Purpose:** Parses hostname to extract family ID and determine routing context.

**Functions:**
- `parseSubdomain(hostname)` - Extracts family ID from hostname (e.g., "grewal.apna.family" → "grewal")
- `getFamilyId()` - Gets current family ID from window location
- `isRootDomain()` - Checks if currently on root domain (apna.family)

**Usage:** Used by `App.jsx` to determine which family subdomain the user is visiting and route accordingly.

---

### `dataLoader.js`
**Purpose:** Dynamic loading of JSON data files using Vite's `import.meta.glob` for code splitting.

**Functions:**
- `loadFamilyData(familyId)` - Loads family configuration from `src/data/families/{familyId}.json`
- `loadPersonData(familyId, personId)` - Loads person memorial data from `src/data/people/{familyId}-{personId}.json`

**Usage:** Used by contexts (`FamilyContext`, `PersonContext`) to load data on-demand. Files are loaded lazily to keep initial bundle size small.

**Important:** `import.meta.glob` is evaluated at **build time**, not runtime. This means:
- New `families/*.json` or `people/*.json` files added after build won't be discovered until you rebuild
- In development mode, Vite may hot-reload new files, but production builds require a full rebuild
- The app gracefully handles missing files (families get defaults, people fall back to `tree.json` minimal profiles)

---

### `loadingDelay.js`
**Purpose:** Ensures minimum loading time to allow skeleton animations to be visible, improving perceived performance.

**Functions:**
- `withMinimumDelay(dataPromise, minDelayMs)` - Wraps a data promise to ensure minimum delay (default 1000ms)
- `createDelay(delayMs)` - Creates a simple delay promise

**Usage:** Used throughout the app to prevent jarring content flashes when data loads instantly. Ensures skeleton loaders are visible for at least 1 second.

---

### `treeLoader.js`
**Purpose:** Loads and queries the master `tree.json` directory of all people in the network.

**Functions:**
- `loadTreeData()` - Loads tree.json with caching
- `getPersonFromTree(treeId)` - Gets person by tree ID (e.g., "baljit_grewal")
- `getPersonFromTreeByIds(familyId, personId)` - Gets person by family and person IDs
- `getFamilyPeopleFromTree(familyId)` - Gets all people for a specific family
- `getPeopleWithFullProfiles(familyId)` - Gets people with full memorial profiles
- `getAllFamilyIdsFromTree()` - Gets all unique family IDs
- `clearTreeCache()` - Clears cache (for development)

**Usage:** Used by `GlobalTree` landing page and family portals to display family trees and navigate to profiles.

---

### `treeUtils.js`
**Purpose:** Converts between tree.json ID format and file system format.

**Functions:**
- `parseTreeId(treeId)` - Converts "baljit_grewal" → `{familyId: "grewal", personId: "baljit"}`
- `buildTreeId(familyId, personId)` - Converts `{familyId: "grewal", personId: "baljit"}` → "baljit_grewal"
- `getPersonFilePath(treeId)` - Converts tree ID to file path "grewal-baljit.json"
- `getPersonFilePathFromIds(familyId, personId)` - Builds file path from IDs
- `getFamilyIdFromPerson(personEntry)` - Extracts family ID from person entry

**Usage:** Handles ID format conversion between:
- **tree.json format:** `"baljit_grewal"` (personId_familyId)
- **File system format:** `"grewal-baljit.json"` (familyId-personId)
- **URL format:** `grewal.apna.family/baljit` (personId only)

---

### `csvParser.js`
**Purpose:** Parses gallery CSV files with support for quoted fields and special characters.

**Functions:**
- `parseGalleryCSV(csvText)` - Parses CSV text into array of gallery items

**Features:**
- Handles quoted fields with commas
- Normalizes data structure (filename, url, thumbnail, type, alt, etc.)
- Supports `personId` column for person-specific images
- Handles both local files and Cloudinary URLs

**Usage:** Used by `Gallery.jsx` component to parse `public/images/{family}/gallery.csv` and display images/videos.

---

## 📜 Script Files (`scripts/`)

### `cloudinary-config.js`
**Purpose:** Centralized Cloudinary API configuration and validation.

**Exports:**
- `cloudinaryConfig` - Configuration object with credentials from environment variables
- `validateCloudinaryConfig()` - Validates that all required credentials are present

**Usage:** Imported by all scripts that interact with Cloudinary API. Loads credentials from `.env` file or environment variables.

---

### `fetch-cloudinary-images.js`
**Purpose:** Queries Cloudinary account to fetch all image resources.

**Function:**
- `fetchCloudinaryImages()` - Returns array of all images with URLs, public IDs, and metadata

**Usage:** Used by `update-gallery-csv.js` to discover images uploaded to Cloudinary and add them to the gallery CSV.

---

### `fetch-cloudinary-videos.js`
**Purpose:** Queries Cloudinary account to fetch all video resources.

**Function:**
- `fetchCloudinaryVideos()` - Returns array of all videos with URLs, public IDs, and metadata

**Usage:** Used by `update-gallery-csv.js` to discover videos uploaded to Cloudinary and add them to the gallery CSV.

---

### `generate-thumbnails.js`
**Purpose:** Generates optimized JPEG thumbnails for all local images using Sharp.

**Features:**
- Processes images in `public/images/{family}/`
- Saves thumbnails to `public/images/{family}/thumbnails/`
- Removes orphaned thumbnails for deleted images
- Skips existing thumbnails that are newer than source
- Converts all thumbnails to JPEG for consistency (400px width, 80% quality)

**Usage:** Run manually with `npm run generate-thumbnails --family=grewal` or automatically via `sync-gallery.js`. Thumbnails are used in gallery grid view for faster loading.

---

### `randomize-sort-order.js`
**Purpose:** Randomly assigns `default_sort` values to gallery entries.

**Strategy:**
- Videos: Assigned to positions 1-120 (randomized)
- Images: Assigned random values 1-10000

**Usage:** Legacy script for randomizing gallery order. Prefer `sort-gallery-csv.js` for video-priority sorting.

---

### `sort-gallery-csv.js`
**Purpose:** Sorts gallery CSV with video priority - ensures videos appear in first 150 positions.

**Strategy:**
- Videos: Randomly assigned to positions 1-150
- Images: Fill remaining positions 1-150, then positions 151+
- Preserves existing sort order within each group when possible

**Usage:** Run with `npm run sort-gallery-csv --family=grewal` to prioritize videos in gallery display. Ensures videos are prominently featured.

---

### `sync-gallery.js`
**Purpose:** Master script that orchestrates the complete gallery sync workflow.

**Workflow:**
1. Updates `gallery.csv` (adds new files, removes deleted)
2. Generates thumbnails for new local images
3. Syncs `images.json` from `gallery.csv` (preserves sort order)

**Usage:** Run with `npm run sync-gallery --family=grewal` after adding/removing media files. This is the recommended way to update galleries.

---

### `sync-images-json-from-csv.js`
**Purpose:** Updates `images.json` to match files and order from `gallery.csv`.

**Features:**
- Reads `gallery.csv` and extracts filenames
- Sorts by `default_sort` value (ascending)
- Writes ordered array to `images.json`

**Usage:** Run manually or automatically via `sync-gallery.js`. Ensures `images.json` stays in sync with CSV metadata.

---

### `update-gallery-csv.js`
**Purpose:** Syncs `gallery.csv` with actual files (local and Cloudinary).

**Operations:**
- **Removes:** Entries for files that no longer exist (local or Cloudinary)
- **Adds:** New files from local folder and Cloudinary API
- **Preserves:** Existing metadata (alt text, tags, personId, etc.)
- **Sets:** `default_sort` to 10000 for new entries

**Features:**
- Scans `public/images/{family}/` for local files
- Fetches Cloudinary videos and images via API
- Handles both local files and Cloudinary URLs
- Supports `personId` column for person-specific images

**Usage:** Run manually with `npm run update-gallery-csv --family=grewal` or automatically via `sync-gallery.js`.

---

### `update-gallery.js`
**Purpose:** Legacy script that scans images folder and updates `images.json`.

**Note:** This script is outdated and doesn't support the family-based structure or CSV metadata. Use `sync-gallery.js` instead.

---

### `upload-to-cdn.js`
**Purpose:** Legacy script that uploads local images to Cloudinary CDN.

**Note:** This script is outdated and hardcoded for a specific folder structure. For new uploads, use Cloudinary dashboard or API directly, then run `update-gallery-csv.js` to sync.

---

## 🎨 Accessibility & Design System

* **Elder-Friendly:** High contrast, large touch targets, no "disappearing" modals.
* **Performance:**
* **Lazy Loading:** Images load 50px before entering viewport.
* **Video Cap:** Grid videos are capped at 480p/Economy quality via Cloudinary URL transforms to save user data plans (1GB -> 60MB).
* **Smart Playback:** Videos pause automatically when scrolled out of view.

---

## 🌳 Tree.json Architecture

The application uses a **three-tier data architecture** for scalability:

### 1. `tree.json` (Master Directory)
**Purpose:** Lightweight master directory of all people in the network
- Contains: Basic info (name, dates, relationships), family connections
- **Does NOT contain:** Heavy content (bios, videos, event details)
- **Size:** ~100KB for 100+ people (vs 5MB+ if merged)
- **Load time:** ~100ms (vs 3+ seconds if merged)

**Structure:**
```json
{
  "people": [
    {
      "id": "baljit_grewal",
      "firstName": "Baljit",
      "lastName": "Grewal",
      "familyId": "grewal",
      "hasFullProfile": true,
      "dob": "1953-01-01",
      "dod": "2026-01-16",
      "isDeceased": true,
      "parents": [...],
      "children": [...]
    }
  ]
}
```

**Key Fields:**
- `hasFullProfile: true` - Indicates detailed memorial exists in `people/` folder
- `familyId` - Family subdomain (can be derived from ID if omitted)
- `id` - Format: `"{personId}_{familyId}"` (e.g., `"baljit_grewal"`)

### 2. `families/{id}.json` (Theme Engine)
**Purpose:** Family-level configuration
- Theme colors, display name, description
- Home videos password
- Lightweight (~1KB per family)

### 3. `people/{familyId}-{personId}.json` (Heavy Content)
**Purpose:** Detailed memorial profiles (only for people with `hasFullProfile: true`)
- Memorial data (bio, welcome message, portrait)
- Event data (funeral service, YouTube videos)
- Home videos array
- **Only loaded when user visits that person's page**

### ID Format Conversion

The system automatically converts between formats:
- **tree.json:** `"baljit_grewal"` (personId_familyId)
- **File system:** `"grewal-baljit.json"` (familyId-personId)
- **URL routing:** `grewal.apna.family/baljit` (uses personId only)

**Utilities:**
- `parseTreeId("baljit_grewal")` → `{familyId: "grewal", personId: "baljit"}`
- `buildTreeId("grewal", "baljit")` → `"baljit_grewal"`
- `getPersonFilePath("baljit_grewal")` → `"grewal-baljit.json"`

### Profile Types

**Minimal Profile (from tree.json):**
- Shows basic info: name, dates, relationships
- No videos, events, or detailed bio
- Automatically generated for all people in tree.json
- Fast to load, works for everyone

**Full Memorial Profile (from people/ file):**
- Rich content: bio, videos, event details
- Only created for people with `hasFullProfile: true`
- Loaded on-demand when visiting their page

---

## 🔄 Loading States & User Experience

The application uses a **hybrid loading pattern** to provide smooth transitions and prevent content flashes:

### Loading Strategy

1. **Skeleton Loaders** (Content Loading)
   - Used when data is being fetched (family data, person data, etc.)
   - Skeleton components match the final layout structure
   - Located in `src/components/Skeletons/`
   - Provides visual feedback and prevents layout shifts

2. **Navigation Overlay** (Route Transitions)
   - Light blur overlay during route changes
   - Prevents FOUC (Flash of Unstyled Content)
   - Located in `src/components/NavigationLoader.jsx`
   - Only shows during actual navigation (not initial load)

### Minimum Loading Delay

All data loading operations use the `withMinimumDelay` utility to ensure animations are visible:

```javascript
import { withMinimumDelay } from '../utils/loadingDelay'

// Ensures minimum 1 second delay for smooth animations
withMinimumDelay(loadFamilyData(familyId), 1000)
  .then(data => {
    setFamilyData(data)
    setLoading(false)
  })
```

**Why?** Even when data loads instantly, the minimum delay allows:
- Skeleton animations to be visible
- Smooth fade transitions
- Better perceived performance
- No jarring content flashes

### Implementation Standards

**Always use `withMinimumDelay` for:**
- Context data loading (`FamilyContext`, `PersonContext`)
- Component-level data fetching
- Any async operation that shows loading state

**Skeleton Components:**
- Must match the final component layout
- Use shimmer animation for visual feedback
- Located in `src/components/Skeletons/`
- Named: `{ComponentName}Skeleton.jsx`

**Navigation Loader:**
- Automatically handles route transitions
- No manual implementation needed
- Integrated at the root level in `App.jsx`

**Breadcrumb Loading States:**
- Navbar breadcrumbs show skeleton shimmer text while data loads
- Family name shows skeleton when `FamilyContext.loading === true`
- Person name shows skeleton when `PersonContext.loading === true`
- Provides visual feedback during navigation transitions
- Example: `Home > [skeleton]` while family data loads, then `Home > The Grewals`

---

## 📐 Development Standards

### Component Structure

1. **Templates** (`src/templates/`)
   - Page-level components that compose smaller pieces
   - Use Context hooks for data (no prop drilling)
   - Handle loading states with skeletons

2. **Components** (`src/components/`)
   - Reusable UI elements
   - Context-aware when needed (e.g., `Navbar`)
   - Styled with Styled Components

3. **Contexts** (`src/contexts/`)
   - Provide data to components
   - Always include `loading` and `error` states
   - Use `withMinimumDelay` for data fetching

### Data Loading Pattern

```javascript
// ✅ CORRECT: Use withMinimumDelay
useEffect(() => {
  withMinimumDelay(loadData(id), 1000)
    .then(data => {
      setData(data)
      setLoading(false)
    })
}, [id])

// ❌ INCORRECT: Direct loading without delay
useEffect(() => {
  loadData(id)
    .then(data => {
      setData(data)
      setLoading(false)
    })
}, [id])
```

### Loading State Pattern

```javascript
// ✅ CORRECT: Show skeleton while loading
const { loading, data } = useContext()

if (loading) {
  return <ComponentSkeleton />
}

return <Component data={data} />
```

### Styling Standards

- **Styled Components** for all styling
- **Theme-based** colors (family-specific themes)
- **Mobile-first** responsive design
- **Elder-friendly** touch targets (minimum 44px)
- **Consistent spacing** using theme values
- **Shimmer animations** for skeleton loaders (2s infinite)

### File Naming

- **Components:** PascalCase (`Profile.jsx`)
- **Skeletons:** PascalCase with "Skeleton" suffix (`ProfileSkeleton.jsx`)
- **Utils:** camelCase (`loadingDelay.js`, `dataLoader.js`)
- **Contexts:** PascalCase with "Context" suffix (`FamilyContext.jsx`)
- **Templates:** PascalCase (`FamilyPage.jsx`, `ProfilePage.jsx`)

### Navigation Structure

The Navbar component (`src/components/Navbar.jsx`) provides:
- **Breadcrumb navigation** with skeleton loading states
- **Section navigation** (Profile, Memories, Gallery) on person pages
- **Context-aware** rendering based on current route and data availability
- **Fixed positioning** for consistent visibility

**Breadcrumb Examples:**
- Root: No breadcrumbs (just navbar)
- Family page: `Home > The Grewals` (skeleton while loading)
- Person page: `Home > The Grewals > Baljit Singh Grewal` (skeleton for person name while loading)
- Home Videos: `Home > The Grewals > Home Videos`

---

## 📊 Data Architecture Summary

### Three-Tier System

1. **tree.json** (Master Directory - ~100KB)
   - All people in the network
   - Relationships and basic info
   - Fast to load (~100ms)
   - Source of truth for who exists

2. **families/{id}.json** (Theme Engine - ~1KB each)
   - Family-level configuration
   - Theme colors, display names
   - Lightweight per family

3. **people/{familyId}-{personId}.json** (Heavy Content - ~10-50KB each)
   - Only for people with `hasFullProfile: true`
   - Loaded on-demand when visiting their page
   - Contains: bio, videos, events

### Benefits

- **Scalability:** Tree loads instantly even with 500+ people
- **Flexibility:** Minimal profiles for everyone, full memorials for select people
- **Performance:** Only load heavy content when needed
- **Maintainability:** Clear separation of concerns

### Gallery System

- **Family-level gallery:** `public/images/{family}/gallery.csv`
- **Person-specific images:** Add `personId` column to CSV
- **Shared images:** Leave `personId` empty (shown on all profiles)
- **Filtering:** Gallery component automatically filters by personId on person pages
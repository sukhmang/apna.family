Here is the fully updated **README.md** for the **Apna Family Network**.

This document serves as both your **technical documentation** and your **architectural blueprint**. It details how the single-site code has been transformed into a multi-tenant family platform, how the wildcard routing works, and how to manage data for different families (Grewals, Wongs, etc.) while keeping the media pipeline robust.

---

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
  │   ├── families/            # Family configuration
  │   │   ├── grewal.json
  │   │   └── wong.json
  │   ├── people/              # Person memorial data
  │   │   ├── grewal-baljit.json
  │   │   └── wong-jane.json
  │   └── tree.json            # Family tree data
  │
  ├── utils/                   # 🛠 UTILITY FUNCTIONS
  │   ├── subdomain.js         # Subdomain parsing logic
  │   ├── dataLoader.js        # Dynamic JSON data loading
  │   ├── loadingDelay.js     # Minimum loading delay utility
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

1. Create `src/data/families/grewal.json`.
2. Define the family name, primary theme color, and home video password.
3. Create a folder `public/images/grewal/` for their assets.

### Adding a New Person (`baljit`)

1. Create `src/data/people/grewal-baljit.json`.
2. Fill in the `MEMORIAL_DATA` structure (Name, Dates, Bio).
3. The app will automatically serve this at `grewal.apna.family/baljit`.

---

## 📸 Media & Gallery Workflow

We use a **Hybrid Media System**:

* **Photos:** Stored locally in `public/images/{family}/` (for speed/simplicity) OR Cloudinary.
* **Videos:** Hosted on **Cloudinary** (to keep repo light and save bandwidth).
* **Optimization:** The app requests specific Cloudinary transformations (480p for grid, 4k for lightbox).

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

## 🎨 Accessibility & Design System

* **Elder-Friendly:** High contrast, large touch targets, no "disappearing" modals.
* **Performance:**
* **Lazy Loading:** Images load 50px before entering viewport.
* **Video Cap:** Grid videos are capped at 480p/Economy quality via Cloudinary URL transforms to save user data plans (1GB -> 60MB).
* **Smart Playback:** Videos pause automatically when scrolled out of view.

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
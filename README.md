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
  ├── components/              # 🧩 SHARED ATOMS
  │   ├── ui/                  # Buttons, Loaders, Modals, Icons
  │   ├── Navbar.jsx           # Context-aware navigation (changes based on subdomain)
  │   └── Layout.jsx           # Global layout wrapper
  │
  ├── templates/               # 🏭 PAGE ENGINES
  │   ├── GlobalTree/          # Logic for the main apna.family tree
  │   ├── FamilyPortal/        # Logic for family landing pages
  │   ├── MemorialProfile/     # The "Baljit" site template (Hero, Gallery, Events)
  │   └── VideoVault/          # The "HomeVideos" grid template
  │
  ├── data/                    # 🧠 THE DATABASE
  │   ├── families/            # Family configuration (theme colors, passwords)
  │   │   ├── grewal.json
  │   │   └── wong.json
  │   └── people/              # Individual profile data (extracted from constants.js)
  │       ├── grewal-baljit.json
  │       └── wong-jane.json
  │
  ├── utils/
  │   ├── subdomain.js         # Logic to parse "grewal.apna.family"
  │   └── mediaUtils.js        # Cloudinary URL optimization helpers
  │
  └── App.jsx                  # 🚦 Traffic Controller (Routes based on window.location)

public/
  ├── images/
  │   ├── grewal/              # Media isolated by family
  │   │   ├── gallery.csv      # Family-specific metadata
  │   │   └── images.json      # Generated file
  │   └── wong/                # Wong family media

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
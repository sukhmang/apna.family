src/
  ├── components/              # 🧩 SHARED ATOMS (Used across all sites)
  │   ├── ui/                  # Generic UI (Buttons, Icons, Loaders)
  │   ├── Layout.jsx           # Generic Layout wrapper
  │   └── Navbar.jsx           # Smart Navbar (adapts links based on subdomain)
  │
  ├── templates/               # 🏗️ THE PAGE TYPES (The "Engines")
  │   ├── GlobalTree/          # 🌳 For "apna.family" (Root)
  │   │   ├── LandingPage.jsx  # The main entry for the whole network
  │   │   └── NetworkTree.jsx  # D3/Canvas interactive tree
  │   │
  │   ├── FamilyPortal/        # 🏠 For "grewal.apna.family" (Family Home)
  │   │   ├── FamilyHero.jsx
  │   │   └── FamilyTree.jsx   # Tree filtered to just this family
  │   │
  │   ├── MemorialProfile/     # 👤 For "grewal.../baljit" (The Dad Site)
  │   │   ├── Hero.jsx         # (Refactored from your current Hero.jsx)
  │   │   ├── Gallery.jsx      # (Refactored from your current Gallery.jsx)
  │   │   ├── Events.jsx       # (Refactored from EventDetailsCard.jsx)
  │   │   └── ProfilePage.jsx  # The specific layout for a person
  │   │
  │   └── VideoVault/          # 🎬 For "grewal.../homevideos"
  │       └── VideoGrid.jsx    # (Refactored from your HomeVideos.jsx)
  │
  ├── data/                    # 🧠 THE DATABASE (JSON files)
  │   ├── families/            # Family-level settings (themes, video links)
  │   │   ├── grewal.json
  │   │   └── wong.json
  │   │
  │   └── people/              # Person-level content (bio, dates, gallery links)
  │       ├── grewal-baljit.json
  │       └── wong-jane.json
  │
  ├── utils/
  │   ├── subdomain.js         # 🧭 Logic to detect "grewal" vs "apna"
  │   └── dataLoader.js        # Helper to fetch the right JSON file
  │
  └── App.jsx                  # 🚦 THE TRAFFIC CONTROLLER (Routers)
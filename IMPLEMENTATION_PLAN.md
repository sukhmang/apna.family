# Implementation Plan: Single-Tenant to Multi-Tenant Migration

**Goal:** Refactor the Baljit Grewal memorial site into a scalable, multi-tenant family network (Apna Family) that supports multiple families via subdomains.

**Success Criteria:**
1. ✅ Root landing (`localhost:5173`) loads a generic "Family Tree Network" page with links to families
2. ✅ Family portal (`grewal.localhost:5173`) loads a specific landing page for that family
3. ✅ Person profile (`grewal.localhost:5173/baljit`) successfully migrates the existing Baljit site
4. ✅ Video vault (`grewal.localhost:5173/homevideos`) serves family-specific video data

---

## Milestone 1: Scaffolding & Data Extraction
**Goal:** Create the new folder structure and extract all hardcoded data from components into JSON files.

### Tasks:
1. **Create new directory structure:**
   - `src/data/families/` - Family-level configuration
   - `src/data/people/` - Person-level memorial data
   - `src/templates/` - Page template components
   - `src/templates/GlobalTree/` - Root landing page
   - `src/templates/FamilyPortal/` - Family landing pages
   - `src/templates/MemorialProfile/` - Memorial site template
   - `src/templates/VideoVault/` - Home videos template
   - `src/utils/` - Utility functions (if not exists)

2. **Extract data from `src/constants.js`:**
   - Create `src/data/people/grewal-baljit.json` with:
     - `MEMORIAL_DATA` structure (name, dates, portrait, welcome message)
     - `EVENT_DATA` structure (events, YouTube videos, program)
   - Create `src/data/families/grewal.json` with:
     - Family name, theme colors, home videos password (if needed)
     - Reference to home videos data
   - Move `HOME_VIDEOS` array to `src/data/people/grewal-baljit.json` (or family-level if shared)

3. **Create utility functions:**
   - `src/utils/subdomain.js` - Parse hostname to extract family/person IDs
   - `src/utils/dataLoader.js` - Load JSON data files dynamically

4. **Create placeholder templates:**
   - `src/templates/GlobalTree/LandingPage.jsx` - Simple placeholder
   - `src/templates/FamilyPortal/FamilyHero.jsx` - Simple placeholder
   - `src/templates/MemorialProfile/ProfilePage.jsx` - Simple placeholder
   - `src/templates/VideoVault/VideoGrid.jsx` - Simple placeholder

### Files to Create:
- `src/data/families/grewal.json`
- `src/data/people/grewal-baljit.json`
- `src/utils/subdomain.js`
- `src/utils/dataLoader.js`
- `src/templates/GlobalTree/LandingPage.jsx`
- `src/templates/FamilyPortal/FamilyHero.jsx`
- `src/templates/MemorialProfile/ProfilePage.jsx`
- `src/templates/VideoVault/VideoGrid.jsx`

### Files to Modify:
- `src/constants.js` - Keep for now (backward compatibility), mark as deprecated

### Validation:
- ✅ All data structures exist in JSON files
- ✅ Utility functions can parse subdomains correctly
- ✅ Placeholder templates render without errors

---

## Milestone 2: Subdomain Routing Logic
**Goal:** Implement the traffic controller in `App.jsx` that routes based on hostname, with support for custom page overrides.

### Tasks:
1. **Create override registry system:**
   - Create `src/custom/` folder structure for custom page overrides
   - Create `src/overrideRegistry.js` - Maps custom components for families and people
   - Structure: `src/custom/{familyId}/{ComponentName}.jsx`
   - Registry pattern: Check registry first, fall back to template if no override exists

2. **Update `App.jsx` routing logic:**
   - Detect root domain (`localhost:5173` or `apna.family`) → Show GlobalTree
   - Detect family subdomain (`grewal.localhost:5173` or `grewal.apna.family`) → Show FamilyPortal or MemorialProfile/VideoVault based on path
   - Parse hostname using `utils/subdomain.js`
   - **Override check pattern:**
     - For family pages: Check `OVERRIDES.families[familyId]` first
     - For person pages: Check `OVERRIDES.people[familyId]?.[personId]` first
     - Fall back to standard template if no override exists
   - Route structure:
     - `/` on root → `<GlobalTree />`
     - `/` on family subdomain → Check override → `<FamilyPortal />` or custom component
     - `/{personId}` on family subdomain → Check override → `<MemorialProfile personId={personId} />` or custom component
     - `/homevideos` on family subdomain → `<VideoVault />` (can add override support later if needed)

3. **Implement subdomain detection:**
   - Handle `localhost` subdomains (e.g., `grewal.localhost:5173`)
   - Handle production subdomains (e.g., `grewal.apna.family`)
   - Extract family ID from hostname
   - Extract person ID from URL path

4. **Create context/provider (MANDATORY):**
   - `src/contexts/FamilyContext.jsx` - Provides current family data to all components
     - Exports `useFamily()` hook for components to access family data (theme colors, family ID, etc.)
     - Prevents prop drilling through multiple component layers
   - `src/contexts/PersonContext.jsx` - Provides current person data to memorial pages
     - Exports `usePerson()` hook for components to access person data (memorial info, events, etc.)
   - Wrap appropriate routes with context providers in `App.jsx`

### Files to Create:
- `src/custom/` - Folder structure for custom overrides (empty initially)
- `src/overrideRegistry.js` - Registry mapping custom components
- `src/contexts/FamilyContext.jsx` (MANDATORY)
- `src/contexts/PersonContext.jsx` (MANDATORY)

### Files to Modify:
- `src/App.jsx` - Complete rewrite of routing logic with override checks
- `src/utils/subdomain.js` - Implement hostname parsing

### Validation:
- ✅ Root domain shows GlobalTree placeholder
- ✅ `grewal.localhost:5173` shows FamilyPortal placeholder (with FamilyContext provider)
- ✅ `grewal.localhost:5173/baljit` shows MemorialProfile placeholder (with both FamilyContext and PersonContext providers)
- ✅ `grewal.localhost:5173/homevideos` shows VideoVault placeholder (with FamilyContext provider)
- ✅ Context providers are correctly wrapped around routes in `App.jsx`
- ✅ Override registry exists and can be extended for custom pages

---

## Milestone 3: Component Refactoring to Templates
**Goal:** Move existing components into templates and make them data-driven (remove hardcoded constants).

### Tasks:
1. **Refactor MemorialProfile template:**
   - Move `src/components/Hero.jsx` → `src/templates/MemorialProfile/Hero.jsx`
     - Accept `personData` prop instead of importing `MEMORIAL_DATA`
   - Move `src/components/LivestreamCard.jsx` → `src/templates/MemorialProfile/VideoSection.jsx`
     - Accept `eventData` prop instead of importing `EVENT_DATA`
   - Move `src/components/EventDetailsCard.jsx` → `src/templates/MemorialProfile/Events.jsx`
     - Accept `eventData` prop
   - Move `src/components/StoriesCard.jsx` → `src/templates/MemorialProfile/Stories.jsx`
     - Accept `personData` prop (for email subject customization)
   - Move `src/components/Gallery.jsx` → `src/templates/MemorialProfile/Gallery.jsx`
     - Use `useFamily()` hook to get `familyId` and load family-specific `images.json`
   - Move `src/components/Lightbox.jsx` → `src/templates/MemorialProfile/Lightbox.jsx` (or keep in components if shared)
   - Create `src/templates/MemorialProfile/ProfilePage.jsx`:
     - Composes all above components
     - Loads person data via `dataLoader`
     - Wraps components with `PersonContext.Provider` to make data available via `usePerson()` hook
     - Child components use `usePerson()` instead of props

2. **Refactor VideoVault template:**
   - Move `src/components/HomeVideos.jsx` → `src/templates/VideoVault/VideoGrid.jsx`
     - Use `useFamily()` hook to get `familyId` and load family-specific home videos
     - Remove direct import of `HOME_VIDEOS` from constants

3. **Refactor shared components:**
   - `src/components/StickyNav.jsx` → `src/components/Navbar.jsx`
     - Make it context-aware (different links for root vs family vs person pages)
     - Use `useFamily()` and `usePerson()` hooks instead of props
     - Access family theme colors via context for styling
   - `src/components/Layout.jsx` - Keep as shared component (no changes needed)

4. **Update all component imports:**
   - Remove all `import { MEMORIAL_DATA, EVENT_DATA, HOME_VIDEOS } from '../constants'`
   - Replace with prop-based data passing

### Files to Create:
- `src/templates/MemorialProfile/ProfilePage.jsx`
- `src/templates/MemorialProfile/Hero.jsx` (moved from components)
- `src/templates/MemorialProfile/VideoSection.jsx` (moved from components)
- `src/templates/MemorialProfile/Events.jsx` (moved from components)
- `src/templates/MemorialProfile/Stories.jsx` (moved from components)
- `src/templates/MemorialProfile/Gallery.jsx` (moved from components)
- `src/templates/VideoVault/VideoGrid.jsx` (moved from components)

### Files to Modify:
- `src/components/Hero.jsx` - Remove, replaced by template version
- `src/components/LivestreamCard.jsx` - Remove, replaced by template version
- `src/components/EventDetailsCard.jsx` - Remove, replaced by template version
- `src/components/StoriesCard.jsx` - Remove, replaced by template version
- `src/components/Gallery.jsx` - Remove, replaced by template version
- `src/components/HomeVideos.jsx` - Remove, replaced by template version
- `src/components/StickyNav.jsx` - Refactor to `Navbar.jsx` with context awareness
- `src/components/Lightbox.jsx` - Update imports if moved

### Files to Delete (after migration):
- `src/components/Hero.jsx`
- `src/components/LivestreamCard.jsx`
- `src/components/EventDetailsCard.jsx`
- `src/components/StoriesCard.jsx`
- `src/components/Gallery.jsx`
- `src/components/HomeVideos.jsx`

### Validation:
- ✅ All components use context hooks instead of hardcoded constants
- ✅ Components use `useFamily()` and `usePerson()` hooks instead of prop drilling
- ✅ MemorialProfile template loads and displays Baljit's data correctly via context
- ✅ VideoVault template loads and displays home videos correctly via context
- ✅ Navigation works correctly on all page types and adapts based on context

---

## Milestone 4: Family-Specific Media & Script Updates
**Goal:** Reorganize media folders by family and update gallery sync scripts to support family-specific paths.

### Tasks:
1. **Reorganize media structure:**
   - Move `public/images/` → `public/images/grewal/` (for Grewal family)
   - Move `public/images/gallery.csv` → `public/images/grewal/gallery.csv`
   - Move `public/images/images.json` → `public/images/grewal/images.json`
   - Move `public/images/thumbnails/` → `public/images/grewal/thumbnails/`
   - Keep `public/images/program/` at root or move to `public/images/grewal/program/`
   - Keep `public/portrait.png` at root (or move to family-specific if needed)

2. **Update gallery sync scripts:**
   - Modify `scripts/sync-gallery.js`:
     - Accept `--family` parameter (e.g., `npm run sync-gallery --family=grewal`)
     - Default to `grewal` if not specified (for backward compatibility)
     - Update paths to use `public/images/{family}/`
   - Modify `scripts/update-gallery-csv.js`:
     - Accept family parameter
     - Scan `public/images/{family}/` instead of `public/images/`
   - Modify `scripts/generate-thumbnails.js`:
     - Accept family parameter
     - Generate thumbnails in `public/images/{family}/thumbnails/`
   - Modify `scripts/sync-images-json-from-csv.js`:
     - Accept family parameter
     - Write to `public/images/{family}/images.json`
   - Modify `scripts/sort-gallery-csv.js`:
     - Accept family parameter
     - Sort `public/images/{family}/gallery.csv`

3. **Update Gallery component:**
   - Modify `src/templates/MemorialProfile/Gallery.jsx`:
     - Use `useFamily()` hook to get `familyId`
     - Load `images.json` from `public/images/{familyId}/images.json`
     - Handle family-specific paths for thumbnails

4. **Update package.json scripts:**
   - Add family parameter support to all gallery scripts
   - Example: `"sync-gallery": "node scripts/sync-gallery.js"` → `"sync-gallery": "node scripts/sync-gallery.js --family=grewal"`

### Files to Modify:
- `scripts/sync-gallery.js`
- `scripts/update-gallery-csv.js`
- `scripts/generate-thumbnails.js`
- `scripts/sync-images-json-from-csv.js`
- `scripts/sort-gallery-csv.js`
- `src/templates/MemorialProfile/Gallery.jsx`
- `package.json` (update script commands)

### Files to Move:
- `public/images/` → `public/images/grewal/` (all contents)
- `public/images/gallery.csv` → `public/images/grewal/gallery.csv`
- `public/images/images.json` → `public/images/grewal/images.json`
- `public/images/thumbnails/` → `public/images/grewal/thumbnails/`

### Validation:
- ✅ Gallery sync scripts work with `--family=grewal` parameter
- ✅ Gallery component loads images from `public/images/grewal/images.json`
- ✅ Thumbnails load from family-specific paths
- ✅ All existing media files are accessible after reorganization

---

## Milestone 5: New Templates (GlobalTree & FamilyPortal)
**Goal:** Create the root landing page and family portal templates.

### Tasks:
1. **Create GlobalTree template:**
   - `src/templates/GlobalTree/LandingPage.jsx`:
     - Display "Apna Family Network" heading
     - List of available families (hardcoded for now: "Grewal", "Wong")
     - Links to family portals (e.g., `grewal.localhost:5173` or `grewal.apna.family`)
     - Simple, clean design matching the existing theme
   - Optional: `src/templates/GlobalTree/NetworkTree.jsx` - Interactive tree visualization (future enhancement)

2. **Create FamilyPortal template:**
   - `src/templates/FamilyPortal/FamilyHero.jsx`:
     - Display family name from `families/{familyId}.json`
     - Welcome message for the family
     - Links to family members (e.g., "View Baljit's Memorial" → `/baljit`)
     - Link to "Home Videos" → `/homevideos`
   - `src/templates/FamilyPortal/FamilyPage.jsx`:
     - Composes FamilyHero
     - Loads family data via `dataLoader`
     - Lists available people in this family (from `data/people/` folder)

3. **Update routing in App.jsx:**
   - Ensure GlobalTree renders on root domain
   - Ensure FamilyPortal renders on family subdomain root path

### Files to Create:
- `src/templates/GlobalTree/LandingPage.jsx`
- `src/templates/GlobalTree/NetworkTree.jsx` (optional, placeholder for future)
- `src/templates/FamilyPortal/FamilyHero.jsx`
- `src/templates/FamilyPortal/FamilyPage.jsx`

### Files to Modify:
- `src/App.jsx` - Ensure routing connects to new templates

### Validation:
- ✅ Root domain (`localhost:5173`) shows GlobalTree with family links
- ✅ Family subdomain root (`grewal.localhost:5173`) shows FamilyPortal
- ✅ FamilyPortal displays family name and links to person profiles
- ✅ Navigation works correctly between all pages

---

## Milestone 6: Testing & Final Migration
**Goal:** Test all routes, verify data migration, and ensure scripts work correctly.

### Tasks:
1. **Test all routes:**
   - ✅ Root: `localhost:5173` → GlobalTree
   - ✅ Family portal: `grewal.localhost:5173` → FamilyPortal
   - ✅ Person profile: `grewal.localhost:5173/baljit` → MemorialProfile (Baljit's site)
   - ✅ Video vault: `grewal.localhost:5173/homevideos` → VideoVault

2. **Verify data migration:**
   - ✅ All Baljit's data correctly loaded from `src/data/people/grewal-baljit.json`
   - ✅ Gallery loads from `public/images/grewal/images.json`
   - ✅ Home videos load from person/family JSON
   - ✅ Events display correctly
   - ✅ All images and videos render properly

3. **Test gallery scripts:**
   - ✅ `npm run sync-gallery --family=grewal` works
   - ✅ Thumbnails generate in correct location
   - ✅ CSV and JSON files update correctly

4. **Clean up:**
   - Remove or deprecate `src/constants.js` (or keep as fallback)
   - Remove old component files if not already deleted
   - Update README.md with new structure
   - Add comments/documentation to new templates

5. **Create sample data for second family (optional):**
   - `src/data/families/wong.json` - Sample Wong family config
   - `src/data/people/wong-jane.json` - Sample person data
   - `public/images/wong/` - Empty folder structure

### Files to Modify:
- `README.md` - Update with new architecture
- `src/constants.js` - Mark as deprecated or remove

### Files to Create (optional):
- `src/data/families/wong.json`
- `src/data/people/wong-jane.json`
- `public/images/wong/` (empty folder)

### Validation:
- ✅ All success criteria met:
  1. Root landing loads GlobalTree
  2. Family portal loads for Grewal
  3. Person profile (`/baljit`) works correctly
  4. Video vault (`/homevideos`) works correctly
- ✅ No console errors
- ✅ All images/videos load correctly
- ✅ Gallery sync scripts work
- ✅ Navigation works on all pages

---

## Post-Migration Checklist

After completing all milestones:

- [ ] Test in production-like environment (Vercel preview)
- [ ] Verify subdomain routing works in production
- [ ] Update DNS configuration documentation
- [ ] Create migration guide for adding new families
- [ ] Document how to add new people to existing families
- [ ] Test Cloudinary integration with family-specific folders
- [ ] Verify all scripts work with family parameters
- [ ] Update deployment documentation

---

## Notes & Considerations

1. **Custom Page Overrides:** The architecture supports custom pages that deviate from templates using the Override Registry pattern:
   - **Standard pages** use templates in `src/templates/`
   - **Custom pages** go in `src/custom/{familyId}/` and are registered in `src/overrideRegistry.js`
   - **Router logic** checks registry first, falls back to template if no override exists
   - **Examples:** `grewal.apna.family/vanita` can be fully custom, while `grewal.apna.family/baljit` uses the template. `wong.apna.family` can be custom, while `wong.apna.family/steve` uses the template.
   - This keeps templates clean and allows one-off customizations without affecting the core architecture.

2. **Context Providers (MANDATORY):** `FamilyContext` and `PersonContext` are required, not optional. They prevent prop drilling through multiple component layers (App → FamilyPortal → Layout → Navbar → etc.). Components like Navbar and Gallery can simply call `useFamily()` or `usePerson()` to access data without passing props through every layer. This makes the codebase much cleaner and more maintainable.

3. **Backward Compatibility:** Keep `src/constants.js` during migration for safety, remove after validation.

4. **Subdomain Testing:** The user mentioned their local environment supports subdomains natively. Use `window.location.hostname` directly without query parameter workarounds.

5. **Data Structure:** JSON files should match the existing `constants.js` structure exactly to minimize component changes.

6. **Media Migration:** Moving `public/images/` to `public/images/grewal/` is a breaking change. Ensure all references are updated.

7. **Script Compatibility:** Gallery scripts should default to `grewal` family if no parameter provided, ensuring existing workflows continue to work.

8. **Future Enhancements:** The GlobalTree can be enhanced with an interactive D3.js visualization later. For now, a simple list is sufficient.

---

## Estimated Timeline

- **Milestone 1:** 2-3 hours (scaffolding, data extraction)
- **Milestone 2:** 2-3 hours (routing logic + context providers)
- **Milestone 3:** 4-6 hours (component refactoring)
- **Milestone 4:** 2-3 hours (media reorganization, script updates)
- **Milestone 5:** 2-3 hours (new templates)
- **Milestone 6:** 2-3 hours (testing, cleanup)

**Total:** ~13-20 hours of development time

---

**Ready to begin?** Once you approve this plan, we'll start with Milestone 1: Scaffolding & Data Extraction.

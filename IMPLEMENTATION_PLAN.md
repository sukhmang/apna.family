# Family Tree Visualization Implementation Plan

## Overview

This document outlines the implementation plan for replacing the simple family list views with an interactive family tree visualization. The tree will support both a **visual tree view** and a **simple list view** (toggleable), and will work on both the main landing page (all families) and individual family pages.

---

## 1. Architecture & Technology Stack

### Core Library: React Flow
**Why React Flow:**
- Industry standard for interactive node-based UIs in React
- Excellent mobile touch support (pinch zoom, pan)
- Fully customizable nodes (we can build our own `<PersonNode />` component)
- Handles zooming, panning, and connecting lines automatically
- Free (MIT License)

### Supporting Libraries
- **`dagre`** or **`@elkjs/core` + `@elkjs/layout`**: Automatic tree layout engine
  - Calculates node positions so we don't have to manually set x/y coordinates
  - Handles hierarchical tree structures automatically
- **`graphlib`**: Path finding for relationship calculations
  - Finds shortest path between two people in the family graph
  - Essential for calculating relationships (e.g., "Me -> Father -> Sister = Aunt")

### Dependencies to Add
```json
{
  "reactflow": "^11.11.0",
  "dagre": "^0.8.5",
  "graphlib": "^2.1.9"
}
```

---

## 2. Component Structure

### New Components to Create

```
src/
├── components/
│   ├── FamilyTree/
│   │   ├── FamilyTreeViewer.jsx          # Main tree visualization component
│   │   ├── PersonNode.jsx                # Custom React Flow node component
│   │   ├── TreeControls.jsx              # View toggle, user selection, language toggle
│   │   ├── SimpleListView.jsx            # Fallback simple list view
│   │   └── TreeSkeleton.jsx               # Loading skeleton for tree
│   │
│   └── RelationshipEngine/
│       ├── relationshipCalculator.js     # Core relationship calculation logic
│       ├── pathFinder.js                 # Graph path finding utilities
│       └── relationshipLabels.js         # Indian/English label mappings
│
├── utils/
│   └── treeGraphBuilder.js               # Converts tree.json to React Flow graph format
```

---

## 3. Implementation Milestones

### Milestone 1: Foundation & Graph Building
**Goal:** Convert tree.json data into a graph structure that React Flow can render

**Tasks:**
1. Install dependencies (`reactflow`, `dagre`, `graphlib`)
2. Create `treeGraphBuilder.js` utility:
   - Converts `tree.json` people array into React Flow nodes and edges
   - Handles parent-child relationships
   - Handles partner/spouse relationships (horizontal connections)
   - Generates unique node IDs compatible with React Flow
3. Create basic `FamilyTreeViewer.jsx`:
   - Loads tree data
   - Converts to graph format
   - Renders with React Flow (basic nodes, no customization yet)
   - Implements dagre layout for automatic positioning
4. Test with single family (Grewal) first

**Files to Create:**
- `src/utils/treeGraphBuilder.js`
- `src/components/FamilyTree/FamilyTreeViewer.jsx`

**Files to Modify:**
- `package.json` (add dependencies)

---

### Milestone 2: Custom Person Node Component
**Goal:** Build beautiful, card-like nodes with images and overlays

**Tasks:**
1. Create `PersonNode.jsx` component:
   - Card-style design (image + overlay)
   - Displays: photo, name, dates (dob/dod), age/status
   - Shows "Deceased" badge if applicable
   - Clickable to navigate to person's profile page
   - Responsive sizing for mobile
2. Integrate with React Flow:
   - Register as custom node type
   - Pass person data as `data` prop
   - Handle node selection/highlighting
3. Load person images:
   - Try to load from person's profile data (portraitImage)
   - Fallback to default portrait
   - Handle missing images gracefully

**Files to Create:**
- `src/components/FamilyTree/PersonNode.jsx`

**Files to Modify:**
- `src/components/FamilyTree/FamilyTreeViewer.jsx`

---

### Milestone 3: Relationship Calculation Engine
**Goal:** Calculate and display relationship labels (Indian vs English)

**Tasks:**
1. Create `pathFinder.js`:
   - Uses `graphlib` to find shortest path between two people
   - Handles both parent-child and partner relationships
   - Returns path array (e.g., `['me', 'father', 'sister']`)
2. Create `relationshipCalculator.js`:
   - Takes root person and target person
   - Calculates path using pathFinder
   - Determines relationship based on path
   - Handles Indian relationship logic:
     - Checks paternal vs maternal side
     - Checks age (for Taiya vs Chacha)
     - Checks gender
     - Returns both English and Indian labels
3. Create `relationshipLabels.js`:
   - Mapping tables for all relationship types
   - Indian labels (Taiya, Chacha, Mama, Masi, Phua, etc.)
   - English labels (Uncle, Aunt, Cousin, etc.)
4. Integrate into PersonNode:
   - Add relationship badge/overlay
   - Only show if user has selected "Who am I?"
   - Update when language toggle changes

**Files to Create:**
- `src/components/RelationshipEngine/pathFinder.js`
- `src/components/RelationshipEngine/relationshipCalculator.js`
- `src/components/RelationshipEngine/relationshipLabels.js`

**Files to Modify:**
- `src/components/FamilyTree/PersonNode.jsx`

---

### Milestone 4: User Selection & Controls
**Goal:** Allow user to select themselves and toggle between views/languages

**Tasks:**
1. Create `TreeControls.jsx`:
   - "Who am I?" dropdown/selector
   - Toggle between "Tree View" and "Simple List View"
   - Toggle between "Indian Terms" and "English Terms"
   - Zoom controls (fit to screen, reset zoom)
   - Mobile-friendly touch controls
2. Implement user selection state:
   - Store selected person ID in component state
   - Pass to relationship calculator
   - Update all node labels when selection changes
3. Implement view toggle:
   - Switch between `FamilyTreeViewer` and `SimpleListView`
   - Persist preference (localStorage)
4. Implement language toggle:
   - Switch between Indian and English relationship labels
   - Persist preference (localStorage)

**Files to Create:**
- `src/components/FamilyTree/TreeControls.jsx`
- `src/components/FamilyTree/SimpleListView.jsx`

**Files to Modify:**
- `src/components/FamilyTree/FamilyTreeViewer.jsx`
- `src/templates/GlobalTree/LandingPage.jsx`
- `src/templates/FamilyPortal/FamilyHero.jsx`

---

### Milestone 5: Main Page Integration (All Families)
**Goal:** Show family tree on main landing page with all families

**Tasks:**
1. Update `GlobalTree/LandingPage.jsx`:
   - Replace current simple list with tree viewer
   - Add view toggle (Tree View / Simple List View)
   - Load all people from all families
   - Build unified graph (or separate trees per family)
   - Handle cross-family relationships (e.g., Christine Grewal connects to Fann family)
2. Decide on layout strategy:
   - **Option A:** Single unified tree (all families connected)
   - **Option B:** Separate trees per family (grouped visually)
   - **Recommendation:** Start with Option B (easier to understand), allow Option A as advanced view
3. Add family grouping/coloring:
   - Visual distinction between families (color coding, borders)
   - Family name labels/headers
4. Handle performance:
   - Large tree optimization (virtualization if needed)
   - Lazy loading of images
   - Progressive rendering

**Files to Modify:**
- `src/templates/GlobalTree/LandingPage.jsx`
- `src/utils/treeGraphBuilder.js` (add multi-family support)

---

### Milestone 6: Family Page Integration (Single Family)
**Goal:** Show family tree on individual family pages

**Tasks:**
1. Update `FamilyPortal/FamilyHero.jsx`:
   - Replace current simple list with tree viewer
   - Add view toggle (Tree View / Simple List View)
   - Load only people from that family
   - Show family-specific tree
2. Maintain consistency:
   - Same controls and features as main page
   - Same styling and UX
   - User selection persists across pages (optional enhancement)

**Files to Modify:**
- `src/templates/FamilyPortal/FamilyHero.jsx`

---

### Milestone 7: Mobile Optimization & Polish
**Goal:** Ensure excellent mobile experience

**Tasks:**
1. Mobile-specific optimizations:
   - Touch gesture handling (pinch zoom, pan)
   - Node sizing for small screens
   - Simplified controls on mobile
   - Performance optimization for large trees
2. Accessibility:
   - Keyboard navigation
   - Screen reader support
   - ARIA labels
3. Loading states:
   - Create `TreeSkeleton.jsx` for loading state
   - Smooth transitions between views
4. Error handling:
   - Graceful fallback if tree fails to load
   - Error messages for missing data

**Files to Create:**
- `src/components/FamilyTree/TreeSkeleton.jsx`

**Files to Modify:**
- All FamilyTree components

---

## 4. Data Flow & State Management

### State Structure
```javascript
{
  // Tree data
  treeData: null,              // Raw tree.json data
  nodes: [],                   // React Flow nodes
  edges: [],                   // React Flow edges
  
  // User preferences
  selectedPersonId: null,     // "Who am I?" selection
  useIndianTerms: true,        // Language toggle
  viewMode: 'tree',           // 'tree' | 'simple'
  
  // UI state
  loading: true,
  error: null,
  zoomLevel: 1
}
```

### Relationship Calculation Flow
```
User selects "Who am I?" (e.g., "sukhman_grewal")
  ↓
For each person in tree:
  ↓
Calculate path: pathFinder.findPath(selectedPerson, targetPerson)
  ↓
Determine relationship: relationshipCalculator.calculate(path, selectedPerson, targetPerson)
  ↓
Get labels: relationshipLabels.getLabels(relationship, useIndianTerms)
  ↓
Update PersonNode with relationship badge
```

---

## 5. UI/UX Design Considerations

### Tree View
- **Layout:** Top-down hierarchical (dagre handles this)
- **Node Style:** Card-based with image, name, dates
- **Connections:** 
  - Solid lines for parent-child
  - Dashed lines for partners/spouses
  - Different colors for different relationship types (optional)
- **Zoom:** Fit to screen on load, allow zoom/pan
- **Mobile:** Touch-friendly, larger nodes on mobile

### Simple List View
- **Layout:** Vertical list (current implementation)
- **Grouping:** By family (main page) or flat list (family page)
- **Items:** Name, relationship badge (if user selected), link to profile

### Controls
- **Location:** Top of tree viewer, sticky on scroll
- **Mobile:** Collapsible menu or bottom sheet
- **Icons:** Use lucide-react icons (already in project)

---

## 6. Relationship Calculation Logic

### Key Algorithms

#### 1. Path Finding
```javascript
// Find shortest path between two people
function findPath(rootId, targetId, graph) {
  // Use graphlib to find shortest path
  // Handle both parent-child and partner relationships
  // Return array: ['root', 'parent', 'sibling', 'target']
}
```

#### 2. Relationship Determination
```javascript
// Determine relationship from path
function calculateRelationship(path, rootPerson, targetPerson, treeData) {
  // Check path length (generation distance)
  // Check first step (paternal vs maternal)
  // Check age (for Taiya vs Chacha)
  // Check gender
  // Return relationship object with both labels
}
```

#### 3. Indian Relationship Rules
- **Paternal Side (Dad's family):**
  - Dad's older brother → Taiya ji
  - Dad's younger brother → Chacha ji
  - Dad's sister → Phua
  - Dad's sister's husband → Fufad ji
  
- **Maternal Side (Mom's family):**
  - Mom's brother → Mama ji
  - Mom's sister → Masi
  - Mom's sister's husband → Maser ji

- **Siblings:**
  - Older brother → Veer/Bhaji
  - Older sister → Bhain/Didi
  - Brother's wife → Bhabhi
  - Sister's husband → Jija ji

---

## 7. Performance Considerations

### Large Tree Optimization
- **Virtualization:** Only render visible nodes (React Flow handles this)
- **Image Lazy Loading:** Load images as nodes come into view
- **Progressive Rendering:** Render core family first, then extended family
- **Debouncing:** Debounce relationship calculations when user changes selection

### Caching
- Cache relationship calculations (memoization)
- Cache graph structure (don't rebuild on every render)
- Cache layout calculations

---

## 8. Testing Strategy

### Unit Tests
- Relationship calculation logic
- Path finding algorithms
- Graph building utilities

### Integration Tests
- Tree rendering with sample data
- User selection and label updates
- View toggle functionality

### Manual Testing
- Test with small family (Grewal)
- Test with large family (all families)
- Test on mobile devices
- Test with missing data (no images, no dates)

---

## 9. Rollout Plan

### Phase 1: Foundation (Milestones 1-2)
- Basic tree visualization
- Custom node components
- Single family (Grewal) only

### Phase 2: Relationships (Milestones 3-4)
- Relationship calculation
- User selection
- Language toggle
- View toggle

### Phase 3: Integration (Milestones 5-6)
- Main page integration
- Family page integration
- Multi-family support

### Phase 4: Polish (Milestone 7)
- Mobile optimization
- Performance tuning
- Accessibility
- Error handling

---

## 10. Future Enhancements

### Potential Additions
- **Search:** Find person in tree
- **Filters:** Show only specific relationship types
- **Timeline View:** Show family tree over time
- **Export:** Download tree as image/PDF
- **Print View:** Optimized layout for printing
- **Relationship Path Highlighting:** Highlight path between two selected people
- **Photo Upload:** Allow users to upload/update photos directly in tree
- **Privacy Controls:** Hide certain people or relationships

---

## 11. File Structure Summary

### New Files to Create
```
src/
├── components/
│   ├── FamilyTree/
│   │   ├── FamilyTreeViewer.jsx
│   │   ├── PersonNode.jsx
│   │   ├── TreeControls.jsx
│   │   ├── SimpleListView.jsx
│   │   └── TreeSkeleton.jsx
│   └── RelationshipEngine/
│       ├── relationshipCalculator.js
│       ├── pathFinder.js
│       └── relationshipLabels.js
└── utils/
    └── treeGraphBuilder.js
```

### Files to Modify
```
src/
├── templates/
│   ├── GlobalTree/
│   │   └── LandingPage.jsx          # Add tree viewer
│   └── FamilyPortal/
│       └── FamilyHero.jsx            # Add tree viewer
└── package.json                      # Add dependencies
```

---

## 12. Dependencies Installation

```bash
npm install reactflow dagre graphlib
```

**Version Recommendations:**
- `reactflow`: `^11.11.0` (latest stable)
- `dagre`: `^0.8.5` (for automatic layout)
- `graphlib`: `^2.1.9` (for path finding)

---

## 13. Success Criteria

### Functional Requirements
- ✅ Tree view displays all people from tree.json
- ✅ Custom node cards with images and information
- ✅ User can select "Who am I?" and see relationships
- ✅ Toggle between Indian and English relationship terms
- ✅ Toggle between tree view and simple list view
- ✅ Works on main page (all families)
- ✅ Works on family page (single family)
- ✅ Mobile-friendly (touch gestures, responsive)

### Performance Requirements
- ✅ Tree loads in < 2 seconds for 100 people
- ✅ Smooth zoom/pan on mobile
- ✅ Relationship calculations update in < 500ms

### UX Requirements
- ✅ Intuitive controls
- ✅ Clear visual hierarchy
- ✅ Accessible (keyboard navigation, screen readers)
- ✅ Graceful error handling

---

## 14. Recommendations

### My Recommendation: **React Flow + Dagre + Custom Nodes**

**Why:**
1. **React Flow** gives us full control over node design while handling the complex graph logic
2. **Dagre** automatically calculates tree layouts (saves weeks of manual positioning)
3. **Custom nodes** allow us to build exactly the card design we want
4. **Mobile support** is excellent out of the box
5. **Active community** and good documentation

### Implementation Approach: **Incremental & Testable**

Start with Milestone 1 (basic tree) and test thoroughly before moving to relationships. This allows us to:
- Validate the approach early
- Get user feedback on tree layout
- Adjust before building complex features
- Ensure performance is acceptable

### UI/UX Philosophy: **Progressive Enhancement**

- **Default:** Simple list view (current implementation)
- **Enhanced:** Tree view (new feature)
- **Advanced:** Relationship labels (requires user selection)

This ensures the site works for everyone, with additional features for those who want them.

---

## Next Steps

1. **Review this plan** and confirm approach
2. **Install dependencies** (`reactflow`, `dagre`, `graphlib`)
3. **Start with Milestone 1** (basic tree visualization)
4. **Test with Grewal family** first (small, manageable)
5. **Iterate based on feedback** before expanding to all families

---

**Estimated Timeline:**
- Milestones 1-2: 2-3 days (foundation)
- Milestones 3-4: 3-4 days (relationships)
- Milestones 5-6: 2-3 days (integration)
- Milestone 7: 2-3 days (polish)
- **Total: ~2 weeks** for full implementation

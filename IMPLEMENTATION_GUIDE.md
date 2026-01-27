# Implementation Guide: JSON to Supabase Migration

## Overview

This guide outlines the complete migration from a static JSON-based architecture to a database-backed system using Supabase. The migration is broken into **6 sequential milestones** that can be completed one at a time, with clear deliverables and acceptance criteria.

**Goal:** Enable collaborative editing of family data through a web interface with role-based access control, while maintaining the current app's performance and user experience.

---

## Migration Milestones Overview

| Milestone | Name | Objective | Status |
|-----------|------|-----------|--------|
| **M0** | Database Schema Setup | Create Supabase tables and indexes | ⏳ Pending |
| **M1** | Service Layer Architecture | Create API service files (centralized DB queries) | ⏳ Pending |
| **M2** | Data Migration Script | Migrate JSON files to Supabase database | ⏳ Pending |
| **M3** | Frontend Refactor (Read-Only) | Update loaders to use service layer | ⏳ Pending |
| **M4** | Authentication Setup | Implement SSO login (Google/Microsoft) | ⏳ Pending |
| **M5** | Permissions & RLS | Add role-based access control | ⏳ Pending |
| **M6** | Testing & Validation | Comprehensive testing and cleanup | ⏳ Pending |

**Workflow:** Complete each milestone fully before moving to the next. Each milestone includes:
- ✅ Clear prerequisites
- ✅ Step-by-step implementation
- ✅ Deliverables checklist
- ✅ Acceptance criteria
- ✅ What AI will do vs. what you'll do

---

## Architecture Overview

### Current Architecture (JSON-Based)

**Data Structure:**
- `tree.json`: Master directory (~100KB) with all people and basic relationships
- `families/{id}.json`: Family configuration (theme, display name, ~1KB each)
- `people/{familyId}-{personId}.json`: Full memorial profiles (~10-50KB each, only for `hasFullProfile: true`)

**Data Flow:**
1. `treeLoader.js` uses `import.meta.glob` to load `tree.json` at build time
2. `dataLoader.js` uses `import.meta.glob` to load family/person JSON files
3. Contexts (`FamilyContext`, `PersonContext`) provide data to components
4. Gallery uses CSV files (`gallery.csv`) with optional `personId` column for tagging

### Target Architecture (Supabase-Based)

**Service Layer Pattern:**
- `src/services/familyService.js`: All family-related Supabase queries
- `src/services/personService.js`: All person-related Supabase queries
- `src/services/permissionService.js`: All permission-related queries
- `src/utils/treeLoader.js`: Calls services, handles caching/transformation
- `src/utils/dataLoader.js`: Calls services, maintains backward compatibility

**Database Tables:**
- `families`: Family configuration and themes
- `people`: All person data (both minimal and full profiles)
- `user_permissions`: Role-based access control
- `gallery_items`: Media metadata (future enhancement)

**Data Flow:**
1. Components → Contexts → Loaders → Services → Supabase
2. RLS policies enforce permissions at database level
3. Service layer centralizes all DB logic

---

## Design Decisions

### Service Layer Pattern

**Decision:** Abstract all Supabase queries into dedicated service files.

**Rationale:**
- ✅ **Separation of Concerns:** Components don't need to know about Supabase
- ✅ **Single Point of Change:** Rename a column? Fix it in one place
- ✅ **Cleaner Code:** Loaders focus on transformation, services handle DB logic
- ✅ **Testability:** Easy to mock services for testing
- ✅ **Reusability:** Services can be used by multiple loaders/components

**Structure:**
```
src/
  services/
    familyService.js    # Family queries
    personService.js     # Person queries
    permissionService.js # Permission queries
  utils/
    supabaseClient.js   # Supabase client instance
    treeLoader.js       # Calls services, handles caching
    dataLoader.js       # Calls services, maintains API
```

### ID Strategy: Text IDs vs UUIDs

**Decision:** Use **TEXT primary keys** (e.g., `"baljit_grewal"`) instead of UUIDs.

**Rationale:**
- ✅ **Zero Breaking Changes:** Matches existing `tree.json` format exactly
- ✅ **URL Compatibility:** Person URLs (`grewal.apna.family/baljit`) remain unchanged
- ✅ **Simpler Migration:** No need to refactor routing or create ID mapping tables
- ✅ **Human Readable:** Easier to debug and query in database

**Trade-offs:**
- ⚠️ **ID Changes:** If you rename a person or family, you must handle cascading updates carefully
- ⚠️ **Database Convention:** Most databases prefer UUIDs, but PostgreSQL handles TEXT PKs efficiently

### Gallery System: CSV vs Database

**Decision:** Keep gallery management in **CSV files** for M0-M5, migrate to database in **Future Enhancement**.

**Rationale:**
- ✅ **Reduced Complexity:** Gallery migration adds 10x complexity to initial migration
- ✅ **Lower Risk:** CSV system is working well, no need to fix what isn't broken
- ✅ **Incremental Approach:** Get People/Tree editing working first, then tackle Gallery

---

## Milestone 0: Database Schema Setup

### Objective
Create all Supabase tables, indexes, and triggers in both DEV and PRD environments.

### Prerequisites
- ✅ Supabase projects created (DEV and PRD)
- ✅ Access to Supabase Dashboard SQL Editor
- ✅ `.env.local` configured with DEV credentials

### What You'll Do
1. Copy SQL scripts from this guide into Supabase Dashboard SQL Editor
2. Run scripts in DEV environment first
3. Verify tables are created correctly
4. Run same scripts in PRD environment

### What I'll Do
- Provide complete SQL scripts for all tables
- Include indexes and triggers
- Document any customizations needed

### Implementation

#### Step 1: Create Helper Function

**Run this in Supabase Dashboard SQL Editor:**

```sql
-- Helper function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Step 2: Create `families` Table

```sql
CREATE TABLE families (
  id TEXT PRIMARY KEY,                    -- e.g., "grewal", "wong"
  display_name TEXT NOT NULL,              -- e.g., "The Grewals"
  description TEXT,                        -- Optional family description
  head_id TEXT,                            -- Reference to head of family (person ID)
  
  -- Theme configuration (stored as JSONB for flexibility)
  theme JSONB DEFAULT '{
    "primaryColor": "#2563eb",
    "accentColor": "#3b82f6",
    "accentHover": "#1d4ed8"
  }'::jsonb,
  
  -- Settings (stored as JSONB)
  settings JSONB DEFAULT '{
    "homeVideosPassword": null,
    "publicGallery": true
  }'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_families_id ON families(id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Step 3: Create `people` Table

```sql
CREATE TABLE people (
  id TEXT PRIMARY KEY,                    -- Format: "personId_familyId" (e.g., "baljit_grewal")
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  
  -- Basic Info (always present)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  maiden_name TEXT,                        -- For married names
  nickname TEXT,
  gender TEXT,                              -- "M", "F", "Unknown", etc.
  type TEXT DEFAULT 'person',              -- "person", "pet", etc.
  
  -- Dates
  dob DATE,                                -- Date of birth
  dod DATE,                                -- Date of death
  pob TEXT,                                -- Place of birth
  current_location TEXT,
  
  -- Status
  is_deceased BOOLEAN DEFAULT FALSE,
  has_full_profile BOOLEAN DEFAULT FALSE,   -- Indicates if full memorial exists
  
  -- Relationships (stored as TEXT arrays)
  parents TEXT[] DEFAULT '{}',             -- Array of person IDs
  children TEXT[] DEFAULT '{}',            -- Array of person IDs
  partners TEXT[] DEFAULT '{}',             -- Array of person IDs
  
  -- Full Profile Data (stored as JSONB, only populated if has_full_profile = true)
  -- Structure matches current people/{familyId}-{personId}.json format
  profile_data JSONB DEFAULT '{}'::jsonb,  -- Contains: memorialData, eventData, homeVideos
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_people_family_id ON people(family_id);
CREATE INDEX idx_people_has_full_profile ON people(has_full_profile);
CREATE INDEX idx_people_is_deceased ON people(is_deceased);

-- GIN index for JSONB queries (if needed for searching within profile_data)
CREATE INDEX idx_people_profile_data ON people USING GIN (profile_data);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_people_updated_at
  BEFORE UPDATE ON people
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Step 4: Create `user_permissions` Table

```sql
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,                -- Email from Supabase Auth
  family_id TEXT REFERENCES families(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer')),
  
  -- Constraints:
  -- - super_admin must have family_id = NULL (can edit all families)
  -- - Other roles must have a family_id (zone-specific)
  CONSTRAINT check_super_admin_family_id CHECK (
    (role = 'super_admin' AND family_id IS NULL) OR
    (role != 'super_admin' AND family_id IS NOT NULL)
  ),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one role per user per family
  UNIQUE(user_email, family_id)
);

-- Indexes
CREATE INDEX idx_user_permissions_email ON user_permissions(user_email);
CREATE INDEX idx_user_permissions_family_id ON user_permissions(family_id);
CREATE INDEX idx_user_permissions_role ON user_permissions(role);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_user_permissions_updated_at
  BEFORE UPDATE ON user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Deliverables Checklist

- [ ] Helper function `update_updated_at_column()` created
- [ ] `families` table created with indexes and trigger
- [ ] `people` table created with indexes and trigger
- [ ] `user_permissions` table created with indexes and trigger
- [ ] All tables verified in DEV environment
- [ ] All tables created in PRD environment

### Acceptance Criteria

- ✅ All SQL scripts execute without errors
- ✅ Tables visible in Supabase Dashboard
- ✅ Indexes created and visible
- ✅ Triggers active (test by updating a record)
- ✅ Foreign key constraints working (test by trying to insert invalid `family_id`)

---

## Milestone 1: Service Layer Architecture

### Objective
Create centralized service files that abstract all Supabase database queries. This ensures all DB logic is in one place and can be easily maintained.

### Prerequisites
- ✅ Milestone 0 completed (tables exist)
- ✅ `@supabase/supabase-js` installed
- ✅ `.env.local` configured with Supabase credentials

### What You'll Do
- Install `@supabase/supabase-js` if not already installed
- Review service files after creation
- Test service functions manually if desired

### What I'll Do
- Create `src/utils/supabaseClient.js`
- Create `src/services/familyService.js`
- Create `src/services/personService.js`
- Create `src/services/permissionService.js`
- Ensure all services follow consistent patterns

### Implementation

#### Step 1: Create Supabase Client

**File: `src/utils/supabaseClient.js`**

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### Step 2: Create Family Service

**File: `src/services/familyService.js`**

```javascript
import { supabase } from '../utils/supabaseClient'

/**
 * Get family by ID
 * @param {string} familyId - Family ID (e.g., "grewal")
 * @returns {Promise<Object>} - Family data
 */
export const getFamilyById = async (familyId) => {
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .single()

  if (error) throw error
  return data
}

/**
 * Get all families
 * @returns {Promise<Array>} - Array of all families
 */
export const getAllFamilies = async () => {
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .order('display_name')

  if (error) throw error
  return data
}

/**
 * Get family heads (for root domain optimization)
 * @returns {Promise<Array>} - Array of families with head_id populated
 */
export const getFamilyHeads = async () => {
  const { data, error } = await supabase
    .from('families')
    .select('id, head_id, display_name')

  if (error) throw error
  return data
}
```

#### Step 3: Create Person Service

**File: `src/services/personService.js`**

```javascript
import { supabase } from '../utils/supabaseClient'

/**
 * Get person by ID (full tree ID format: "personId_familyId")
 * @param {string} personId - Person ID (e.g., "baljit_grewal")
 * @returns {Promise<Object>} - Person data
 */
export const getPersonById = async (personId) => {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .eq('id', personId)
    .single()

  if (error) throw error
  return data
}

/**
 * Get all people in a family (CLUSTER OPTIMIZATION)
 * @param {string} familyId - Family ID (e.g., "grewal")
 * @returns {Promise<Array>} - Array of people in that family
 */
export const getClusterByFamilyId = async (familyId) => {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .eq('family_id', familyId)
    .order('first_name')

  if (error) throw error
  return data
}

/**
 * Get people by IDs (for fetching related nodes)
 * @param {Array<string>} personIds - Array of person IDs
 * @returns {Promise<Array>} - Array of people
 */
export const getPeopleByIds = async (personIds) => {
  if (!personIds || personIds.length === 0) return []

  const { data, error } = await supabase
    .from('people')
    .select('*')
    .in('id', personIds)

  if (error) throw error
  return data
}

/**
 * Get family head and immediate family (for root domain)
 * @param {string} headId - Head person ID
 * @returns {Promise<Object>} - Head person with related people
 */
export const getHeadWithImmediateFamily = async (headId) => {
  // Get head person
  const head = await getPersonById(headId)
  if (!head) return null

  // Get related people (partners, first 3 children)
  const relatedIds = new Set()
  if (head.partners) relatedIds.add(...head.partners)
  if (head.children) {
    // Limit to first 3 children for performance
    head.children.slice(0, 3).forEach(id => relatedIds.add(id))
  }

  const related = relatedIds.size > 0 
    ? await getPeopleByIds(Array.from(relatedIds))
    : []

  return {
    head,
    related
  }
}
```

#### Step 4: Create Permission Service

**File: `src/services/permissionService.js`**

```javascript
import { supabase } from '../utils/supabaseClient'

/**
 * Check if user has permission to edit a family
 * @param {string} userEmail - User's email
 * @param {string} familyId - Family ID to check
 * @returns {Promise<{canEdit: boolean, role: string|null}>}
 */
export const checkFamilyPermission = async (userEmail, familyId) => {
  if (!userEmail) {
    return { canEdit: false, role: null }
  }

  try {
    // Check for super_admin (can edit all families)
    const { data: superAdmin } = await supabase
      .from('user_permissions')
      .select('role')
      .eq('user_email', userEmail)
      .eq('role', 'super_admin')
      .is('family_id', null)
      .single()

    if (superAdmin) {
      return { canEdit: true, role: 'super_admin' }
    }

    // Check for family-specific permission
    const { data: permission } = await supabase
      .from('user_permissions')
      .select('role')
      .eq('user_email', userEmail)
      .eq('family_id', familyId)
      .in('role', ['admin', 'editor'])
      .single()

    if (permission) {
      return { canEdit: true, role: permission.role }
    }

    return { canEdit: false, role: null }
  } catch (error) {
    console.error('Error checking permissions:', error)
    return { canEdit: false, role: null }
  }
}

/**
 * Get user's permissions
 * @param {string} userEmail - User's email
 * @returns {Promise<Array>} - Array of user permissions
 */
export const getUserPermissions = async (userEmail) => {
  if (!userEmail) return []

  const { data, error } = await supabase
    .from('user_permissions')
    .select('*')
    .eq('user_email', userEmail)

  if (error) throw error
  return data || []
}
```

### Deliverables Checklist

- [ ] `src/utils/supabaseClient.js` created
- [ ] `src/services/familyService.js` created with all functions
- [ ] `src/services/personService.js` created with all functions
- [ ] `src/services/permissionService.js` created with all functions
- [ ] All services export functions correctly
- [ ] No import errors in service files

### Acceptance Criteria

- ✅ All service files created and importable
- ✅ Service functions follow consistent naming patterns
- ✅ Error handling implemented (throw errors, don't return null)
- ✅ JSDoc comments added for all exported functions
- ✅ Services can be imported without errors

---

## Milestone 2: Data Migration Script

### Objective
Create a Node.js script that migrates all existing JSON data to Supabase tables. The script must be idempotent and handle data transformations correctly.

### Prerequisites
- ✅ Milestone 0 completed (tables exist)
- ✅ Milestone 1 completed (services exist, but script will use direct Supabase client)
- ✅ `.env.local` configured with `SUPABASE_SERVICE_ROLE_KEY`
- ✅ JSON files exist in `src/data/`

### What You'll Do
- Run the migration script: `node scripts/migrate-to-supabase.js`
- Verify data in Supabase Dashboard
- Report any errors or data issues

### What I'll Do
- Create `scripts/migrate-to-supabase.js`
- Handle all data transformations (dates, arrays, JSONB)
- Add validation and error reporting
- Make script idempotent (safe to run multiple times)

### Implementation

#### Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js dotenv
```

#### Step 2: Create Migration Script

**File: `scripts/migrate-to-supabase.js`**

```javascript
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
dotenv.config({ path: '.env.local' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Initialize Supabase client with service role (bypasses RLS)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Paths
const DATA_DIR = join(__dirname, '../src/data')
const TREE_JSON = join(DATA_DIR, 'tree.json')
const FAMILIES_DIR = join(DATA_DIR, 'families')
const PEOPLE_DIR = join(DATA_DIR, 'people')

/**
 * Migrate families from tree.json and families/*.json
 */
async function migrateFamilies() {
  console.log('📦 Migrating families...')
  
  // Read tree.json
  const treeData = JSON.parse(readFileSync(TREE_JSON, 'utf-8'))
  const familiesFromTree = treeData.families || {}

  // Read families/*.json files
  const familyFiles = existsSync(FAMILIES_DIR)
    ? readdirSync(FAMILIES_DIR).filter(f => f.endsWith('.json'))
    : []

  const familiesToInsert = []

  // Process families from tree.json
  for (const [familyId, familyData] of Object.entries(familiesFromTree)) {
    let familyConfig = {
      id: familyId,
      display_name: familyData.label || familyId,
      head_id: familyData.head || null,
      description: null,
      theme: {
        primaryColor: '#2563eb',
        accentColor: '#3b82f6',
        accentHover: '#1d4ed8'
      },
      settings: {
        homeVideosPassword: null,
        publicGallery: true
      }
    }

    // Override with data from families/{id}.json if it exists
    const familyFile = join(FAMILIES_DIR, `${familyId}.json`)
    if (existsSync(familyFile)) {
      const fileData = JSON.parse(readFileSync(familyFile, 'utf-8'))
      familyConfig = {
        ...familyConfig,
        display_name: fileData.displayName || fileData.name || familyConfig.display_name,
        description: fileData.description || null,
        theme: fileData.theme || familyConfig.theme,
        settings: {
          homeVideosPassword: fileData.homeVideosPassword || null,
          publicGallery: true
        }
      }
    }

    familiesToInsert.push(familyConfig)
  }

  // Upsert families (idempotent)
  const { data, error } = await supabase
    .from('families')
    .upsert(familiesToInsert, { onConflict: 'id' })

  if (error) {
    console.error('❌ Error migrating families:', error)
    throw error
  }

  console.log(`✅ Migrated ${familiesToInsert.length} families`)
  return familiesToInsert
}

/**
 * Migrate people from tree.json
 */
async function migratePeople() {
  console.log('👥 Migrating people...')
  
  // Read tree.json
  const treeData = JSON.parse(readFileSync(TREE_JSON, 'utf-8'))
  const peopleFromTree = treeData.people || []

  const peopleToInsert = peopleFromTree.map(person => {
    // Extract familyId
    const familyId = person.familyId || person.id?.split('_').pop()

    return {
      id: person.id,
      family_id: familyId,
      first_name: person.firstName || '',
      last_name: person.lastName || '',
      maiden_name: person.maidenName || null,
      nickname: person.nickname || null,
      gender: person.gender || null,
      type: person.type || 'person',
      dob: person.dob || null,
      dod: person.dod || null,
      pob: person.pob || null,
      current_location: person.currentLocation || null,
      is_deceased: person.isDeceased || false,
      has_full_profile: person.hasFullProfile || false,
      parents: person.parents || [],
      children: person.children || [],
      partners: person.partners || [],
      profile_data: {} // Will be populated in next step
    }
  })

  // Upsert people (idempotent)
  const { data, error } = await supabase
    .from('people')
    .upsert(peopleToInsert, { onConflict: 'id' })

  if (error) {
    console.error('❌ Error migrating people:', error)
    throw error
  }

  console.log(`✅ Migrated ${peopleToInsert.length} people`)
  return peopleToInsert
}

/**
 * Migrate full profiles from people/*.json files
 */
async function migrateFullProfiles() {
  console.log('📄 Migrating full profiles...')
  
  if (!existsSync(PEOPLE_DIR)) {
    console.log('⚠️  No people directory found, skipping full profiles')
    return 0
  }

  const peopleFiles = readdirSync(PEOPLE_DIR).filter(f => f.endsWith('.json'))
  let migratedCount = 0

  for (const filename of peopleFiles) {
    // Parse filename: "grewal-baljit.json" -> {familyId: "grewal", personId: "baljit"}
    const [familyId, ...personIdParts] = filename.replace('.json', '').split('-')
    const personId = personIdParts.join('-')
    const treeId = `${personId}_${familyId}`

    try {
      // Read full profile JSON
      const filePath = join(PEOPLE_DIR, filename)
      const profileData = JSON.parse(readFileSync(filePath, 'utf-8'))

      // Update person record with profile_data
      const { error } = await supabase
        .from('people')
        .update({
          profile_data: profileData,
          has_full_profile: true
        })
        .eq('id', treeId)

      if (error) {
        console.error(`❌ Error migrating profile for ${treeId}:`, error)
        continue
      }

      migratedCount++
    } catch (error) {
      console.error(`❌ Error processing ${filename}:`, error)
    }
  }

  console.log(`✅ Migrated ${migratedCount} full profiles`)
  return migratedCount
}

/**
 * Validate migration
 */
async function validateMigration() {
  console.log('🔍 Validating migration...')

  // Count families
  const { count: familyCount } = await supabase
    .from('families')
    .select('*', { count: 'exact', head: true })

  // Count people
  const { count: peopleCount } = await supabase
    .from('people')
    .select('*', { count: 'exact', head: true })

  // Count full profiles
  const { count: fullProfileCount } = await supabase
    .from('people')
    .select('*', { count: 'exact', head: true })
    .eq('has_full_profile', true)

  console.log(`📊 Migration Summary:`)
  console.log(`   Families: ${familyCount}`)
  console.log(`   People: ${peopleCount}`)
  console.log(`   Full Profiles: ${fullProfileCount}`)

  // Check for orphaned relationships
  const { data: people } = await supabase
    .from('people')
    .select('id, parents, children, partners')

  let orphanCount = 0
  const allPersonIds = new Set(people.map(p => p.id))

  people.forEach(person => {
    const checkIds = [
      ...(person.parents || []),
      ...(person.children || []),
      ...(person.partners || [])
    ]

    checkIds.forEach(id => {
      if (id && !allPersonIds.has(id)) {
        console.warn(`⚠️  Orphaned reference: ${person.id} references ${id} which doesn't exist`)
        orphanCount++
      }
    })
  })

  if (orphanCount > 0) {
    console.warn(`⚠️  Found ${orphanCount} orphaned relationship references`)
  } else {
    console.log('✅ All relationships validated')
  }
}

/**
 * Main migration function
 */
async function main() {
  try {
    console.log('🚀 Starting migration...\n')

    await migrateFamilies()
    await migratePeople()
    await migrateFullProfiles()
    await validateMigration()

    console.log('\n✅ Migration completed successfully!')
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
main()
```

#### Step 3: Add Script to package.json

```json
{
  "scripts": {
    "migrate-to-supabase": "node scripts/migrate-to-supabase.js"
  }
}
```

### Deliverables Checklist

- [ ] Migration script created
- [ ] Script handles families migration
- [ ] Script handles people migration
- [ ] Script handles full profiles migration
- [ ] Script includes validation
- [ ] Script is idempotent (can run multiple times)
- [ ] Data migrated to DEV database
- [ ] Data verified in Supabase Dashboard
- [ ] Data migrated to PRD database

### Acceptance Criteria

- ✅ Script runs without errors
- ✅ All families migrated correctly
- ✅ All people migrated correctly
- ✅ Full profiles migrated to `profile_data` JSONB
- ✅ Relationship arrays preserved
- ✅ Date fields converted correctly
- ✅ Validation shows correct counts
- ✅ No critical orphaned relationships

---

## Milestone 3: Frontend Refactor (Read-Only)

### Objective
Update `treeLoader.js` and `dataLoader.js` to use the service layer instead of JSON files, while maintaining backward compatibility with existing components.

### Prerequisites
- ✅ Milestone 1 completed (services exist)
- ✅ Milestone 2 completed (data migrated)
- ✅ App still works with JSON files (we'll replace gradually)

### What You'll Do
- Test the app after each step
- Report any broken functionality
- Verify performance is acceptable

### What I'll Do
- Refactor `treeLoader.js` to use services
- Refactor `dataLoader.js` to use services
- Update `PersonContext.jsx` if needed
- Maintain same function signatures (backward compatible)

### Implementation

#### Step 1: Refactor `treeLoader.js`

**File: `src/utils/treeLoader.js`**

```javascript
/**
 * Tree Loader
 * 
 * Utilities for loading and querying tree data from Supabase
 * Uses service layer for all database queries
 */

import * as familyService from '../services/familyService'
import * as personService from '../services/personService'

// Cache per familyId
let treeCache = new Map()
let cacheTimestamp = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Load tree data with optional family filtering (Cluster Optimization)
 * @param {string|null} familyId - If provided, only fetch this family's people. If null, fetch family heads for root domain.
 * @returns {Promise<Object>} - Tree data with people array
 */
export async function loadTreeData(familyId = null) {
  const cacheKey = familyId || 'root'
  
  // Return cached data if still valid
  if (treeCache.has(cacheKey) && cacheTimestamp.has(cacheKey)) {
    const age = Date.now() - cacheTimestamp.get(cacheKey)
    if (age < CACHE_TTL) {
      return treeCache.get(cacheKey)
    }
  }

  try {
    let people = []
    
    if (familyId) {
      // CLUSTER MODE: Only fetch people from this specific family
      const rawPeople = await personService.getClusterByFamilyId(familyId)
      people = rawPeople
    } else {
      // ROOT DOMAIN MODE: Fetch only family heads (lightweight)
      const families = await familyService.getFamilyHeads()
      
      // Fetch head people and their immediate family
      const allPeople = []
      for (const family of families) {
        if (family.head_id) {
          const headData = await personService.getHeadWithImmediateFamily(family.head_id)
          if (headData) {
            allPeople.push(headData.head, ...headData.related)
          }
        }
      }
      
      // Remove duplicates
      const uniquePeople = new Map()
      allPeople.forEach(person => {
        if (!uniquePeople.has(person.id)) {
          uniquePeople.set(person.id, person)
        }
      })
      people = Array.from(uniquePeople.values())
    }

    // Always fetch all families (lightweight, needed for navigation)
    const families = await familyService.getAllFamilies()

    // Transform to match existing tree.json structure
    const treeData = {
      meta: {
        version: "3.0",
        description: "Apna Family Network Tree Data (Supabase)",
        lastUpdated: new Date().toISOString()
      },
      families: families.reduce((acc, family) => {
        acc[family.id] = {
          label: family.display_name,
          head: family.head_id
        }
        return acc
      }, {}),
      people: people.map(person => ({
        id: person.id,
        firstName: person.first_name,
        lastName: person.last_name,
        maidenName: person.maiden_name,
        nickname: person.nickname,
        gender: person.gender,
        type: person.type,
        dob: person.dob,
        dod: person.dod,
        pob: person.pob,
        currentLocation: person.current_location,
        isDeceased: person.is_deceased,
        hasFullProfile: person.has_full_profile,
        familyId: person.family_id,
        parents: person.parents || [],
        children: person.children || [],
        partners: person.partners || []
      }))
    }

    // Cache per familyId
    treeCache.set(cacheKey, treeData)
    cacheTimestamp.set(cacheKey, Date.now())
    return treeData
  } catch (error) {
    console.error('Error loading tree data from Supabase:', error)
    throw error
  }
}

/**
 * Get person entry from tree by tree ID
 * @param {string} treeId - Person ID (e.g., "baljit_grewal")
 * @returns {Promise<Object|null>} - Person entry or null if not found
 */
export async function getPersonFromTree(treeId) {
  // Extract familyId from treeId to use cluster optimization
  const parts = treeId.split('_')
  if (parts.length < 2) return null
  
  const familyId = parts[parts.length - 1]
  const treeData = await loadTreeData(familyId)
  return treeData.people?.find(person => person.id === treeId) || null
}

/**
 * Get person entry by familyId and personId
 * @param {string} familyId - Family ID (e.g., "grewal")
 * @param {string} personId - Person ID (e.g., "baljit")
 * @returns {Promise<Object|null>} - Person entry or null if not found
 */
export async function getPersonFromTreeByIds(familyId, personId) {
  const treeId = `${personId}_${familyId}`
  return getPersonFromTree(treeId)
}

/**
 * Get all people for a specific family
 * @param {string} familyId - Family ID (e.g., "grewal")
 * @returns {Promise<Array>} - Array of person entries
 */
export async function getFamilyPeopleFromTree(familyId) {
  const treeData = await loadTreeData(familyId)
  return treeData.people
}

/**
 * Get all people with full profiles
 * @param {string} familyId - Optional family ID to filter
 * @returns {Promise<Array>} - Array of person entries with full profiles
 */
export async function getPeopleWithFullProfiles(familyId = null) {
  const treeData = familyId 
    ? await loadTreeData(familyId)
    : await loadTreeData(null)
  
  return treeData.people.filter(person => person.hasFullProfile === true)
}

/**
 * Get all unique family IDs
 * @returns {Promise<Array<string>>} - Array of unique family IDs
 */
export async function getAllFamilyIdsFromTree() {
  const families = await familyService.getAllFamilies()
  return families.map(f => f.id).sort()
}

/**
 * Clear tree cache (useful for development/testing)
 */
export function clearTreeCache() {
  treeCache.clear()
  cacheTimestamp.clear()
}
```

#### Step 2: Refactor `dataLoader.js`

**File: `src/utils/dataLoader.js`**

```javascript
/**
 * Utility functions for loading data from Supabase
 * Uses service layer for all database queries
 */

import * as familyService from '../services/familyService'
import * as personService from '../services/personService'

/**
 * Load family data from Supabase
 * @param {string} familyId - The family ID (e.g., "grewal")
 * @returns {Promise<Object>} - The family data object
 */
export async function loadFamilyData(familyId) {
  try {
    const data = await familyService.getFamilyById(familyId)

    // Transform to match existing JSON structure
    return {
      id: data.id,
      name: data.display_name,
      displayName: data.display_name,
      theme: data.theme,
      homeVideosPassword: data.settings?.homeVideosPassword || null,
      description: data.description
    }
  } catch (error) {
    console.error(`Error loading family data for ${familyId}:`, error)
    // Return default structure (matches current graceful failure)
    throw error
  }
}

/**
 * Load person data from Supabase
 * @param {string} familyId - The family ID (e.g., "grewal")
 * @param {string} personId - The person ID (e.g., "baljit")
 * @returns {Promise<Object>} - The person data object (profile_data JSONB)
 */
export async function loadPersonData(familyId, personId) {
  try {
    const treeId = `${personId}_${familyId}`
    const person = await personService.getPersonById(treeId)

    // If no full profile, return null (matches current behavior)
    if (!person.has_full_profile || !person.profile_data) {
      throw new Error(`No full profile found for ${familyId}-${personId}`)
    }

    // Return profile_data JSONB as-is (matches existing JSON structure)
    return person.profile_data
  } catch (error) {
    console.error(`Error loading person data for ${familyId}-${personId}:`, error)
    throw error
  }
}
```

#### Step 3: Verify PersonContext Works

**File: `src/contexts/PersonContext.jsx`** (No changes needed - it already uses `loadPersonData` and `getPersonFromTreeByIds`)

The existing `PersonContext.jsx` should work without changes because:
- It calls `loadPersonData()` which we've updated to use services
- It calls `getPersonFromTreeByIds()` which we've updated to use services
- The function signatures remain the same

### Deliverables Checklist

- [ ] `treeLoader.js` refactored to use services
- [ ] `dataLoader.js` refactored to use services
- [ ] All existing functions maintain same signatures
- [ ] Cluster optimization implemented (familyId parameter)
- [ ] Caching implemented per familyId
- [ ] Root domain optimization (family heads only)
- [ ] App tested and working

### Acceptance Criteria

- ✅ Root landing page loads correctly
- ✅ Family portal pages load correctly
- ✅ Person pages load (both minimal and full profiles)
- ✅ Family tree visualization works
- ✅ No console errors
- ✅ Performance is acceptable (compare to JSON version)
- ✅ Gallery still works (unchanged)

---

## Milestone 4: Authentication Setup

### Objective
Implement SSO authentication (Google/Microsoft) using Supabase Auth, and create Auth context for the app.

### Prerequisites
- ✅ Milestone 3 completed (read-only frontend working)
- ✅ Google OAuth app created (for Google login)
- ✅ Microsoft Azure app created (for Microsoft login)
- ✅ Supabase Auth providers configured in dashboard

### What You'll Do
1. Create Google OAuth app (if not exists)
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add redirect URI: `https://apna.family/auth/callback`
2. Create Microsoft Azure app (if not exists)
   - Go to [Azure Portal](https://portal.azure.com/)
   - Register new application
   - Add redirect URI: `https://apna.family/auth/callback`
3. Configure Supabase Auth providers
   - Go to Supabase Dashboard → Authentication → Providers
   - Enable Google, add Client ID and Secret
   - Enable Microsoft (Azure), add Client ID and Secret
4. Test login flow

### What I'll Do
- Create `src/contexts/AuthContext.jsx`
- Create `src/components/AuthButton.jsx`
- Create `src/components/AuthCallback.jsx`
- Update `App.jsx` to include auth routes
- Add auth callback route handler

### Implementation

#### Step 1: Create Auth Context

**File: `src/contexts/AuthContext.jsx`**

```javascript
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  const signInWithMicrosoft = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) {
      console.error('Error signing in with Microsoft:', error)
      throw error
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInWithMicrosoft,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

#### Step 2: Create Auth Button Component

**File: `src/components/AuthButton.jsx`**

```javascript
import { useAuth } from '../contexts/AuthContext'
import { useFamily } from '../contexts/FamilyContext'
import { checkFamilyPermission } from '../services/permissionService'
import { useState, useEffect } from 'react'

export function AuthButton() {
  const { user, signInWithGoogle, signInWithMicrosoft, signOut, loading: authLoading } = useAuth()
  const { familyId } = useFamily()
  const [canEdit, setCanEdit] = useState(false)
  const [permissionLoading, setPermissionLoading] = useState(true)

  useEffect(() => {
    if (user && familyId) {
      checkFamilyPermission(user.email, familyId).then(({ canEdit: edit }) => {
        setCanEdit(edit)
        setPermissionLoading(false)
      })
    } else {
      setPermissionLoading(false)
    }
  }, [user, familyId])

  if (authLoading || permissionLoading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button onClick={signInWithGoogle}>Sign in with Google</button>
        <button onClick={signInWithMicrosoft}>Sign in with Microsoft</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <span>Signed in as {user.email}</span>
      {canEdit && <span style={{ color: 'green' }}>(Can Edit)</span>}
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

#### Step 3: Create Auth Callback Component

**File: `src/components/AuthCallback.jsx`**

```javascript
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // Handle OAuth callback
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        // Redirect to home or previous page
        const returnTo = sessionStorage.getItem('returnTo') || '/'
        sessionStorage.removeItem('returnTo')
        navigate(returnTo)
      } else if (event === 'SIGNED_OUT') {
        navigate('/')
      }
    })

    // Also check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const returnTo = sessionStorage.getItem('returnTo') || '/'
        sessionStorage.removeItem('returnTo')
        navigate(returnTo)
      }
    })
  }, [navigate])

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>Signing you in...</p>
    </div>
  )
}
```

#### Step 4: Update App.jsx

**File: `src/App.jsx`** (Add AuthProvider and callback route)

```javascript
import { ThemeProvider } from 'styled-components'
import { BrowserRouter, Routes, Route, useParams, useLocation } from 'react-router-dom'
import { theme } from './styles/theme'
import { GlobalStyles } from './styles/GlobalStyles'
import { FamilyProvider } from './contexts/FamilyContext'
import { PersonProvider } from './contexts/PersonContext'
import { AuthProvider } from './contexts/AuthContext' // ADD THIS
import { parseSubdomain, isRootDomain } from './utils/subdomain'
import { ErrorBoundary } from './components/ErrorBoundary'
import OVERRIDES from './overrideRegistry'
import NavigationLoader from './components/NavigationLoader'
import { AuthCallback } from './components/AuthCallback' // ADD THIS

// ... existing imports ...

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        <AuthProvider> {/* WRAP WITH AuthProvider */}
          <BrowserRouter>
            <NavigationLoader />
            <Routes>
              {/* ADD THIS ROUTE */}
              <Route path="/auth/callback" element={<AuthCallback />} />
              <RootRoutes />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
```

### Deliverables Checklist

- [ ] `AuthContext.jsx` created
- [ ] `AuthButton.jsx` created
- [ ] `AuthCallback.jsx` created
- [ ] `App.jsx` updated with AuthProvider
- [ ] Auth callback route added
- [ ] Google OAuth configured in Supabase
- [ ] Microsoft OAuth configured in Supabase
- [ ] Login flow tested

### Acceptance Criteria

- ✅ User can click "Sign in with Google" and complete OAuth flow
- ✅ User can click "Sign in with Microsoft" and complete OAuth flow
- ✅ After login, user email is displayed
- ✅ Sign out works correctly
- ✅ Auth state persists across page refreshes
- ✅ Callback route redirects correctly

---

## Milestone 5: Permissions & Row Level Security

### Objective
Implement Row Level Security (RLS) policies in Supabase to enforce permissions at the database level, and create permission helper functions.

### Prerequisites
- ✅ Milestone 4 completed (authentication working)
- ✅ At least one user has logged in (to test permissions)
- ✅ `user_permissions` table has test data (your email with super_admin role)

### What You'll Do
1. Insert test permission in Supabase Dashboard:
   ```sql
   INSERT INTO user_permissions (user_email, family_id, role)
   VALUES ('your-email@gmail.com', NULL, 'super_admin');
   ```
2. Test RLS policies by trying to edit data as different users
3. Verify permissions work correctly

### What I'll Do
- Provide SQL scripts for all RLS policies
- Update permission service if needed
- Ensure policies match the permission logic

### Implementation

#### Step 1: Enable RLS on All Tables

**Run in Supabase Dashboard SQL Editor:**

```sql
-- Enable RLS on all tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
```

#### Step 2: Create RLS Policies for `families` Table

```sql
-- Anyone can read families (public data)
CREATE POLICY "Families are viewable by everyone"
  ON families FOR SELECT
  USING (true);

-- Only admins/editors can update their family
CREATE POLICY "Family admins can update their family"
  ON families FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_email = auth.jwt() ->> 'email'
      AND (
        (user_permissions.role = 'super_admin' AND user_permissions.family_id IS NULL)
        OR (user_permissions.family_id = families.id AND user_permissions.role IN ('admin', 'editor'))
      )
    )
  );

-- Only super_admins can insert/delete families
CREATE POLICY "Super admins can manage families"
  ON families FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_email = auth.jwt() ->> 'email'
      AND user_permissions.role = 'super_admin'
      AND user_permissions.family_id IS NULL
    )
  );
```

#### Step 3: Create RLS Policies for `people` Table

```sql
-- Anyone can read people (public data)
CREATE POLICY "People are viewable by everyone"
  ON people FOR SELECT
  USING (true);

-- Admins/editors can update people in their family
CREATE POLICY "Family admins can update people in their family"
  ON people FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_email = auth.jwt() ->> 'email'
      AND (
        (user_permissions.role = 'super_admin' AND user_permissions.family_id IS NULL)
        OR (user_permissions.family_id = people.family_id AND user_permissions.role IN ('admin', 'editor'))
      )
    )
  );

-- Admins/editors can insert people in their family
CREATE POLICY "Family admins can insert people in their family"
  ON people FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_email = auth.jwt() ->> 'email'
      AND (
        (user_permissions.role = 'super_admin' AND user_permissions.family_id IS NULL)
        OR (user_permissions.family_id = people.family_id AND user_permissions.role IN ('admin', 'editor'))
      )
    )
  );

-- Only admins (not editors) can delete people
CREATE POLICY "Family admins can delete people in their family"
  ON people FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_email = auth.jwt() ->> 'email'
      AND (
        (user_permissions.role = 'super_admin' AND user_permissions.family_id IS NULL)
        OR (user_permissions.family_id = people.family_id AND user_permissions.role = 'admin')
      )
    )
  );
```

#### Step 4: Create RLS Policies for `user_permissions` Table

```sql
-- Users can view their own permissions
CREATE POLICY "Users can view their own permissions"
  ON user_permissions FOR SELECT
  USING (user_email = auth.jwt() ->> 'email');

-- Only super_admins can manage permissions
CREATE POLICY "Super admins can manage permissions"
  ON user_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_email = auth.jwt() ->> 'email'
      AND up.role = 'super_admin'
      AND up.family_id IS NULL
    )
  );
```

#### Step 5: Verify Permission Service

The `permissionService.js` created in Milestone 1 should already have the `checkFamilyPermission` function. Verify it works correctly.

### Deliverables Checklist

- [ ] RLS enabled on all tables
- [ ] `families` table policies created
- [ ] `people` table policies created
- [ ] `user_permissions` table policies created
- [ ] Test permission inserted in database
- [ ] Policies tested (super_admin can edit, regular user cannot)

### Acceptance Criteria

- ✅ Unauthenticated users can read data (public access)
- ✅ Authenticated users without permissions cannot edit
- ✅ Super admin can edit all families
- ✅ Family admin can only edit their assigned family
- ✅ RLS policies block unauthorized updates at database level
- ✅ Permission service returns correct permission status

---

## Milestone 6: Testing & Validation

### Objective
Comprehensive testing of all functionality, performance validation, and cleanup of old JSON files (optional).

### Prerequisites
- ✅ All previous milestones completed
- ✅ App deployed to preview/staging environment
- ✅ Test users created with different permission levels

### What You'll Do
- Test all functionality manually
- Report any bugs or issues
- Decide whether to archive or delete old JSON files
- Test in production environment

### What I'll Do
- Create testing checklist
- Help fix any bugs found
- Provide guidance on cleanup

### Testing Checklist

#### Functional Testing

- [ ] **Root Domain (`apna.family`)**
  - [ ] Landing page loads
  - [ ] Family list displays correctly
  - [ ] Clicking family navigates to subdomain

- [ ] **Family Portal (`grewal.apna.family`)**
  - [ ] Family page loads
  - [ ] Family tree displays correctly
  - [ ] Only family members shown (cluster optimization)
  - [ ] Theme colors applied correctly

- [ ] **Person Pages (`grewal.apna.family/baljit`)**
  - [ ] Minimal profiles load (from tree.json data)
  - [ ] Full profiles load (from profile_data JSONB)
  - [ ] Memorial data displays correctly
  - [ ] Event data displays correctly
  - [ ] Home videos display correctly
  - [ ] Gallery filters by personId correctly

- [ ] **Authentication**
  - [ ] Google login works
  - [ ] Microsoft login works
  - [ ] Sign out works
  - [ ] Auth state persists

- [ ] **Permissions**
  - [ ] Super admin can see "Can Edit" indicator
  - [ ] Family admin can see "Can Edit" for their family
  - [ ] Regular user cannot edit
  - [ ] RLS blocks unauthorized edits

#### Performance Testing

- [ ] **Load Times**
  - [ ] Root domain loads in < 2 seconds
  - [ ] Family portal loads in < 2 seconds
  - [ ] Person page loads in < 2 seconds
  - [ ] Compare to JSON version (should be similar)

- [ ] **Caching**
  - [ ] Navigating between pages uses cache
  - [ ] Cache expires after 5 minutes
  - [ ] Cache works per familyId

#### Data Integrity

- [ ] **Relationships**
  - [ ] All parent-child relationships display correctly
  - [ ] Partner relationships display correctly
  - [ ] No broken relationship links

- [ ] **Data Completeness**
  - [ ] All families migrated
  - [ ] All people migrated
  - [ ] All full profiles migrated
  - [ ] No missing data

### Cleanup (Optional)

**Decision Point:** Keep JSON files as backup or delete them?

**Option 1: Archive JSON Files**
```bash
mkdir -p archive/data
mv src/data/* archive/data/
```

**Option 2: Delete JSON Files** (Only after full validation)
```bash
# Be careful! Only do this after everything is validated
rm -rf src/data/tree.json
rm -rf src/data/families/
rm -rf src/data/people/
```

**Recommendation:** Archive first, delete later after production validation.

### Deliverables Checklist

- [ ] All functional tests passed
- [ ] Performance is acceptable
- [ ] Data integrity verified
- [ ] No console errors
- [ ] Production deployment tested
- [ ] JSON files archived (optional)

### Acceptance Criteria

- ✅ All pages load correctly
- ✅ All functionality works as before
- ✅ Performance is acceptable (within 20% of JSON version)
- ✅ Authentication works in production
- ✅ Permissions enforced correctly
- ✅ No data loss or corruption
- ✅ Ready for family members to use

---

## Rollback Plan

If issues arise during migration:

1. **Keep JSON files:** Don't delete JSON files until migration is fully validated
2. **Feature flag:** Add environment variable to toggle between JSON and Supabase:
   ```javascript
   const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === 'true'
   ```
3. **Quick revert:** Update `treeLoader.js` and `dataLoader.js` to use JSON if needed
4. **Database backup:** Supabase provides automatic backups, but export data before major changes

---

## Notes on Schema Management

As requested, schema changes will be managed through SQL scripts run directly in the Supabase Dashboard SQL Editor. This approach:

- **Pros:** Simple, no local Docker setup needed, works immediately
- **Cons:** No version control for schema changes (mitigated by keeping SQL in this guide)

**Best Practice:** Copy SQL snippets from this guide into Supabase Dashboard, run them, and document any custom changes you make.

---

## Next Steps

1. **Start with Milestone 0:** Set up database schema
2. **Complete each milestone sequentially:** Don't skip ahead
3. **Test after each milestone:** Verify everything works before moving on
4. **Ask for help:** If you encounter issues, stop and ask

**Ready to begin?** Start with Milestone 0: Database Schema Setup.

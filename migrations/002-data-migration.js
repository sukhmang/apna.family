/**
 * Migration 002: Data Migration
 * 
 * Migrates all data from JSON files to Supabase database
 * 
 * Run with: npm run migrate-to-supabase
 * 
 * Prerequisites:
 * - 001-schema-setup.sql must be run first
 * - .env.local must have SUPABASE_SERVICE_ROLE_KEY configured
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load environment variables - explicitly load .env.local and override any .env
// dotenv loads .env by default, so we need to be explicit
const envResult = dotenv.config({ path: '.env.local', override: true })

if (envResult.error) {
  console.error('❌ Error loading .env.local:', envResult.error)
  process.exit(1)
}

// Debug: Show what was loaded
console.log('📋 Environment file loaded: .env.local')

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Initialize Supabase client with service role (bypasses RLS)
const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Debug: Show which environment we're using
console.log('🔍 Environment Check:')
console.log(`   Supabase URL: ${supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING'}`)
console.log(`   Service Role Key: ${serviceRoleKey ? serviceRoleKey.substring(0, 20) + '...' : 'MISSING'}`)
console.log('')

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing Supabase environment variables')
  console.error('   Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  console.error('   Make sure these are set in .env.local')
  console.error('   Current values:')
  console.error(`     VITE_SUPABASE_URL: ${supabaseUrl || 'undefined'}`)
  console.error(`     SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? 'set' : 'undefined'}`)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

// Test connection
async function testConnection() {
  try {
    const { data, error } = await supabase.from('families').select('id').limit(1)
    if (error) {
      console.error('❌ Connection test failed:', error.message)
      throw error
    }
    console.log('✅ Connection test passed\n')
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error.message)
    console.error('   Please verify:')
    console.error('   1. Supabase URL is correct')
    console.error('   2. Service Role Key is correct')
    console.error('   3. Database is accessible')
    throw error
  }
}

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
  if (!existsSync(TREE_JSON)) {
    throw new Error(`Tree JSON file not found: ${TREE_JSON}`)
  }
  
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
 * Extract familyId from a person ID (format: "personId_familyId")
 * Only returns if it's a valid family ID
 */
function extractFamilyIdFromId(personId, validFamilyIds) {
  if (!personId) return null
  const parts = personId.split('_')
  if (parts.length >= 2) {
    const potentialFamilyId = parts[parts.length - 1] // Last part is familyId
    // Only return if it's actually a valid family
    if (validFamilyIds.has(potentialFamilyId)) {
      return potentialFamilyId
    }
  }
  return null
}

/**
 * Migrate people from tree.json
 */
async function migratePeople() {
  console.log('👥 Migrating people...')
  
  // Get valid family IDs from database
  const { data: families, error: familiesError } = await supabase
    .from('families')
    .select('id')

  if (familiesError) {
    console.error('❌ Error fetching families:', familiesError)
    throw familiesError
  }

  const validFamilyIds = new Set(families.map(f => f.id))
  console.log(`   Found ${validFamilyIds.size} valid families: ${Array.from(validFamilyIds).join(', ')}`)

  // Read tree.json
  const treeData = JSON.parse(readFileSync(TREE_JSON, 'utf-8'))
  const peopleFromTree = treeData.people || []

  // First pass: Build a map of person ID -> family ID for people we know
  const personFamilyMap = new Map()
  
  // First, map people with known familyIds (explicit or from ID)
  peopleFromTree.forEach(person => {
    let familyId = person.familyId
    
    // Only use explicit familyId if it's valid
    if (familyId && !validFamilyIds.has(familyId)) {
      familyId = null // Invalid familyId, ignore it
    }
    
    // Try to extract from ID if no explicit familyId
    if (!familyId) {
      familyId = extractFamilyIdFromId(person.id, validFamilyIds)
    }
    
    if (familyId) {
      personFamilyMap.set(person.id, familyId)
    }
  })

  // Second pass: Infer familyId from relationships for people without one
  let changed = true
  let iterations = 0
  const maxIterations = 10 // Prevent infinite loops

  while (changed && iterations < maxIterations) {
    changed = false
    iterations++

    peopleFromTree.forEach(person => {
      if (personFamilyMap.has(person.id)) {
        return // Already has familyId
      }

      // Try to infer from partners (most reliable)
      if (person.partners && person.partners.length > 0) {
        for (const partnerId of person.partners) {
          const partnerFamilyId = personFamilyMap.get(partnerId)
          if (partnerFamilyId) {
            personFamilyMap.set(person.id, partnerFamilyId)
            changed = true
            return
          }
        }
      }

      // Try to infer from parents
      if (person.parents && person.parents.length > 0) {
        for (const parentId of person.parents) {
          const parentFamilyId = personFamilyMap.get(parentId)
          if (parentFamilyId) {
            personFamilyMap.set(person.id, parentFamilyId)
            changed = true
            return
          }
        }
      }

      // Try to infer from children
      if (person.children && person.children.length > 0) {
        for (const childId of person.children) {
          const childFamilyId = personFamilyMap.get(childId)
          if (childFamilyId) {
            personFamilyMap.set(person.id, childFamilyId)
            changed = true
            return
          }
        }
      }
    })
  }

  // Check for people without familyId
  const peopleWithoutFamily = peopleFromTree.filter(p => !personFamilyMap.has(p.id))
  if (peopleWithoutFamily.length > 0) {
    console.warn(`⚠️  Warning: ${peopleWithoutFamily.length} people without familyId:`)
    peopleWithoutFamily.forEach(p => {
      console.warn(`   - ${p.id} (${p.firstName} ${p.lastName})`)
    })
    console.warn('   These will be skipped. You may need to manually assign familyId.')
  }

  // Build people array (only those with familyId)
  const peopleToInsert = peopleFromTree
    .filter(person => personFamilyMap.has(person.id))
    .map(person => {
      const familyId = personFamilyMap.get(person.id)

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
  let errorCount = 0

  for (const filename of peopleFiles) {
    try {
      // Parse filename: "grewal-baljit.json" -> {familyId: "grewal", personId: "baljit"}
      const parts = filename.replace('.json', '').split('-')
      if (parts.length < 2) {
        console.warn(`⚠️  Skipping ${filename}: Invalid filename format (expected: familyId-personId.json)`)
        errorCount++
        continue
      }

      const familyId = parts[0]
      const personId = parts.slice(1).join('-') // Handle cases like "grewal-baljit-singh.json"
      const treeId = `${personId}_${familyId}`

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
        console.error(`❌ Error migrating profile for ${treeId}:`, error.message)
        errorCount++
        continue
      }

      migratedCount++
      console.log(`   ✓ Migrated profile: ${treeId}`)
    } catch (error) {
      console.error(`❌ Error processing ${filename}:`, error.message)
      errorCount++
    }
  }

  console.log(`✅ Migrated ${migratedCount} full profiles`)
  if (errorCount > 0) {
    console.warn(`⚠️  ${errorCount} profiles had errors`)
  }
  return migratedCount
}

/**
 * Validate migration
 */
async function validateMigration() {
  console.log('\n🔍 Validating migration...')

  // Count families
  const { count: familyCount, error: familyError } = await supabase
    .from('families')
    .select('*', { count: 'exact', head: true })

  if (familyError) {
    console.error('❌ Error counting families:', familyError)
    return
  }

  // Count people
  const { count: peopleCount, error: peopleError } = await supabase
    .from('people')
    .select('*', { count: 'exact', head: true })

  if (peopleError) {
    console.error('❌ Error counting people:', peopleError)
    return
  }

  // Count full profiles
  const { count: fullProfileCount, error: profileError } = await supabase
    .from('people')
    .select('*', { count: 'exact', head: true })
    .eq('has_full_profile', true)

  if (profileError) {
    console.error('❌ Error counting full profiles:', profileError)
    return
  }

  console.log(`📊 Migration Summary:`)
  console.log(`   Families: ${familyCount}`)
  console.log(`   People: ${peopleCount}`)
  console.log(`   Full Profiles: ${fullProfileCount}`)

  // Check for orphaned relationships
  const { data: people, error: peopleDataError } = await supabase
    .from('people')
    .select('id, parents, children, partners')

  if (peopleDataError) {
    console.error('❌ Error fetching people for validation:', peopleDataError)
    return
  }

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

  // Check for people with invalid family_id
  const { data: families } = await supabase
    .from('families')
    .select('id')

  const validFamilyIds = new Set(families.map(f => f.id))
  const { data: invalidPeople } = await supabase
    .from('people')
    .select('id, family_id')
    .not('family_id', 'in', `(${Array.from(validFamilyIds).map(id => `"${id}"`).join(',')})`)

  if (invalidPeople && invalidPeople.length > 0) {
    console.warn(`⚠️  Found ${invalidPeople.length} people with invalid family_id:`)
    invalidPeople.forEach(p => {
      console.warn(`   - ${p.id} has family_id: ${p.family_id}`)
    })
  } else {
    console.log('✅ All people have valid family_id references')
  }
}

/**
 * Main migration function
 */
async function main() {
  try {
    console.log('🚀 Starting migration...\n')
    console.log(`📡 Connecting to: ${supabaseUrl}\n`)

    // Test connection first
    await testConnection()

    await migrateFamilies()
    await migratePeople()
    await migrateFullProfiles()
    await validateMigration()

    console.log('\n✅ Migration completed successfully!')
    console.log('\n💡 Next steps:')
    console.log('   1. Verify data in Supabase Dashboard')
    console.log('   2. Test queries using the service layer')
    console.log('   3. Proceed to Milestone 3: Frontend Refactor')
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
main()

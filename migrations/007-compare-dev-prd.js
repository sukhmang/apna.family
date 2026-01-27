#!/usr/bin/env node

/**
 * Compare DEV and PRD Databases
 * 
 * This script compares record counts and key data between DEV and PRD Supabase databases
 * to ensure they match after migration.
 * 
 * Usage:
 *   1. Set DEV credentials in .env.local
 *   2. Set PRD credentials in .env.prd (create this file)
 *   3. Run: node migrations/007-compare-dev-prd.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

const DEV_URL = process.env.VITE_SUPABASE_URL
const DEV_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// For PRD, set these environment variables
// You can also create .env.prd and load it: dotenv.config({ path: '.env.prd' })
// IMPORTANT: Never hardcode service role keys in source code!
const PRD_URL = process.env.PRD_SUPABASE_URL
const PRD_KEY = process.env.PRD_SERVICE_ROLE_KEY

if (!DEV_URL || !DEV_KEY) {
  console.error('❌ Missing DEV credentials in .env.local')
  console.error('   Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (!PRD_URL || !PRD_KEY) {
  console.error('❌ Missing PRD credentials')
  console.error('   Set PRD_SUPABASE_URL and PRD_SERVICE_ROLE_KEY environment variables')
  console.error('   Or create .env.prd file with these values')
  process.exit(1)
}

const devClient = createClient(DEV_URL, DEV_KEY)
const prdClient = createClient(PRD_URL, PRD_KEY)

async function getCounts(client, envName) {
  console.log(`\n📊 Fetching counts from ${envName}...`)
  
  const [families, people, permissions] = await Promise.all([
    client.from('families').select('*', { count: 'exact', head: true }),
    client.from('people').select('*', { count: 'exact', head: true }),
    client.from('user_permissions').select('*', { count: 'exact', head: true })
  ])
  
  return {
    families: families.count || 0,
    people: people.count || 0,
    permissions: permissions.count || 0
  }
}

async function getFamilyDetails(client, envName) {
  console.log(`\n📋 Fetching family details from ${envName}...`)
  
  const { data, error } = await client
    .from('families')
    .select('id, display_name, head_id')
    .order('id')
  
  if (error) throw error
  return data || []
}

async function getPeopleByFamily(client, envName) {
  console.log(`\n👥 Fetching people by family from ${envName}...`)
  
  const { data, error } = await client
    .from('people')
    .select('family_id')
  
  if (error) throw error
  
  const byFamily = {}
  data.forEach(person => {
    const familyId = person.family_id || 'null'
    byFamily[familyId] = (byFamily[familyId] || 0) + 1
  })
  
  return byFamily
}

async function getPermissions(client, envName) {
  console.log(`\n🔐 Fetching permissions from ${envName}...`)
  
  const { data, error } = await client
    .from('user_permissions')
    .select('user_email, family_id, role')
    .order('user_email')
  
  if (error) throw error
  return data || []
}

async function compareDatabases() {
  console.log('='.repeat(60))
  console.log('🔍 Comparing DEV and PRD Databases')
  console.log('='.repeat(60))
  
  try {
    // Get counts
    const devCounts = await getCounts(devClient, 'DEV')
    const prdCounts = await getCounts(prdClient, 'PRD')
    
    // Get details
    const devFamilies = await getFamilyDetails(devClient, 'DEV')
    const prdFamilies = await getFamilyDetails(prdClient, 'PRD')
    
    const devPeopleByFamily = await getPeopleByFamily(devClient, 'DEV')
    const prdPeopleByFamily = await getPeopleByFamily(prdClient, 'PRD')
    
    const devPermissions = await getPermissions(devClient, 'DEV')
    const prdPermissions = await getPermissions(prdClient, 'PRD')
    
    // Compare counts
    console.log('\n' + '='.repeat(60))
    console.log('📊 COUNT COMPARISON')
    console.log('='.repeat(60))
    
    const countMatches = {
      families: devCounts.families === prdCounts.families,
      people: devCounts.people === prdCounts.people,
      permissions: devCounts.permissions === prdCounts.permissions
    }
    
    console.log(`\nFamilies:   DEV=${devCounts.families}  PRD=${prdCounts.families}  ${countMatches.families ? '✅' : '❌'}`)
    console.log(`People:     DEV=${devCounts.people}  PRD=${prdCounts.people}  ${countMatches.people ? '✅' : '❌'}`)
    console.log(`Permissions: DEV=${devCounts.permissions}  PRD=${prdCounts.permissions}  ${countMatches.permissions ? '✅' : '❌'}`)
    
    // Compare families
    console.log('\n' + '='.repeat(60))
    console.log('👨‍👩‍👧‍👦 FAMILY COMPARISON')
    console.log('='.repeat(60))
    
    const devFamilyIds = new Set(devFamilies.map(f => f.id))
    const prdFamilyIds = new Set(prdFamilies.map(f => f.id))
    
    const missingInPRD = [...devFamilyIds].filter(id => !prdFamilyIds.has(id))
    const extraInPRD = [...prdFamilyIds].filter(id => !devFamilyIds.has(id))
    
    if (missingInPRD.length > 0) {
      console.log(`\n❌ Missing in PRD: ${missingInPRD.join(', ')}`)
    }
    if (extraInPRD.length > 0) {
      console.log(`\n⚠️  Extra in PRD: ${extraInPRD.join(', ')}`)
    }
    if (missingInPRD.length === 0 && extraInPRD.length === 0) {
      console.log('\n✅ All families match!')
    }
    
    // Compare people by family
    console.log('\n' + '='.repeat(60))
    console.log('👥 PEOPLE BY FAMILY COMPARISON')
    console.log('='.repeat(60))
    
    const allFamilyIds = new Set([...Object.keys(devPeopleByFamily), ...Object.keys(prdPeopleByFamily)])
    let peopleMatch = true
    
    for (const familyId of allFamilyIds) {
      const devCount = devPeopleByFamily[familyId] || 0
      const prdCount = prdPeopleByFamily[familyId] || 0
      const match = devCount === prdCount
      
      if (!match) {
        peopleMatch = false
        console.log(`\n❌ ${familyId}: DEV=${devCount}  PRD=${prdCount}`)
      }
    }
    
    if (peopleMatch) {
      console.log('\n✅ People counts match for all families!')
    }
    
    // Compare permissions
    console.log('\n' + '='.repeat(60))
    console.log('🔐 PERMISSIONS COMPARISON')
    console.log('='.repeat(60))
    
    const devPermsKey = devPermissions.map(p => `${p.user_email}|${p.family_id || 'null'}|${p.role}`).sort()
    const prdPermsKey = prdPermissions.map(p => `${p.user_email}|${p.family_id || 'null'}|${p.role}`).sort()
    
    const permsMatch = JSON.stringify(devPermsKey) === JSON.stringify(prdPermsKey)
    
    if (permsMatch) {
      console.log('\n✅ Permissions match!')
    } else {
      console.log('\n❌ Permissions differ:')
      console.log('\nDEV Permissions:')
      devPermissions.forEach(p => {
        console.log(`  - ${p.user_email} | ${p.family_id || 'null'} | ${p.role}`)
      })
      console.log('\nPRD Permissions:')
      prdPermissions.forEach(p => {
        console.log(`  - ${p.user_email} | ${p.family_id || 'null'} | ${p.role}`)
      })
    }
    
    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📋 SUMMARY')
    console.log('='.repeat(60))
    
    const allMatch = 
      countMatches.families &&
      countMatches.people &&
      countMatches.permissions &&
      missingInPRD.length === 0 &&
      extraInPRD.length === 0 &&
      peopleMatch &&
      permsMatch
    
    if (allMatch) {
      console.log('\n✅ SUCCESS: DEV and PRD databases match!')
    } else {
      console.log('\n❌ WARNING: Databases do not match. Review differences above.')
    }
    
    console.log('\n')
    
  } catch (error) {
    console.error('\n❌ Error comparing databases:', error)
    process.exit(1)
  }
}

compareDatabases()

-- ==========================================
-- Migration 001: Database Schema Setup
-- ==========================================
-- Run this SQL script in Supabase Dashboard SQL Editor
-- Execute in DEV environment first, then PRD
-- 
-- This creates all tables, indexes, and triggers needed for the application
-- ==========================================

-- ==========================================
-- STEP 1: Create Helper Function
-- ==========================================
-- This function automatically updates the updated_at timestamp
-- when any record is modified

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- STEP 2: Create families Table
-- ==========================================
-- Stores family-level configuration (themes, display names, settings)

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

-- ==========================================
-- STEP 3: Create people Table
-- ==========================================
-- Stores all person data (both minimal and full profiles)

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

-- ==========================================
-- STEP 4: Create user_permissions Table
-- ==========================================
-- Role-based access control for family "zones"

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

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
-- Run these after creating all tables to verify everything is set up correctly

-- Check that all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('families', 'people', 'user_permissions')
ORDER BY table_name;

-- Check that all indexes exist
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('families', 'people', 'user_permissions')
ORDER BY tablename, indexname;

-- Check that triggers exist
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND event_object_table IN ('families', 'people', 'user_permissions')
ORDER BY event_object_table, trigger_name;

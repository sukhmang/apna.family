-- ==========================================
-- Migration 003: Add Super Admin Permission
-- ==========================================
-- Run this in Supabase Dashboard SQL Editor
-- 
-- This gives super_admin access to manage all families
-- Update the email address before running
-- ==========================================

-- Insert super_admin permission (family_id = NULL means can edit all families)
INSERT INTO user_permissions (user_email, family_id, role)
VALUES ('sukhman.s.grewal@gmail.com', NULL, 'super_admin')
ON CONFLICT (user_email, family_id) 
DO UPDATE SET role = 'super_admin';

-- Verify the permission was created
SELECT * FROM user_permissions 
WHERE user_email = 'sukhman.s.grewal@gmail.com';

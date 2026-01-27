# Database Migrations

This folder contains one-time migration scripts for setting up the Supabase database. Execute them in numerical order.

## Migration Order

### 001-schema-setup.sql
**Purpose:** Create all database tables, indexes, and triggers

**When to run:** First, before any data migration

**How to run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the entire contents of `001-schema-setup.sql`
3. Click "Run" (or press Cmd/Ctrl + Enter)
4. Verify all tables are created (check verification queries at bottom)
5. Repeat in PRD environment after DEV is validated

**What it creates:**
- Helper function: `update_updated_at_column()`
- Table: `families` (family configuration)
- Table: `people` (all person data)
- Table: `user_permissions` (role-based access control)
- All indexes and triggers

---

### 002-data-migration.js
**Purpose:** Migrate all data from JSON files to Supabase database

**When to run:** After schema is created (001)

**How to run:**
```bash
npm run migrate-to-supabase
```

**Prerequisites:**
- `.env.local` configured with Supabase credentials
- `SUPABASE_SERVICE_ROLE_KEY` set (required to bypass RLS)
- Schema tables created (001-schema-setup.sql)

**What it migrates:**
- Families from `src/data/tree.json` and `src/data/families/*.json`
- People from `src/data/tree.json`
- Full profiles from `src/data/people/*.json` files

**Notes:**
- Idempotent (safe to run multiple times)
- Handles relationship inference for people without explicit familyId
- Validates data integrity after migration

---

### 003-add-super-admin.sql
**Purpose:** Add super admin permission for initial user

**When to run:** After data migration (002), or anytime you need to add a super admin

**How to run:**
1. Open Supabase Dashboard → SQL Editor
2. Update the email address in the script (replace `sukhman.s.grewal@gmail.com`)
3. Copy and paste the SQL
4. Click "Run"
5. Verify permission was created

**What it does:**
- Inserts super_admin permission (family_id = NULL means can edit all families)
- Uses `ON CONFLICT` to update if permission already exists

**To add more super admins:**
- Run the script again with a different email
- Or manually insert: `INSERT INTO user_permissions (user_email, family_id, role) VALUES ('email@example.com', NULL, 'super_admin')`

---

### 005-rls-policies.sql
**Purpose:** Enable Row Level Security (RLS) and create security policies

**When to run:** After authentication is working (Milestone 4), before testing permissions

**How to run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the entire contents of `005-rls-policies.sql`
3. Click "Run" (or press Cmd/Ctrl + Enter)
4. Verify policies are created (check verification queries at bottom)

**What it does:**
- Enables RLS on `families`, `people`, and `user_permissions` tables
- Creates policies for public read access
- Creates policies for role-based edit access (super_admin, admin, editor)
- Enforces permissions at the database level

**Important Notes:**
- RLS policies enforce security at the database level
- Even if frontend code tries to edit, RLS will block unauthorized changes
- Super admins can edit all families
- Family admins/editors can only edit their assigned family
- Unauthenticated users can read but not edit

**Testing:**
- After running, test that logged-in users can read data
- Test that super_admin can edit
- Test that users without permissions cannot edit (should get RLS error)

---

## Environment Setup

Before running migrations, ensure `.env.local` is configured:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Important:** The migration script (002) requires `SUPABASE_SERVICE_ROLE_KEY` to bypass Row Level Security (RLS) policies.

---

## Migration Checklist

### Initial Setup (First Time)
- [ ] Run `001-schema-setup.sql` in DEV
- [ ] Verify tables created in Supabase Dashboard
- [ ] Run `002-data-migration.js` in DEV
- [ ] Verify data in Supabase Dashboard
- [ ] Run `003-add-super-admin.sql` in DEV
- [ ] Test app functionality
- [ ] Run `005-rls-policies.sql` in DEV (after authentication works)
- [ ] Test permissions and RLS policies
- [ ] Repeat all steps in PRD

### Adding New Super Admin
- [ ] Run `003-add-super-admin.sql` with new email
- [ ] Verify permission in Supabase Dashboard

---

## Troubleshooting

### "relation already exists" error
- Tables already exist. Safe to ignore or drop tables first if needed.

### "foreign key constraint" error
- Ensure `001-schema-setup.sql` was run first
- Check that all referenced families exist

### Migration script fails
- Verify `.env.local` has correct credentials
- Check that `SUPABASE_SERVICE_ROLE_KEY` is set (not just anon key)
- Ensure schema tables exist (run 001 first)

---

## Notes

- These are **one-time migrations** for initial setup
- Future schema changes should be managed through Supabase Dashboard SQL Editor
- Keep JSON files as backup until migration is fully validated
- Migration scripts are idempotent (safe to re-run)

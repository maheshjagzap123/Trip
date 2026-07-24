# ExpenseX Database Migration

Run these queries in your Supabase SQL Editor in ORDER.

## Important Notes
- We use `expense_groups` instead of `groups` because `groups` is a SQL reserved word.
- We keep the old table names as views for backward compatibility during migration.
- RPC functions are updated to work with new table names.

---

## Step 1: Add group_type column to trips table

```sql
-- Add group_type column (defaults to 'Trip' for existing rows)
ALTER TABLE trips ADD COLUMN IF NOT EXISTS group_type TEXT DEFAULT 'Trip';

-- Make start_date and end_date nullable (non-trip groups don't need dates)
ALTER TABLE trips ALTER COLUMN start_date DROP NOT NULL;
ALTER TABLE trips ALTER COLUMN end_date DROP NOT NULL;

-- Update existing trip_type to group_type for existing records
UPDATE trips SET group_type = COALESCE(trip_type, 'Trip') WHERE group_type IS NULL OR group_type = 'Trip';
```

## Step 2: Rename tables (optional — only if you want clean naming)

> **IMPORTANT**: If your app is in production with users, skip this step and just use the existing table names. The app code still references `trips`, `trip_members`, etc. via Supabase client — those names still work.
>
> Only run this if you're in development and want clean table names from the start.

```sql
-- OPTIONAL: Rename tables (ONLY for fresh/dev databases)
-- ALTER TABLE trips RENAME TO expense_groups;
-- ALTER TABLE trip_members RENAME TO group_members;
-- ALTER TABLE trip_notes RENAME TO group_notes;

-- If you rename, create views for backward compatibility:
-- CREATE VIEW trips AS SELECT * FROM expense_groups;
-- CREATE VIEW trip_members AS SELECT * FROM group_members;
-- CREATE VIEW trip_notes AS SELECT * FROM group_notes;
```

## Step 3: Update the universal expense categories

```sql
-- No schema change needed. Categories are stored as text in the expenses table.
-- The app now sends new category names. Old categories still work.
```

## Step 4: Update notification templates (if using Edge Functions)

In your `send-invite-email` Edge Function, update text:
- "TripWise" → "ExpenseX"
- "trip" → "group"
- "Trip Invite" → "Group Invite"

## Step 5: Update RPC functions (if needed)

If your `get_trip_timeline` RPC references hard-coded "trip" text in its response, update it:

```sql
-- Example: If you have notification insert triggers that say "Trip Created"
-- Update them to say "Group Created"

-- Check your existing functions:
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
```

## Step 6: Add preferred_categories to profiles (optional)

```sql
-- The app already uses travel_interests column for this purpose.
-- No schema change needed — just the UI label changed.
```

---

## Summary of what changed in the database:

| Change | Action Required |
|--------|----------------|
| `group_type` column on trips | YES — run Step 1 |
| Make dates nullable | YES — run Step 1 |
| Table renames | OPTIONAL — only for dev |
| Categories | NO — app handles this |
| Notification text | Update Edge Functions manually |
| Profile interests → categories | NO — reuses same column |

---

## Verification Queries

After running migrations, verify:

```sql
-- Check group_type column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'trips' AND column_name = 'group_type';

-- Check dates are nullable
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'trips' AND column_name IN ('start_date', 'end_date');

-- Count existing trips (should all have group_type now)
SELECT group_type, COUNT(*) FROM trips GROUP BY group_type;
```

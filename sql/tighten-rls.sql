-- ============================================================
-- TIGHTEN RLS POLICIES — Run in Supabase SQL Editor
-- ============================================================
-- This removes public INSERT/UPDATE on results and brackets
-- so only authenticated admin (or service role) can modify them.
-- Public users can still READ everything and INSERT brackets/contributions.
-- ============================================================

-- 1. RESULTS TABLE — Remove public insert/update (only admin should enter results)
DROP POLICY IF EXISTS "Allow public insert on results" ON public."0013_m2a_results";
DROP POLICY IF EXISTS "Allow public update on results" ON public."0013_m2a_results";

-- Keep public read so the leaderboard works
-- (Already exists: "Allow public read on results")

-- 2. BRACKETS TABLE — Remove public UPDATE (users can insert, not modify others' brackets)
-- The save_bracket RPC function runs with SECURITY DEFINER and bypasses RLS,
-- so legitimate bracket saves still work. Direct PATCH by malicious users is blocked.
DROP POLICY IF EXISTS "Allow public update on brackets" ON public."0013_m2a_bracket";

-- Keep public read (leaderboard) and insert (new brackets)
-- (Already exist: "Allow public read on brackets", "Allow public insert on brackets")

-- 3. Add rotary_club column to contributions (if not already present)
ALTER TABLE public."0013_m2a_contributions"
  ADD COLUMN IF NOT EXISTS rotary_club text DEFAULT ''::text;

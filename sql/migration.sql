-- ============================================================
-- March -2- Africa Bracket Challenge — Supabase Migration
-- Run this in the Supabase SQL Editor to create all tables.
-- Safe to run multiple times (uses IF NOT EXISTS / OR REPLACE).
-- ============================================================

-- 1. Bracket Submissions
-- If table already exists, add missing columns. If not, create it.
CREATE TABLE IF NOT EXISTS public."0013_m2a_bracket" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  picks jsonb NOT NULL DEFAULT '{}'::jsonb,
  champion text NOT NULL DEFAULT ''::text,
  donation_amount numeric NULL DEFAULT 0,
  ghl_synced boolean NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT "0013_m2a_bracket_pkey" PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Add scoring columns if they don't exist yet
-- (handles tables created before scoring was added)
ALTER TABLE public."0013_m2a_bracket"
  ADD COLUMN IF NOT EXISTS champ_score1 integer DEFAULT 0;

ALTER TABLE public."0013_m2a_bracket"
  ADD COLUMN IF NOT EXISTS champ_score2 integer DEFAULT 0;

ALTER TABLE public."0013_m2a_bracket"
  ADD COLUMN IF NOT EXISTS total_score integer DEFAULT 0;

-- Bracket name column (allows multiple brackets per email)
ALTER TABLE public."0013_m2a_bracket"
  ADD COLUMN IF NOT EXISTS bracket_name text DEFAULT ''::text;

-- Unique constraint: one bracket per email + bracket_name combination
-- (allows updates on resubmit while permitting multiple named brackets)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bracket_email_name
  ON public."0013_m2a_bracket" (email, bracket_name);

-- Index for leaderboard queries (score DESC, then by submission time)
CREATE INDEX IF NOT EXISTS idx_bracket_score
  ON public."0013_m2a_bracket" (total_score DESC, created_at ASC);

-- Index for email lookups (returning users / update-on-resubmit)
CREATE INDEX IF NOT EXISTS idx_bracket_email
  ON public."0013_m2a_bracket" (email);


-- 2. Tournament Results
-- Admin enters actual game results here. The scoring engine compares
-- each user's picks against these results to calculate scores.
CREATE TABLE IF NOT EXISTS public."0013_m2a_results" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  game_id text NOT NULL,
  winner text NOT NULL,
  winner_seed integer NULL,
  score_team1 integer NULL,
  score_team2 integer NULL,
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT "0013_m2a_results_pkey" PRIMARY KEY (id),
  CONSTRAINT "0013_m2a_results_game_id_key" UNIQUE (game_id)
) TABLESPACE pg_default;


-- 3. Entrepreneur Votes / Donations
-- Each row = one donation allocated to a specific entrepreneur.
CREATE TABLE IF NOT EXISTS public."0013_m2a_entrepreneur_votes" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  entrepreneur_id text NOT NULL,
  entrepreneur_name text NOT NULL,
  donor_first_name text NULL,
  donor_last_name text NULL,
  donor_email text NULL,
  amount numeric NOT NULL DEFAULT 5,
  stripe_session_id text NULL,
  week integer NULL DEFAULT 1,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT "0013_m2a_entrepreneur_votes_pkey" PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Index for tallying votes per entrepreneur per week
CREATE INDEX IF NOT EXISTS idx_ent_votes_entrepreneur
  ON public."0013_m2a_entrepreneur_votes" (entrepreneur_id, week);


-- 4. Contributions (already exists — alter to allow general donations)
-- Make entrepreneur_id nullable so general donations (not tied to a specific
-- entrepreneur) can be recorded alongside entrepreneur-specific boosts.
ALTER TABLE public."0013_m2a_contributions"
  ALTER COLUMN entrepreneur_id DROP NOT NULL;

-- Drop FK constraint if it prevents NULL inserts; re-add as optional
ALTER TABLE public."0013_m2a_contributions"
  DROP CONSTRAINT IF EXISTS "0013_m2a_contributions_entrepreneur_id_fkey";

ALTER TABLE public."0013_m2a_contributions"
  ADD CONSTRAINT "0013_m2a_contributions_entrepreneur_id_fkey"
  FOREIGN KEY (entrepreneur_id) REFERENCES public."0013_m2a_entrepreneurs"(id)
  ON DELETE SET NULL;


-- 5. Populate entrepreneurs table with all 11 entrepreneurs
-- (Uses ON CONFLICT DO NOTHING if they already exist by name check)
INSERT INTO public."0013_m2a_entrepreneurs" (name, business_name, description, business_plan_url, image_url, funding_goal, is_active)
SELECT * FROM (VALUES
  ('Kate Nanyangwe',         'Nails By Kate & Hair Salon',    'Zambia',  'https://entrapov.com/wp-content/uploads/2026/03/Nails-By-Kate-Business-Plan.docx.pdf',                                             'https://entrapov.com/wp-content/uploads/2026/03/Snip20260314_2.png',       500, true),
  ('Jane Ndashe',            'JP Enterprise',                 'Zambia',  'https://entrapov.com/wp-content/uploads/2026/03/Entrapov-Business-Plan-JP-ENTERPRISE.docx.pdf',                                     'https://entrapov.com/wp-content/uploads/2026/03/Snip20260314_1.png',       500, true),
  ('Nanyangwe Katai',        'Chichi Braids',                 'Zambia',  'https://entrapov.com/wp-content/uploads/2026/02/Entrapov-Business-Plan-CHICHI-BRAIDS.docx.pdf',                                     'https://entrapov.com/wp-content/uploads/2026/02/Snip20260226_1.png',       500, true),
  ('Saukilan Kapatamoyo',    'God''s Grace Detergent',        'Malawi',  'https://entrapov.com/wp-content/uploads/2026/02/Saukilan-Kapatamoyo.docx.pdf',                                                     'https://entrapov.com/wp-content/uploads/2026/02/Gods-Grace-Detergent-604x620.jpg', 500, true),
  ('Sandra Chisala',         'High Voltage Fabrication',      'Zambia',  'https://entrapov.com/wp-content/uploads/2026/02/HIGH-VOLTAGE-BUSINESS-PLAN.docx.pdf',                                              'https://entrapov.com/wp-content/uploads/2026/02/Snip20260214_1.png',       500, true),
  ('Kendrick B. Makhurane',  'Key B Manufacturers',           'Lesotho', 'https://entrapov.com/wp-content/uploads/2026/02/Key-B_Business-Plan.docx-1-1.docx-3.pdf',                                          'https://entrapov.com/wp-content/uploads/2026/02/Snip20260213_7-686x620.png', 500, true),
  ('Lyampu Mubiana',         'Lyamupu''s Pastry Kitchen',     'Zambia',  'https://entrapov.com/wp-content/uploads/2026/01/Lyamupus-Pastry-Kitchen.docx.pdf',                                                 'https://entrapov.com/wp-content/uploads/2026/01/Snip20260126_2.png',       500, true),
  ('Monica Ntchalachala',    'Femmo Second Hand Clothes',     'Malawi',  'https://entrapov.com/wp-content/uploads/2026/01/1754573627541_1754573623418_Entrapov-Business-Plan-Template-Monica.docx-1.pdf',     'https://entrapov.com/wp-content/uploads/2026/01/Snip20260123_4.png',       500, true),
  ('Enrique Hannock',        'Nexora Technology Company',     'Kenya',   'https://entrapov.com/wp-content/uploads/2026/01/ENRIQUE-HANNOCK-PROPOSAL.pdf.pdf',                                                 'https://entrapov.com/wp-content/uploads/2026/01/Snip20260113_2-536x620.png', 500, true),
  ('Jibril',                 'TBD',                           'Kenya',   '', '', 500, true),
  ('Esther Ruhara',          'TBD',                           'Kenya',   '', '', 500, true)
) AS v(name, business_name, description, business_plan_url, image_url, funding_goal, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public."0013_m2a_entrepreneurs" e WHERE e.name = v.name);


-- 6. Leaderboard View
-- Ranks users by total_score, then by closest predicted championship
-- total to 140 (average championship combined score), then by
-- earliest submission.
CREATE OR REPLACE VIEW public."0013_m2a_leaderboard" AS
SELECT
  id,
  first_name,
  last_name,
  bracket_name,
  champion,
  total_score,
  champ_score1,
  champ_score2,
  (COALESCE(champ_score1, 0) + COALESCE(champ_score2, 0)) AS tiebreaker_total,
  created_at,
  ROW_NUMBER() OVER (
    ORDER BY total_score DESC,
    ABS((COALESCE(champ_score1, 0) + COALESCE(champ_score2, 0)) - 140) ASC,
    created_at ASC
  ) AS rank
FROM public."0013_m2a_bracket"
ORDER BY total_score DESC,
  ABS((COALESCE(champ_score1, 0) + COALESCE(champ_score2, 0)) - 140) ASC,
  created_at ASC;


-- 5. Entrepreneur Totals View
-- Tallies total raised per entrepreneur for each week.
CREATE OR REPLACE VIEW public."0013_m2a_entrepreneur_totals" AS
SELECT
  entrepreneur_id,
  entrepreneur_name,
  week,
  SUM(amount) AS total_raised,
  COUNT(*) AS vote_count
FROM public."0013_m2a_entrepreneur_votes"
GROUP BY entrepreneur_id, entrepreneur_name, week
ORDER BY week, total_raised DESC;


-- 6. Row Level Security (RLS)
ALTER TABLE public."0013_m2a_bracket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."0013_m2a_results" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."0013_m2a_entrepreneur_votes" ENABLE ROW LEVEL SECURITY;

-- Policies: public read + insert on brackets
-- (DROP first so re-running is safe)
DROP POLICY IF EXISTS "Allow public read on brackets" ON public."0013_m2a_bracket";
CREATE POLICY "Allow public read on brackets"
  ON public."0013_m2a_bracket" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on brackets" ON public."0013_m2a_bracket";
CREATE POLICY "Allow public insert on brackets"
  ON public."0013_m2a_bracket" FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on brackets" ON public."0013_m2a_bracket";
CREATE POLICY "Allow public update on brackets"
  ON public."0013_m2a_bracket" FOR UPDATE USING (true) WITH CHECK (true);

-- Policies: public read + insert + update on results (admin enters via dashboard)
DROP POLICY IF EXISTS "Allow public read on results" ON public."0013_m2a_results";
CREATE POLICY "Allow public read on results"
  ON public."0013_m2a_results" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on results" ON public."0013_m2a_results";
CREATE POLICY "Allow public insert on results"
  ON public."0013_m2a_results" FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on results" ON public."0013_m2a_results";
CREATE POLICY "Allow public update on results"
  ON public."0013_m2a_results" FOR UPDATE USING (true) WITH CHECK (true);

-- Policies: public read + insert on contributions
ALTER TABLE public."0013_m2a_contributions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on contributions" ON public."0013_m2a_contributions";
CREATE POLICY "Allow public read on contributions"
  ON public."0013_m2a_contributions" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on contributions" ON public."0013_m2a_contributions";
CREATE POLICY "Allow public insert on contributions"
  ON public."0013_m2a_contributions" FOR INSERT WITH CHECK (true);

-- Policies: public read on entrepreneurs (needed for name → UUID lookup)
ALTER TABLE public."0013_m2a_entrepreneurs" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on entrepreneurs" ON public."0013_m2a_entrepreneurs";
CREATE POLICY "Allow public read on entrepreneurs"
  ON public."0013_m2a_entrepreneurs" FOR SELECT USING (true);

-- Policies: public read + insert on entrepreneur votes
DROP POLICY IF EXISTS "Allow public read on entrepreneur votes" ON public."0013_m2a_entrepreneur_votes";
CREATE POLICY "Allow public read on entrepreneur votes"
  ON public."0013_m2a_entrepreneur_votes" FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on entrepreneur votes" ON public."0013_m2a_entrepreneur_votes";
CREATE POLICY "Allow public insert on entrepreneur votes"
  ON public."0013_m2a_entrepreneur_votes" FOR INSERT WITH CHECK (true);


-- ============================================================
-- SCORING SYSTEM REFERENCE
-- ============================================================
-- Round 1 (R64):     5 points per correct pick  (32 games = 160 max)
-- Round 2 (R32):    10 points per correct pick  (16 games = 160 max)
-- Round 3 (S16):    20 points per correct pick  ( 8 games = 160 max)
-- Round 4 (E8):     40 points per correct pick  ( 4 games = 160 max)
-- Finals:          80 points per correct pick  ( 2 games = 160 max)
-- Championship:    160 points per correct pick  ( 1 game  = 160 max)
-- ─────────────────────────────────────────────────────────────
-- Maximum possible score: 960 points
--
-- ESPN uses: 10/20/40/80/160/320 (max 1920) — same ratio, 2x values
--
-- Tiebreaker: Closest predicted championship total score (avg ~140)
-- ============================================================

-- ============================================================
-- GAME ID REFERENCE
-- ============================================================
-- Regional games: {region}-r{round}-g{game}
--   e.g. east-r1-g1, midwest-r3-g2
-- Finals:         ff-semi1, ff-semi2
-- Championship:   ff-champ
-- ============================================================

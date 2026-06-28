-- ============================================================
-- Wet Olympics — isolated schema for the 5-game tournament app.
-- Run as a user with privileges on the wet_olympics database
-- (or whichever DB you point DATABASE_URL at).
-- ============================================================

CREATE SCHEMA IF NOT EXISTS wet_olympics;
SET search_path TO wet_olympics, public;

-- One row per tournament night. Each event is independent — its own teams,
-- its own brackets, its own time slots and game order.
-- `schedule_override` is a JSONB map of game_slug → { start: 'HH:MM', end: 'HH:MM' }
-- merged on top of the defaults in lib/games.ts.
-- `order_override` is a JSONB array of game slugs, e.g. ["beer-pong","table-tennis",...].
-- Both are nullable — when null, the defaults from code are used.
CREATE TABLE IF NOT EXISTS events (
  event_date DATE PRIMARY KEY,
  name TEXT,
  schedule_override JSONB,
  order_override JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-event, per-game runtime state the admin can override.
CREATE TABLE IF NOT EXISTS games (
  event_date DATE NOT NULL REFERENCES events(event_date) ON DELETE CASCADE,
  slug TEXT NOT NULL,                     -- matches lib/games.ts slugs
  status_override TEXT,                   -- null = derive from schedule; or 'upcoming' | 'live' | 'done'
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_date, slug)
);

CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  event_date DATE NOT NULL REFERENCES events(event_date) ON DELETE CASCADE,
  game_slug TEXT NOT NULL,                -- which game they're in
  name TEXT NOT NULL,
  players TEXT[] NOT NULL,                -- array of player display names
  paid BOOLEAN NOT NULL DEFAULT FALSE,    -- admin toggles when 100฿/player collected
  seed INTEGER,                           -- order admin places them in the bracket (null = unseeded)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_teams_event_game ON teams(event_date, game_slug);

-- A single match in the bracket. Per-event scope.
-- Both team slots and the winner are admin-overridable at any time.
-- `locked_a` / `locked_b` / `locked_winner` mean: admin set this manually,
-- so the auto-advance routine should leave it alone.
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  event_date DATE NOT NULL REFERENCES events(event_date) ON DELETE CASCADE,
  game_slug TEXT NOT NULL,
  round INTEGER NOT NULL,                 -- 1 = first round; final = max round
  slot INTEGER NOT NULL,                  -- position within round (0-indexed)
  team_a_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  team_b_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  winner_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  score_a INTEGER,
  score_b INTEGER,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'live' | 'done'
  locked_a BOOLEAN NOT NULL DEFAULT FALSE,
  locked_b BOOLEAN NOT NULL DEFAULT FALSE,
  locked_winner BOOLEAN NOT NULL DEFAULT FALSE,
  note TEXT,                              -- freeform admin note (e.g. "had to play in dark")
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_date, game_slug, round, slot)
);
CREATE INDEX IF NOT EXISTS idx_matches_event_game ON matches(event_date, game_slug, round);

CREATE OR REPLACE FUNCTION wet_olympics.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS teams_touch ON teams;
CREATE TRIGGER teams_touch BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION wet_olympics.touch_updated_at();

DROP TRIGGER IF EXISTS matches_touch ON matches;
CREATE TRIGGER matches_touch BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION wet_olympics.touch_updated_at();

DROP TRIGGER IF EXISTS events_touch ON events;
CREATE TRIGGER events_touch BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION wet_olympics.touch_updated_at();

DROP TRIGGER IF EXISTS games_touch ON games;
CREATE TRIGGER games_touch BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION wet_olympics.touch_updated_at();

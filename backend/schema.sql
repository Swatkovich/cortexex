-- Consolidated schema for CortexEx
-- This file is a single-schema snapshot intended for fresh installs.
-- It includes DDL previously split across migration files.

-- Enable required extension for `gen_random_uuid()` (pgcrypto provides this)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Themes table
CREATE TABLE IF NOT EXISTS themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    is_language_topic BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('input', 'select', 'radiobutton')),
    is_strict BOOLEAN DEFAULT false,
    options JSONB,
    answer TEXT,
    correct_options JSONB
);

-- Language entries (for language-themed topics)
CREATE TABLE IF NOT EXISTS language_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    description TEXT,
    translation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-user language entry stats
CREATE TABLE IF NOT EXISTS user_language_entry_stats (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_id UUID NOT NULL REFERENCES language_entries(id) ON DELETE CASCADE,
    correct_streak INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, entry_id)
);

-- Per-user per-question knowledge table
CREATE TABLE IF NOT EXISTS user_question_stats (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    knowledge_level INTEGER NOT NULL DEFAULT 0 CHECK (knowledge_level >= 0 AND knowledge_level <= 3),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, question_id)
);

-- Record of individual game plays with aggregates
CREATE TABLE IF NOT EXISTS user_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    played_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    questions_answered INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    max_correct_in_row INTEGER NOT NULL DEFAULT 0,
    -- Tracks the ending/current correct-in-row for the play (added in migrations)
    current_correct_in_row INTEGER NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_themes_user_id ON themes(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_theme_id ON questions(theme_id);
CREATE INDEX IF NOT EXISTS idx_language_entries_theme_id ON language_entries(theme_id);
CREATE INDEX IF NOT EXISTS idx_user_language_entry_stats_user ON user_language_entry_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_language_entry_stats_entry ON user_language_entry_stats(entry_id);
CREATE INDEX IF NOT EXISTS idx_uqs_user_id ON user_question_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_ug_user_id ON user_games(user_id);

-- Useful notes:
-- * This snapshot is intended for fresh DB creation. For existing databases
--   that were upgraded via discrete migrations, run any required backfill
--   operations (for example, to populate `current_correct_in_row` from
--   historical `max_correct_in_row` values):
--     UPDATE user_games
--     SET current_correct_in_row = GREATEST(current_correct_in_row, max_correct_in_row);
-- * Keep the original migration files or git history if you need an ordered
--   upgrade path. This consolidated snapshot is primarily for simplifying new
--   deployments and reproducible schema creation.

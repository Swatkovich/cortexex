-- Migration: create user statistics tables
-- Create per-user per-question knowledge table
CREATE TABLE IF NOT EXISTS user_question_stats (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    knowledge_level INTEGER NOT NULL DEFAULT 0 CHECK (knowledge_level >= 0 AND knowledge_level <= 3),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (user_id, question_id)
);

-- Create simple user_games table to record plays and per-play aggregates
CREATE TABLE IF NOT EXISTS user_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    questions_answered INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    max_correct_in_row INTEGER NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_uqs_user_id ON user_question_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_ug_user_id ON user_games(user_id);

-- Themes table
-- Each user can have multiple themes
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
-- Each theme can have multiple questions with different structures
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('input', 'select', 'radiobutton')),
    is_strict BOOLEAN DEFAULT false,
    options JSONB, -- For select and radiobutton types, stores array of options
    answer TEXT, -- For input type questions, stores the correct answer
    correct_options JSONB -- For select/radiobutton: array of correct option values (nullable)
);

CREATE TABLE IF NOT EXISTS language_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    description TEXT,
    translation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_language_entry_stats (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_id UUID NOT NULL REFERENCES language_entries(id) ON DELETE CASCADE,
    correct_streak INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, entry_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_themes_user_id ON themes(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_theme_id ON questions(theme_id);
CREATE INDEX IF NOT EXISTS idx_language_entries_theme_id ON language_entries(theme_id);
CREATE INDEX IF NOT EXISTS idx_user_language_entry_stats_user ON user_language_entry_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_language_entry_stats_entry ON user_language_entry_stats(entry_id);
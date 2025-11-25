CREATE TABLE IF NOT EXISTS user_language_entry_stats (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_id UUID NOT NULL REFERENCES language_entries(id) ON DELETE CASCADE,
    correct_streak INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, entry_id)
);

CREATE INDEX IF NOT EXISTS idx_user_language_entry_stats_user ON user_language_entry_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_language_entry_stats_entry ON user_language_entry_stats(entry_id);



ALTER TABLE themes
    ADD COLUMN IF NOT EXISTS is_language_topic BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS language_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    description TEXT,
    translation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_language_entries_theme_id ON language_entries(theme_id);


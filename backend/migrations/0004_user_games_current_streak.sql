-- Migration: add current_correct_in_row to user_games to track the ending streak per play
ALTER TABLE user_games
    ADD COLUMN IF NOT EXISTS current_correct_in_row INTEGER NOT NULL DEFAULT 0;

-- Backfill existing rows so the new column is not left at zero for historical data
UPDATE user_games
SET current_correct_in_row = GREATEST(current_correct_in_row, max_correct_in_row);


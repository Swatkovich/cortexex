# Database Setup Instructions

## SQL Schema for Themes and Questions

Run the following SQL commands in your PostgreSQL database to create the necessary tables for themes and questions.

### Step 1: Create the Tables

Execute the SQL commands from `schema.sql` file:

```sql
-- Themes table
-- Each user can have multiple themes
CREATE TABLE IF NOT EXISTS themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
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
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_themes_user_id ON themes(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_theme_id ON questions(theme_id);


### Step 2: Verify Tables

You can verify the tables were created successfully:

```sql
-- Check themes table structure
\d themes

-- Check questions table structure
\d questions

-- List all tables
\dt
```

### Database Structure

#### Themes Table
- `id` (UUID): Primary key, auto-generated
- `user_id` (UUID): Foreign key to users table, cascade delete
- `title` (VARCHAR): Theme title
- `description` (TEXT): Theme description
- `difficulty` (VARCHAR): One of 'Easy', 'Medium', 'Hard'

#### Questions Table
- `id` (UUID): Primary key, auto-generated
- `theme_id` (UUID): Foreign key to themes table, cascade delete
- `question_text` (TEXT): The question content
- `question_type` (VARCHAR): One of 'input', 'select', 'radiobutton'
- `is_strict` (BOOLEAN): Whether the answer must match exactly
- `options` (JSONB): Array of options for select/radiobutton types (null for input type)
- `answer` (TEXT): Correct answer for input type questions (null for select/radiobutton types)

### Notes

- The `users` table must exist before creating these tables
- Cascade delete ensures that when a user is deleted, their themes are deleted
- When a theme is deleted, all its questions are automatically deleted
- The `options` field stores JSON arrays like: `["Option 1", "Option 2", "Option 3"]`
- The `answer` field is required for input type questions and stores the correct answer text
- Indexes improve query performance when fetching themes by user or questions by theme

### Migration Note

If you already have the `questions` table without the `answer` field, run the migration script:

```sql
-- Run this migration if questions table exists without answer field
ALTER TABLE questions ADD COLUMN IF NOT EXISTS answer TEXT;
```

The migration file is available at `backend/migrations/add_answer_to_questions.sql`


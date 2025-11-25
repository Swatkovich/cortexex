import { Response } from "express";
import { randomUUID } from "crypto";
import { pool } from "../db";
import { AuthRequest } from "../types/auth";
import { CreateThemeDto, UpdateThemeDto, CreateQuestionDto, UpdateQuestionDto, CreateLanguageEntryDto, UpdateLanguageEntryDto } from "../types/theme";
import { safeParseJson } from "../utils/json";

// Get all themes for the authenticated user
export const getThemes = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;

    const result = await pool.query(
        `SELECT 
            t.id,
            t.user_id,
            t.title,
            t.description,
            t.difficulty,
            t.is_language_topic,
            COUNT(DISTINCT q.id) as questions_count,
            COUNT(DISTINCT le.id) as language_entries_count
        FROM themes t
        LEFT JOIN questions q ON t.id = q.theme_id
        LEFT JOIN language_entries le ON t.id = le.theme_id
        WHERE t.user_id = $1
        GROUP BY t.id`,
        [userId]
    );

    const themes = result.rows.map(row => ({
        id: row.id,
        user_id: row.user_id,
        title: row.title,
        description: row.description,
        difficulty: row.difficulty,
        is_language_topic: row.is_language_topic,
        language_entries_count: parseInt(row.language_entries_count) || 0,
        questions: row.is_language_topic ? (parseInt(row.language_entries_count) || 0) : (parseInt(row.questions_count) || 0)
    }));

    return res.status(200).json(themes);
};

// Get a single theme by ID (with questions)
export const getTheme = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    // First check if theme exists and belongs to user
    const themeResult = await pool.query(
        "SELECT * FROM themes WHERE id = $1 AND user_id = $2",
        [id, userId]
    );

    if (themeResult.rows.length === 0) {
        return res.status(404).json({ message: "Theme not found" });
    }

    const theme = themeResult.rows[0];

    // Get questions for this theme
    const questionsResult = await pool.query(
        "SELECT * FROM questions WHERE theme_id = $1",
        [id]
    );

    const languageEntriesResult = await pool.query(
        `SELECT id, theme_id, word, description, translation
         FROM language_entries
         WHERE theme_id = $1
         ORDER BY created_at ASC`,
        [id]
    );

    return res.status(200).json({
        ...theme,
        questions: questionsResult.rows.map(q => ({
            id: q.id,
            theme_id: q.theme_id,
            question_text: q.question_text,
            question_type: q.question_type,
            is_strict: q.is_strict,
            options: safeParseJson(q.options),
            answer: q.answer || null,
            correct_options: safeParseJson(q.correct_options),
        })),
        language_entries: languageEntriesResult.rows.map(entry => ({
            id: entry.id,
            theme_id: entry.theme_id,
            word: entry.word,
            description: entry.description,
            translation: entry.translation
        }))
    });
};

// Create a new theme
export const createTheme = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { title, description, difficulty, is_language_topic }: CreateThemeDto = req.body;

    if (!title || !description || !difficulty) {
        return res.status(400).json({ message: "Title, description, and difficulty are required" });
    }

    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
        return res.status(400).json({ message: "Difficulty must be Easy, Medium, or Hard" });
    }

    const isLanguageTopic = typeof is_language_topic === 'boolean' ? is_language_topic : false;

    const id = randomUUID();

    const result = await pool.query(
        `INSERT INTO themes (id, user_id, title, description, difficulty, is_language_topic)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, userId, title, description, difficulty, isLanguageTopic]
    );

    return res.status(201).json({
        ...result.rows[0],
        questions: 0,
        language_entries: [],
        language_entries_count: 0
    });
};

// Update a theme
export const updateTheme = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;
    const { title, description, difficulty, is_language_topic }: UpdateThemeDto = req.body;

    // Check if theme exists and belongs to user
    const existingResult = await pool.query(
        "SELECT * FROM themes WHERE id = $1 AND user_id = $2",
        [id, userId]
    );

    if (existingResult.rows.length === 0) {
        return res.status(404).json({ message: "Theme not found" });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (title !== undefined) {
        updates.push(`title = $${paramCount++}`);
        values.push(title);
    }
    if (description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(description);
    }
    if (difficulty !== undefined) {
        if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
            return res.status(400).json({ message: "Difficulty must be Easy, Medium, or Hard" });
        }
        updates.push(`difficulty = $${paramCount++}`);
        values.push(difficulty);
    }
    if (is_language_topic !== undefined) {
        updates.push(`is_language_topic = $${paramCount++}`);
        values.push(!!is_language_topic);
    }

    if (updates.length === 0) {
        return res.status(400).json({ message: "No fields to update" });
    }

    values.push(id, userId);

    const result = await pool.query(
        `UPDATE themes 
         SET ${updates.join(', ')}
         WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
         RETURNING *`,
        values
    );

    const isLanguageTopic = result.rows[0].is_language_topic;
    let itemsCount = 0;
    if (isLanguageTopic) {
        const languageCountResult = await pool.query(
            "SELECT COUNT(*) as count FROM language_entries WHERE theme_id = $1",
            [id]
        );
        itemsCount = parseInt(languageCountResult.rows[0].count) || 0;
    } else {
        const questionsResult = await pool.query(
            "SELECT COUNT(*) as count FROM questions WHERE theme_id = $1",
            [id]
        );
        itemsCount = parseInt(questionsResult.rows[0].count) || 0;
    }

    return res.status(200).json({
        ...result.rows[0],
        questions: itemsCount
    });
};

// Delete a theme
export const deleteTheme = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    // Check if theme exists and belongs to user
    const existingResult = await pool.query(
        "SELECT * FROM themes WHERE id = $1 AND user_id = $2",
        [id, userId]
    );

    if (existingResult.rows.length === 0) {
        return res.status(404).json({ message: "Theme not found" });
    }

    // Delete theme (cascade will delete questions)
    await pool.query(
        "DELETE FROM themes WHERE id = $1 AND user_id = $2",
        [id, userId]
    );

    return res.status(200).json({ message: "Theme deleted successfully" });
};

// Create a question for a theme
export const createQuestion = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { themeId } = req.params;
    const { question_text, question_type, is_strict, options, answer, correct_options }: CreateQuestionDto = req.body;

    if (!question_text || !question_type) {
        return res.status(400).json({ message: "Question text and type are required" });
    }

    if (!['input', 'select', 'radiobutton'].includes(question_type)) {
        return res.status(400).json({ message: "Question type must be input, select, or radiobutton" });
    }

    // Check if theme exists and belongs to user
    const themeResult = await pool.query(
        "SELECT * FROM themes WHERE id = $1 AND user_id = $2",
        [themeId, userId]
    );

    if (themeResult.rows.length === 0) {
        return res.status(404).json({ message: "Theme not found" });
    }

    if (themeResult.rows[0].is_language_topic) {
        return res.status(400).json({ message: "Language topic themes use language entries instead of classic questions" });
    }

    // Validate options for select/radiobutton types
    if ((question_type === 'select' || question_type === 'radiobutton') && (!options || options.length === 0)) {
        return res.status(400).json({ message: "Options are required for select and radiobutton types" });
    }

    // If correct_options provided, validate they belong to options
    if ((question_type === 'select' || question_type === 'radiobutton') && correct_options !== undefined && correct_options !== null) {
        if (!Array.isArray(correct_options) || correct_options.length === 0) {
            return res.status(400).json({ message: "correct_options must be a non-empty array for select/radiobutton when provided" });
        }
        const invalid = correct_options.some((c: string) => !(options || []).includes(c));
        if (invalid) {
            return res.status(400).json({ message: "All correct_options must be present in the options array" });
        }
        // For radiobutton enforce single correct option
        if (question_type === 'radiobutton' && correct_options.length > 1) {
            return res.status(400).json({ message: "radiobutton type can have only one correct option" });
        }
    }

    // Validate answer for input type
    if (question_type === 'input' && !answer) {
        return res.status(400).json({ message: "Answer is required for input type questions" });
    }

    const id = randomUUID();
    const optionsJson = (question_type === 'select' || question_type === 'radiobutton') ? JSON.stringify(options) : null;
    const answerValue = question_type === 'input' ? answer : null;
    const correctOptionsJson = (question_type === 'select' || question_type === 'radiobutton') && correct_options ? JSON.stringify(correct_options) : null;

    const result = await pool.query(
        `INSERT INTO questions (id, theme_id, question_text, question_type, is_strict, options, answer, correct_options)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [id, themeId, question_text, question_type, is_strict || false, optionsJson, answerValue, correctOptionsJson]
    );

    return res.status(201).json({
        ...result.rows[0],
        options: safeParseJson(result.rows[0].options),
        correct_options: safeParseJson(result.rows[0].correct_options)
    });
};

// Update a question
export const updateQuestion = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { themeId, questionId } = req.params;
    const { question_text, question_type, is_strict, options, answer, correct_options }: UpdateQuestionDto = req.body;

    // Check if theme exists and belongs to user
    const themeResult = await pool.query(
        "SELECT * FROM themes WHERE id = $1 AND user_id = $2",
        [themeId, userId]
    );

    if (themeResult.rows.length === 0) {
        return res.status(404).json({ message: "Theme not found" });
    }

    // Check if question exists and belongs to theme
    const questionResult = await pool.query(
        "SELECT * FROM questions WHERE id = $1 AND theme_id = $2",
        [questionId, themeId]
    );

    if (questionResult.rows.length === 0) {
        return res.status(404).json({ message: "Question not found" });
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (question_text !== undefined) {
        updates.push(`question_text = $${paramCount++}`);
        values.push(question_text);
    }
    if (question_type !== undefined) {
        if (!['input', 'select', 'radiobutton'].includes(question_type)) {
            return res.status(400).json({ message: "Question type must be input, select, or radiobutton" });
        }
        updates.push(`question_type = $${paramCount++}`);
        values.push(question_type);
    }
    if (is_strict !== undefined) {
        updates.push(`is_strict = $${paramCount++}`);
        values.push(is_strict);
    }
    if (options !== undefined) {
        const finalType = question_type || questionResult.rows[0].question_type;
        if ((finalType === 'select' || finalType === 'radiobutton') && (!options || options.length === 0)) {
            return res.status(400).json({ message: "Options are required for select and radiobutton types" });
        }
        updates.push(`options = $${paramCount++}`);
        values.push((finalType === 'select' || finalType === 'radiobutton') ? JSON.stringify(options) : null);
    }
    if (correct_options !== undefined) {
        const finalType = question_type || questionResult.rows[0].question_type;
        if (finalType === 'select' || finalType === 'radiobutton') {
            if (correct_options !== null && (!Array.isArray(correct_options) || correct_options.length === 0)) {
                return res.status(400).json({ message: "correct_options must be a non-empty array or null" });
            }
            // If options were not provided in the same request, use existing options to validate
            const optionsToCheck = options || safeParseJson(questionResult.rows[0].options) || [];
            if (correct_options !== null) {
                const invalid = correct_options.some((c: string) => !optionsToCheck.includes(c));
                if (invalid) {
                    return res.status(400).json({ message: "All correct_options must be present in the options array" });
                }
                if (finalType === 'radiobutton' && correct_options.length > 1) {
                    return res.status(400).json({ message: "radiobutton type can have only one correct option" });
                }
            }
            updates.push(`correct_options = $${paramCount++}`);
            values.push(correct_options !== null ? JSON.stringify(correct_options) : null);
        } else {
            updates.push(`correct_options = $${paramCount++}`);
            values.push(null);
        }
    }
    if (answer !== undefined) {
        const finalType = question_type || questionResult.rows[0].question_type;
        if (finalType === 'input' && !answer) {
            return res.status(400).json({ message: "Answer is required for input type questions" });
        }
        updates.push(`answer = $${paramCount++}`);
        values.push(finalType === 'input' ? answer : null);
    }

    if (updates.length === 0) {
        return res.status(400).json({ message: "No fields to update" });
    }

    values.push(questionId);

    const result = await pool.query(
        `UPDATE questions 
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
    );

    return res.status(200).json({
        ...result.rows[0],
        options: safeParseJson(result.rows[0].options),
        correct_options: safeParseJson(result.rows[0].correct_options)
    });
};

// Delete a question
export const deleteQuestion = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { themeId, questionId } = req.params;

    // Check if theme exists and belongs to user
    const themeResult = await pool.query(
        "SELECT * FROM themes WHERE id = $1 AND user_id = $2",
        [themeId, userId]
    );

    if (themeResult.rows.length === 0) {
        return res.status(404).json({ message: "Theme not found" });
    }

    // Check if question exists and belongs to theme
    const questionResult = await pool.query(
        "SELECT * FROM questions WHERE id = $1 AND theme_id = $2",
        [questionId, themeId]
    );

    if (questionResult.rows.length === 0) {
        return res.status(404).json({ message: "Question not found" });
    }

    await pool.query(
        "DELETE FROM questions WHERE id = $1",
        [questionId]
    );

    return res.status(200).json({ message: "Question deleted successfully" });
};

// Language entry CRUD
export const createLanguageEntry = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { themeId } = req.params;
    const { word, description, translation }: CreateLanguageEntryDto = req.body;

    if (!word || !translation) {
        return res.status(400).json({ message: "Word and translation are required" });
    }

    const themeResult = await pool.query(
        "SELECT * FROM themes WHERE id = $1 AND user_id = $2",
        [themeId, userId]
    );

    if (themeResult.rows.length === 0) {
        return res.status(404).json({ message: "Theme not found" });
    }

    if (!themeResult.rows[0].is_language_topic) {
        return res.status(400).json({ message: "This theme is not configured as a language topic" });
    }

    const id = randomUUID();
    const result = await pool.query(
        `INSERT INTO language_entries (id, theme_id, word, description, translation)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, theme_id, word, description, translation`,
        [id, themeId, word.trim(), description?.trim() || null, translation.trim()]
    );

    return res.status(201).json(result.rows[0]);
};

export const updateLanguageEntry = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { themeId, entryId } = req.params;
    const { word, description, translation }: UpdateLanguageEntryDto = req.body;

    const themeResult = await pool.query(
        "SELECT * FROM themes WHERE id = $1 AND user_id = $2",
        [themeId, userId]
    );

    if (themeResult.rows.length === 0) {
        return res.status(404).json({ message: "Theme not found" });
    }

    if (!themeResult.rows[0].is_language_topic) {
        return res.status(400).json({ message: "This theme is not configured as a language topic" });
    }

    const entryResult = await pool.query(
        "SELECT * FROM language_entries WHERE id = $1 AND theme_id = $2",
        [entryId, themeId]
    );

    if (entryResult.rows.length === 0) {
        return res.status(404).json({ message: "Language entry not found" });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (word !== undefined) {
        if (!word.trim()) {
            return res.status(400).json({ message: "Word cannot be empty" });
        }
        updates.push(`word = $${paramCount++}`);
        values.push(word.trim());
    }

    if (description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(description ? description.trim() : null);
    }

    if (translation !== undefined) {
        if (!translation.trim()) {
            return res.status(400).json({ message: "Translation cannot be empty" });
        }
        updates.push(`translation = $${paramCount++}`);
        values.push(translation.trim());
    }

    if (updates.length === 0) {
        return res.status(400).json({ message: "No fields to update" });
    }

    updates.push(`updated_at = now()`);

    values.push(entryId);

    const result = await pool.query(
        `UPDATE language_entries
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING id, theme_id, word, description, translation`,
        values
    );

    return res.status(200).json(result.rows[0]);
};

export const deleteLanguageEntry = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { themeId, entryId } = req.params;

    const themeResult = await pool.query(
        "SELECT * FROM themes WHERE id = $1 AND user_id = $2",
        [themeId, userId]
    );

    if (themeResult.rows.length === 0) {
        return res.status(404).json({ message: "Theme not found" });
    }

    if (!themeResult.rows[0].is_language_topic) {
        return res.status(400).json({ message: "This theme is not configured as a language topic" });
    }

    const entryResult = await pool.query(
        "SELECT * FROM language_entries WHERE id = $1 AND theme_id = $2",
        [entryId, themeId]
    );

    if (entryResult.rows.length === 0) {
        return res.status(404).json({ message: "Language entry not found" });
    }

    await pool.query(
        "DELETE FROM language_entries WHERE id = $1",
        [entryId]
    );

    return res.status(200).json({ message: "Language entry deleted successfully" });
};


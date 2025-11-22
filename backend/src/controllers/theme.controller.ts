import { Response } from "express";
import { randomUUID } from "crypto";
import { pool } from "../db";
import { AuthRequest } from "../types/auth";
import { CreateThemeDto, UpdateThemeDto, CreateQuestionDto, UpdateQuestionDto } from "../types/theme";

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
            COUNT(q.id) as questions_count
        FROM themes t
        LEFT JOIN questions q ON t.id = q.theme_id
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
        questions: parseInt(row.questions_count) || 0
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

    return res.status(200).json({
        ...theme,
        questions: questionsResult.rows.map(q => ({
            id: q.id,
            theme_id: q.theme_id,
            question_text: q.question_text,
            question_type: q.question_type,
            is_strict: q.is_strict,
            options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : null,
            answer: q.answer || null,
        }))
    });
};

// Create a new theme
export const createTheme = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { title, description, difficulty }: CreateThemeDto = req.body;

    if (!title || !description || !difficulty) {
        return res.status(400).json({ message: "Title, description, and difficulty are required" });
    }

    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
        return res.status(400).json({ message: "Difficulty must be Easy, Medium, or Hard" });
    }

    const id = randomUUID();

    const result = await pool.query(
        `INSERT INTO themes (id, user_id, title, description, difficulty)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [id, userId, title, description, difficulty]
    );

    return res.status(201).json({
        ...result.rows[0],
        questions: 0
    });
};

// Update a theme
export const updateTheme = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;
    const { title, description, difficulty }: UpdateThemeDto = req.body;

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

    // Get questions count
    const questionsResult = await pool.query(
        "SELECT COUNT(*) as count FROM questions WHERE theme_id = $1",
        [id]
    );

    return res.status(200).json({
        ...result.rows[0],
        questions: parseInt(questionsResult.rows[0].count) || 0
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
    const { question_text, question_type, is_strict, options, answer }: CreateQuestionDto = req.body;

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

    // Validate options for select/radiobutton types
    if ((question_type === 'select' || question_type === 'radiobutton') && (!options || options.length === 0)) {
        return res.status(400).json({ message: "Options are required for select and radiobutton types" });
    }

    // Validate answer for input type
    if (question_type === 'input' && !answer) {
        return res.status(400).json({ message: "Answer is required for input type questions" });
    }

    const id = randomUUID();
    const optionsJson = (question_type === 'select' || question_type === 'radiobutton') ? JSON.stringify(options) : null;
    const answerValue = question_type === 'input' ? answer : null;

    const result = await pool.query(
        `INSERT INTO questions (id, theme_id, question_text, question_type, is_strict, options, answer)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [id, themeId, question_text, question_type, is_strict || false, optionsJson, answerValue]
    );

    return res.status(201).json({
        ...result.rows[0],
        options: result.rows[0].options ? JSON.parse(result.rows[0].options) : null
    });
};

// Update a question
export const updateQuestion = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { themeId, questionId } = req.params;
    const { question_text, question_type, is_strict, options, answer }: UpdateQuestionDto = req.body;

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
        options: result.rows[0].options ? JSON.parse(result.rows[0].options) : null
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


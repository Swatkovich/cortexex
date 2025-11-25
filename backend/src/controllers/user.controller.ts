import { Request, Response } from "express";
import { pool } from "../db";
import { AuthRequest } from "../types/auth";

// Returns profile statistics and counts needed for the frontend profile page
export const getProfileStats = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;

    // Total games played
    const gamesRes = await pool.query(
        "SELECT COUNT(*)::int AS total_games, COALESCE(SUM(questions_answered),0)::int AS total_questions_answered, COALESCE(MAX(max_correct_in_row),0)::int AS best_correct_streak FROM user_games WHERE user_id = $1",
        [userId]
    );

    const gamesRow = gamesRes.rows[0] || { total_games: 0, total_questions_answered: 0, best_correct_streak: 0 };

    // Count questions user has across all their themes (strict and non-strict)
    const qCountsRes = await pool.query(
        `SELECT
            COUNT(*) FILTER (WHERE q.is_strict) AS strict_questions,
            COUNT(*) FILTER (WHERE NOT q.is_strict) AS non_strict_questions
        FROM questions q
        JOIN themes t ON q.theme_id = t.id
        WHERE t.user_id = $1`,
        [userId]
    );

    const qCounts = qCountsRes.rows[0] || { strict_questions: 0, non_strict_questions: 0 };
    const languageEntriesRes = await pool.query(
        `SELECT COUNT(*)::int AS language_entries
         FROM language_entries le
         JOIN themes t ON le.theme_id = t.id
         WHERE t.user_id = $1`,
        [userId]
    );
    const languageEntriesCount = Number(languageEntriesRes.rows[0]?.language_entries || 0);

    // Knowledge distribution for strict questions (levels 0-3)
    const distRes = await pool.query(
        `SELECT uqs.knowledge_level::int AS level, COUNT(*)::int AS cnt
         FROM user_question_stats uqs
         JOIN questions q ON q.id = uqs.question_id
         WHERE uqs.user_id = $1 AND q.is_strict
         GROUP BY uqs.knowledge_level`,
        [userId]
    );

    const distribution = { 0: 0, 1: 0, 2: 0, 3: 0 } as Record<number, number>;
    for (const row of distRes.rows) {
        const lvl = Number(row.level);
        distribution[lvl] = Number(row.cnt);
    }
    const languageDistRes = await pool.query(
        `SELECT
            CASE
                WHEN correct_streak >= 3 THEN 3
                WHEN correct_streak <= 0 THEN 0
                ELSE correct_streak
            END AS level,
            COUNT(*)::int AS cnt
         FROM user_language_entry_stats
         WHERE user_id = $1
         GROUP BY level`,
        [userId]
    );
    for (const row of languageDistRes.rows) {
        const lvl = Number(row.level);
        distribution[lvl] = (distribution[lvl] || 0) + Number(row.cnt || 0);
    }
    const strictQuestions = Number(qCounts.strict_questions || 0);
    const totalStrict = strictQuestions + languageEntriesCount;
    const counted = (distribution[0] || 0) + (distribution[1] || 0) + (distribution[2] || 0) + (distribution[3] || 0);
    const missing = Math.max(0, totalStrict - counted);
    distribution[0] = (distribution[0] || 0) + missing;

    return res.status(200).json({
        totalGames: Number(gamesRow.total_games || 0),
        totalQuestionsAnswered: Number(gamesRow.total_questions_answered || 0),
        bestCorrectInRow: Number(gamesRow.best_correct_streak || 0),
        questionsCounts: {
            strict: totalStrict,
            nonStrict: Number(qCounts.non_strict_questions || 0),
        },
        knowledgeDistribution: {
            dontKnow: distribution[0] || 0,
            know: distribution[1] || 0,
            wellKnow: distribution[2] || 0,
            perfectlyKnow: distribution[3] || 0,
        }
    });
}

// Accepts game result payload and records per-play aggregates and per-question knowledge updates.
// Body: { questionsAnswered: number, correctAnswers: number, maxCorrectInRow: number, perQuestion: { questionId: string, isCorrect: boolean }[] }
export const postGameResult = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { questionsAnswered, correctAnswers, maxCorrectInRow, perQuestion, languageEntryResults } = req.body as {
        questionsAnswered?: number;
        correctAnswers?: number;
        maxCorrectInRow?: number;
        perQuestion?: Array<{ questionId: string; isCorrect: boolean | null }>;
        languageEntryResults?: Array<{ entryId: string; correct: boolean }>;
    };

    // Basic validation
    const qAnswered = Number(questionsAnswered || 0);
    const cAnswers = Number(correctAnswers || 0);
    const maxStreak = Number(maxCorrectInRow || 0);

    // Insert a user_games row
    await pool.query(
        `INSERT INTO user_games (user_id, questions_answered, correct_answers, max_correct_in_row)
         VALUES ($1, $2, $3, $4)`,
        [userId, qAnswered, cAnswers, maxStreak]
    );

    // Update per-question knowledge levels if provided
    if (Array.isArray(perQuestion) && perQuestion.length > 0) {
        for (const item of perQuestion) {
            if (!item || !item.questionId) continue;
            const delta = item.isCorrect ? 1 : -1;
            // Upsert: if no row exists, insert baseline and then adjust.
            await pool.query(
                `INSERT INTO user_question_stats (user_id, question_id, knowledge_level, updated_at)
                 VALUES ($1, $2, $3, now())
                 ON CONFLICT (user_id, question_id) DO UPDATE SET
                   knowledge_level = LEAST(3, GREATEST(0, user_question_stats.knowledge_level + $4)),
                   updated_at = now()`,
                [userId, item.questionId, (item.isCorrect ? 1 : 0), delta]
            );
        }
    }

    if (Array.isArray(languageEntryResults) && languageEntryResults.length > 0) {
        for (const item of languageEntryResults) {
            if (!item || !item.entryId) continue;
            const isCorrect = item.correct ? 1 : 0;
            await pool.query(
                `INSERT INTO user_language_entry_stats (user_id, entry_id, correct_streak, updated_at)
                 SELECT $1, le.id, CASE WHEN $3 = 1 THEN 1 ELSE 0 END, now()
                 FROM language_entries le
                 JOIN themes t ON t.id = le.theme_id
                 WHERE le.id = $2 AND t.user_id = $1
                 ON CONFLICT (user_id, entry_id) DO UPDATE SET
                   correct_streak = CASE
                     WHEN $3 = 1 THEN LEAST(3, user_language_entry_stats.correct_streak + 1)
                     ELSE 0
                   END,
                   updated_at = now()`,
                [userId, item.entryId, isCorrect]
            );
        }
    }

    return res.status(201).json({ message: 'Game result recorded' });
}

// Returns knowledge distribution and question counts for a single theme for the authenticated user
export const getThemeStats = async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const themeId = req.params.id;

    if (!themeId) return res.status(400).json({ message: 'Missing theme id' });

    const themeRes = await pool.query(
        `SELECT id, user_id, is_language_topic
         FROM themes
         WHERE id = $1`,
        [themeId]
    );

    if (themeRes.rows.length === 0) {
        return res.status(404).json({ message: 'Theme not found' });
    }

    const theme = themeRes.rows[0];
    if (theme.user_id !== userId) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    if (!theme.is_language_topic) {
        // Count questions in the theme
        const qCountsRes = await pool.query(
            `SELECT
                COUNT(*) FILTER (WHERE q.is_strict) AS strict_questions,
                COUNT(*) FILTER (WHERE NOT q.is_strict) AS non_strict_questions
             FROM questions q
             WHERE q.theme_id = $1`,
            [themeId]
        );
        const qCounts = qCountsRes.rows[0] || { strict_questions: 0, non_strict_questions: 0 };

        // Knowledge distribution for strict questions in this theme.
        const distRes = await pool.query(
            `SELECT uqs.knowledge_level::int AS level, COUNT(*)::int AS cnt
             FROM user_question_stats uqs
             JOIN questions q ON q.id = uqs.question_id
             WHERE uqs.user_id = $1 AND q.theme_id = $2 AND q.is_strict = true
             GROUP BY uqs.knowledge_level`,
            [userId, themeId]
        );

        const distribution = { 0: 0, 1: 0, 2: 0, 3: 0 } as Record<number, number>;
        for (const row of distRes.rows) {
            const lvl = Number(row.level);
            distribution[lvl] = Number(row.cnt);
        }

        const totalStrict = Number(qCounts.strict_questions || 0);
        const counted = (distribution[0] || 0) + (distribution[1] || 0) + (distribution[2] || 0) + (distribution[3] || 0);
        const missing = Math.max(0, totalStrict - counted);
        distribution[0] = (distribution[0] || 0) + missing;

        return res.status(200).json({
            questionsCounts: {
                strict: totalStrict,
                nonStrict: Number(qCounts.non_strict_questions || 0),
            },
            knowledgeDistribution: {
                dontKnow: distribution[0] || 0,
                know: distribution[1] || 0,
                wellKnow: distribution[2] || 0,
                perfectlyKnow: distribution[3] || 0,
            }
        });
    }

    const entriesRes = await pool.query(
        `SELECT id
         FROM language_entries
         WHERE theme_id = $1`,
        [themeId]
    );

    const totalEntries = entriesRes.rowCount || 0;

    const streakRes = await pool.query(
        `SELECT ules.correct_streak
         FROM user_language_entry_stats ules
         JOIN language_entries le ON le.id = ules.entry_id
         WHERE ules.user_id = $1 AND le.theme_id = $2`,
        [userId, themeId]
    );

    const distribution = { 0: 0, 1: 0, 2: 0, 3: 0 } as Record<number, number>;
    for (const row of streakRes.rows) {
        const streak = Math.max(0, Math.min(3, Number(row.correct_streak || 0)));
        distribution[streak] = (distribution[streak] || 0) + 1;
    }

    const countedEntries = (distribution[0] || 0) + (distribution[1] || 0) + (distribution[2] || 0) + (distribution[3] || 0);
    const missingEntries = Math.max(0, totalEntries - countedEntries);
    distribution[0] = (distribution[0] || 0) + missingEntries;

    return res.status(200).json({
        questionsCounts: {
            strict: totalEntries,
            nonStrict: 0,
        },
        knowledgeDistribution: {
            dontKnow: distribution[0] || 0,
            know: distribution[1] || 0,
            wellKnow: distribution[2] || 0,
            perfectlyKnow: distribution[3] || 0,
        }
    });
}

// Returns aggregated statistics across all users for the public landing page
export const getGlobalStats = async (_req: Request, res: Response) => {
    const [aggregateResult, distributionResult] = await Promise.all([
        pool.query(`
            SELECT
                (SELECT COUNT(*)::int FROM users) AS total_users,
                (SELECT COUNT(*)::int FROM themes) AS total_themes,
                (SELECT COUNT(*)::int FROM questions) AS total_questions_only,
                (SELECT COUNT(*)::int FROM language_entries) AS total_language_entries,
                (SELECT COUNT(*)::int FROM user_games) AS total_games,
                (SELECT COALESCE(SUM(questions_answered), 0)::int FROM user_games) AS total_questions_answered
        `),
        pool.query(`
            SELECT level, SUM(cnt)::int AS cnt
            FROM (
                SELECT uqs.knowledge_level::int AS level, COUNT(*)::int AS cnt
                FROM user_question_stats uqs
                JOIN questions q ON q.id = uqs.question_id
                WHERE q.is_strict = true
                GROUP BY uqs.knowledge_level
                UNION ALL
                SELECT
                    CASE
                        WHEN correct_streak >= 3 THEN 3
                        WHEN correct_streak <= 0 THEN 0
                        ELSE correct_streak
                    END AS level,
                    COUNT(*)::int AS cnt
                FROM user_language_entry_stats
                GROUP BY level
            ) combined
            GROUP BY level
        `)
    ]);

    const row = aggregateResult.rows[0] || {};
    const distribution = { 0: 0, 1: 0, 2: 0, 3: 0 } as Record<number, number>;

    for (const distRow of distributionResult.rows) {
        const level = Number(distRow.level);
        distribution[level] = Number(distRow.cnt);
    }

    const totalQuestionsOnly = Number(row.total_questions_only || 0);
    const totalLanguageEntries = Number(row.total_language_entries || 0);

    return res.status(200).json({
        totalUsers: Number(row.total_users || 0),
        totalThemes: Number(row.total_themes || 0),
        totalQuestions: totalQuestionsOnly + totalLanguageEntries,
        totalGamesPlayed: Number(row.total_games || 0),
        totalQuestionsAnswered: Number(row.total_questions_answered || 0),
        knowledgeDistribution: {
            dontKnow: distribution[0] || 0,
            know: distribution[1] || 0,
            wellKnow: distribution[2] || 0,
            perfectlyKnow: distribution[3] || 0,
        }
    });
}
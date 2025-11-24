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

    return res.status(200).json({
        totalGames: Number(gamesRow.total_games || 0),
        totalQuestionsAnswered: Number(gamesRow.total_questions_answered || 0),
        bestCorrectInRow: Number(gamesRow.best_correct_streak || 0),
        questionsCounts: {
            strict: Number(qCounts.strict_questions || 0),
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
    const { questionsAnswered, correctAnswers, maxCorrectInRow, perQuestion } = req.body as { questionsAnswered?: number; correctAnswers?: number; maxCorrectInRow?: number; perQuestion?: Array<{ questionId: string; isCorrect: boolean | null }> };

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

    return res.status(201).json({ message: 'Game result recorded' });
}

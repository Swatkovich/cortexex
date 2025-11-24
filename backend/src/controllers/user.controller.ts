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

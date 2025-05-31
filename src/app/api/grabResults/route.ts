// src/app/api/grabResults/route.ts
import { sql } from "@/db/client";

export const config = { runtime: "edge" };

type TotalsRow = { correct: number; incorrect: number };

type BotRow = {
  username: string;
  humanGuesses: number;
  totalGuesses: number;
  incorrectRatio: number;
};

export async function GET() {
  /* ───────── 1. overall correct / incorrect ───────── */
  const [{ correct, incorrect }] = await sql<TotalsRow[]>`
    SELECT
      SUM(CASE WHEN c.is_bot = g.is_fake THEN 1 ELSE 0 END)::int   AS correct,
      SUM(CASE WHEN c.is_bot <> g.is_fake THEN 1 ELSE 0 END)::int AS incorrect
    FROM guesses  AS g
    JOIN comments AS c ON c.id = g.comment_id
  `;

  /* ───────── 2. per-bot incorrectRatio = human / total ───────── */
  const topBots = await sql<BotRow[]>`
    SELECT
      c.by AS username,

      /* votes that said "human" on a bot comment */
      SUM(CASE WHEN g.is_fake = false THEN 1 ELSE 0 END)::int AS "humanGuesses",

      /* total guesses on this bot’s comments */
      COUNT(g.id)::int AS "totalGuesses",

      /* ratio = human / total  (NULLIF avoids /0) */
      ( SUM(CASE WHEN g.is_fake = false THEN 1 ELSE 0 END)::float
        / NULLIF(COUNT(g.id), 0)
      ) AS "incorrectRatio"

    FROM comments c
    LEFT JOIN guesses g ON g.comment_id = c.id
    WHERE c.is_bot = true
    GROUP BY c.by
    HAVING COUNT(g.id) > 0             -- keep bots with at least one guess
    ORDER BY "incorrectRatio" DESC
    LIMIT 5
  `;

  const worstBots = topBots.map(({ username, incorrectRatio }) => ({
    username,
    incorrectRatio,
  }));

  /* ───────── response ───────── */
  return Response.json({
    totalCorrect: correct,
    totalIncorrect: incorrect,
    topBots: worstBots,
  });
}

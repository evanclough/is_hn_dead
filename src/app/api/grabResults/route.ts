/*

ENDPOINT: grabResults

Returns both the total number of correct and incorrect guesses,
and the top 5 bot usernames, ranked by deception score.

TODO: split into two endpoints.

*/
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/db/client";
import type { BotPerformance } from "@/types";

export const config = { runtime: "edge" };



export async function GET(_req: NextRequest) {

  /* ───────── 2. per-bot incorrectRatio = human / total ───────── */
  const topBots = await sql<BotPerformance[]>`
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
  return NextResponse.json({
    topBots: worstBots,
  });
}

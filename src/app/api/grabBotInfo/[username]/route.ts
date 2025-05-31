// src/app/api/bot/[username]/route.ts
import { sql } from "@/db/client";
import type { BotRecord, CommentRecord } from "@/types";

export const config = { runtime: "edge" };

type CommentWithGuessCounts = CommentRecord & {
  numberHumanGuesses: number;
  numberBotGuesses: number;
};

export async function GET(
  _req: Request,
  { params }: { params: { username: string } },
) {
  const username = params.username;

  /* basic validation */
  if (typeof username !== "string" || username.length === 0) {
    return Response.json({ error: "Invalid username" }, { status: 400 });
  }

  /* ───── 1. fetch bot record ───── */
  const botRows = await sql<BotRecord[]>`
    SELECT username, llm, method, personality, created, active
    FROM   bots
    WHERE  username = ${username}
    LIMIT  1
  `;
  if (botRows.length === 0) {
    return Response.json({ error: "Bot not found" }, { status: 404 });
  }
  const bot = botRows[0];

  /* ───── 2. fetch bot's comments + guess counts ───── */
  const commentRows = await sql<CommentWithGuessCounts[]>`
    SELECT
      c.id,
      c.by,
      c.kids,
      c.parent,
      c.text,
      c.time,
      c.active,
      c.is_bot,
      c.story_id,                             -- keep if present
      /* guess tallies */
      COALESCE(SUM(CASE WHEN g.is_fake THEN 1 ELSE 0 END), 0)
        AS "numberBotGuesses",
      COALESCE(SUM(CASE WHEN g.is_fake IS FALSE THEN 1 ELSE 0 END), 0)
        AS "numberHumanGuesses"
    FROM comments AS c
    LEFT JOIN guesses AS g
           ON g.comment_id = c.id
    WHERE c.by = ${username}
    GROUP BY
      c.id, c.by, c.kids, c.parent, c.text,
      c.time, c.active, c.is_bot, c.story_id
    ORDER BY c.time DESC
  `;

  /* ───── 3. build and send payload ───── */
  return Response.json({
    ...bot,
    comments: commentRows,
  });
}

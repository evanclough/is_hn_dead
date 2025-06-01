/*
  ENDPOINT: /api/grabBotInfo/[username]

  Takes in a bot's username, and returns their record in the database,
  all of their comments, along with the guesses on those comments.

  TODO: split into two separate endpoints to separately grab their personality info,
  and their comments with the guesses.
*/


import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/db/client";
import type { BotRecord, CommentRecord, CommentWithGuessCounts } from "@/types";

export const config = { runtime: "edge" };



export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  // await params before using .username
  const { username } = await params;

  if (typeof username !== "string" || username.length === 0) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  const botRows = await sql<BotRecord[]>`
    SELECT username, llm, method, personality, created, active
    FROM   bots
    WHERE  username = ${username}
    LIMIT  1
  `;
  if (botRows.length === 0) {
    return NextResponse.json({ error: "Bot not found" }, { status: 404 });
  }
  const bot = botRows[0];

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
      c.story_id,
      COALESCE(SUM(CASE WHEN g.is_fake THEN 1 ELSE 0 END), 0)       AS "numberBotGuesses",
      COALESCE(SUM(CASE WHEN g.is_fake IS FALSE THEN 1 ELSE 0 END), 0) AS "numberHumanGuesses"
    FROM comments AS c
    LEFT JOIN guesses AS g
      ON g.comment_id = c.id
    WHERE c.by = ${username}
    GROUP BY
      c.id, c.by, c.kids, c.parent, c.text,
      c.time, c.active, c.is_bot, c.story_id
    ORDER BY c.time DESC
  `;

  return NextResponse.json({ ...bot, comments: commentRows });
}

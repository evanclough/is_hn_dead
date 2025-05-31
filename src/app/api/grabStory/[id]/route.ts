// src/app/api/story/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/db/client";
import type {
  StoryRecord,
  CommentRecord,
  NestedComment,
  StoryWithComments,
} from "@/types";

export const config = { runtime: "edge" };

/* ─────────── comment recursion ─────────── */
async function getCommentWithReplies(
  id: number,
): Promise<NestedComment | null> {
  const rows = await sql<CommentRecord[]>`
    SELECT * FROM comments WHERE id = ${id} AND active = true LIMIT 1
  `;
  if (rows.length === 0) return null;

  const comment = rows[0];
  const children: NestedComment[] = [];

  for (const kidId of (comment.kids ?? []) as number[]) {
    const child = await getCommentWithReplies(kidId);
    if (child) children.push(child);
  }

  return { ...comment, comments: children };
}

/* ─────────── route handler ─────────── */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const storyId = Number(params.id);

  /* 1️⃣  Fetch story */
  const rows = await sql<StoryRecord[]>`
    SELECT * FROM stories WHERE id = ${storyId} LIMIT 1
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }
  const story = rows[0];

  /* 2️⃣  Pull nested comments */
  const nestedComments: NestedComment[] = [];
  for (const kidId of (story.kids ?? []) as number[]) {
    const nc = await getCommentWithReplies(kidId);
    if (nc) nestedComments.push(nc);
  }

  /* 3️⃣  Count descendants on-the-fly */
  const [{ count }] = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM comments
    WHERE story_id = ${storyId}
  `;

  /* 4️⃣  Build response */
  const payload: StoryWithComments & { descendants: number } = {
    ...story,
    comments: nestedComments,
    descendants: count,
  };

  return NextResponse.json(payload);
}

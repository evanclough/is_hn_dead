/*

ENDPOINT: grabStory

Given a story ID, returns both the story's record in the database, (and calculates its number of descendants)
and all of its comments. 

TODO: split into two separate endpoints...

*/
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/db/client";
import type { StoryRecord, NestedComment, StoryWithComments } from "@/types";

/* unchanged helper to build nested comments */
async function getCommentWithReplies(
  id: number,
): Promise<NestedComment | null> {
  const rows = await sql<StoryRecord[]>`
    SELECT * FROM comments WHERE id = ${id} AND active = true LIMIT 1
  `;
  if (rows.length === 0) return null;

  const comment = rows[0] as NestedComment;
  const children: NestedComment[] = [];

  for (const kidId of (comment.kids ?? []) as number[]) {
    const child = await getCommentWithReplies(kidId);
    if (child) children.push(child);
  }

  return { ...comment, comments: children };
}

export const config = { runtime: "edge" };

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // ⬅️ Await params before using .id
  const { id } = await params;
  const storyId = Number(id);
  if (Number.isNaN(storyId)) {
    return NextResponse.json({ error: "Invalid story ID" }, { status: 400 });
  }

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

  /* 3️⃣  Count descendants */
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

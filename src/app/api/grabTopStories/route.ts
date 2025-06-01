/*

ENDPOINT: grabTopStories

returns the currently active stories, and also counts their descendants.

*/
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/db/client";
import type { FinishedStoryRecord } from "@/types";

export const config = { runtime: "edge" };

export async function GET(_req: NextRequest) {
  // Fetch active stories (active > 0) plus comment count
  const rows = await sql<FinishedStoryRecord[]>`
    SELECT
      s.id,
      s.by,
      s.kids,
      s.score,
      s.time,
      s.title,
      s.url,
      s.text,
      s.summary,
      s.active,
      s.last_activated,
      COUNT(c.id)::int AS descendants         -- comment total
    FROM stories      AS s
    LEFT JOIN comments AS c
           ON c.story_id = s.id
    WHERE s.active > 0
    GROUP BY
      s.id, s.by, s.kids, s.score, s.time,
      s.title, s.url, s.text, s.summary,
      s.active, s.last_activated
    ORDER BY s.active ASC                     -- rank 1,2,3…
  `;

  return NextResponse.json(rows as FinishedStoryRecord[]);
}

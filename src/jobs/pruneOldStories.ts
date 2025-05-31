// src/jobs/pruneOldStories.ts
import { sql } from "@/db/client";

/**
 * Remove stories whose `last_activated` is more than 24 h ago,
 * plus all human comments (`is_bot = false`) that belong to them.
 */
export async function pruneOldStories(): Promise<void> {


  const cutoff = Math.floor(Date.now() / 1000) - (60 * 60 * 24 * 2);

  // 1. Delete human comments for those stale stories
  await sql`
    DELETE FROM comments
    WHERE is_bot = false
      AND story_id IN (
        SELECT id FROM stories
        WHERE last_activated < ${cutoff}
      )
  `;

  // 2. Delete the stale stories themselves
  await sql`
    DELETE FROM stories
    WHERE last_activated < ${cutoff}
  `;
}
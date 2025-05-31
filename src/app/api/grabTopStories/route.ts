import { sql } from "@/db/client";
import type { StoryRecord } from "@/types";

export const config = { runtime: "edge" };

export async function GET() {
    // Get all stories on the front page, sorted by rank
    const rows = await sql`
        SELECT id, by, kids, descendants, score, time, title, url, text, summary, active, last_activated
        FROM stories
        WHERE active >= 1
        ORDER BY active ASC
    `;

    // Cast/convert to StoryRecord[]
    const stories: StoryRecord[] = rows.map((row: any) => ({
        id: row.id,
        by: row.by,
        kids: Array.isArray(row.kids) ? row.kids : JSON.parse(row.kids),
        descendants: row.descendants,
        score: row.score,
        time: row.time,
        title: row.title,
        url: row.url,
        text: row.text,
        summary: row.summary,
        active: row.active,
        last_activated: row.last_activated,
    }));

    return Response.json(stories);
}
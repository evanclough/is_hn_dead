import { sql } from "@/db/client";
import type { StoryRecord, CommentRecord, StoryWithComments, NestedComment } from "@/types";

export const config = { runtime: "edge" };

async function getCommentWithReplies(id: number): Promise<NestedComment | null> {
    const rows = await sql`
        SELECT id, by, kids, parent, text, time, active, is_bot
        FROM comments
        WHERE id = ${id}
        LIMIT 1
    `;
    if (!rows.length) return null;
    if (rows[0].active === false) return null;


    const comment: CommentRecord = {
        ...rows[0],
        kids: Array.isArray(rows[0].kids) ? rows[0].kids : JSON.parse(rows[0].kids),
    };

    // Recursively fetch children
    const childComments: NestedComment[] = [];
    for (const childId of comment.kids) {
        const childComment = await getCommentWithReplies(childId);
        if (childComment) childComments.push(childComment);
    }

    return { ...comment, comments: childComments };
}

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    const id = Number(params.id);

    if (isNaN(id)) {
        return Response.json({ error: "Invalid story id" }, { status: 400 });
    }

    const rows = await sql`
        SELECT id, by, kids, descendants, score, time, title, url, text, summary, active, last_activated
        FROM stories
        WHERE id = ${id}
        LIMIT 1
    `;

    if (!rows.length) {
        return Response.json({ error: "Story not found" }, { status: 404 });
    }

    const story: StoryRecord = {
        ...rows[0],
        kids: Array.isArray(rows[0].kids) ? rows[0].kids : JSON.parse(rows[0].kids),
    };

    // Recursively fetch all comments for the story
    const topLevelComments: NestedComment[] = [];
    for (const kidId of story.kids) {
        const comment = await getCommentWithReplies(kidId);
        if (comment) topLevelComments.push(comment);
    }

    // Add `comments` field to the story object
    const storyWithComments: StoryWithComments = {
        ...story,
        comments: topLevelComments,
    };

    return Response.json(storyWithComments);
}

import { sql } from "@/db/client";
import type { AlgoliaItem, AlgoliaError, StoryRecord, CommentRecord } from "@/types";

// Helper: Fetch JSON from a URL, handle errors
async function fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fetch failed: ${url}`);
    return res.json();
}

function summarize(url: string | null, text: string | null) {
    if (url && text) return url + " " + text;
    if (url) return url;
    if (text) return text;
    return "";
}

// Main CRON refresh function: updates active stories, sets rank in "active"
export async function refreshTopStories() {
    // 1. Set all stories/comments to inactive
    /*
    await sql`UPDATE stories SET active = -1`;
    await sql`UPDATE comments SET active = FALSE`;
    */

    // 2. Get top stories from HN API
    const topIds: number[] = await fetchJson("https://hacker-news.firebaseio.com/v0/topstories.json");

    const algoliaStories: AlgoliaItem[] = [];
    for (const id of topIds) {
        // Stop after 30 stories
        if (algoliaStories.length >= 30) break;

        // Fetch Algolia story object
        const algoliaUrl = `https://hn.algolia.com/api/v1/items/${id}`;
        const data: AlgoliaItem | AlgoliaError = await fetchJson(algoliaUrl);

        // Only accept if valid and type === "story"
        if ("error" in data) continue;
        if (data.type !== "story") continue;

        algoliaStories.push(data);
    }

    // 3. Process Algolia stories
    let refreshed = 0;
    const now = Math.floor(Date.now() / 1000);

    for (let i = 0; i < algoliaStories.length; i++) {
        const algoliaStory = algoliaStories[i];
        const rank = i + 1; // rank 1..30

        let newKids: number[] = [];
        let totalNewDescendants = 0;

        // For each child, call refreshComment
        for (const child of algoliaStory.children) {
            const isNewlyStored = await refreshComment(child, algoliaStory.id, 0);
            if (isNewlyStored) newKids.push(child.id);
        }


        // Find if story exists
        const result = await sql`SELECT * FROM stories WHERE id = ${algoliaStory.id}`;

        if (result.length > 0) {
            // Update existing
            const record: StoryRecord = result[0];

            const updatedKids = Array.from(new Set([...(record.kids || []), ...newKids]));

            await sql`
                UPDATE stories SET
                    kids = ${JSON.stringify(updatedKids)},
                    score = ${algoliaStory.points || 0},
                    active = ${rank},
                    last_activated = ${now}
                WHERE id = ${algoliaStory.id}
            `;

        } else {
            // Create new record
            const newStory: StoryRecord = {
                id: algoliaStory.id,
                by: algoliaStory.author,
                kids: newKids,
                score: algoliaStory.points || 0,
                time: algoliaStory.created_at_i,
                title: algoliaStory.title || "",
                url: algoliaStory.url,
                text: algoliaStory.text,
                summary: summarize(algoliaStory.url, algoliaStory.text),
                active: rank,
                last_activated: now
            };
            await sql`
                INSERT INTO stories (
                    id, by, kids, score, time, title, url, text, summary, active, last_activated
                ) VALUES (
                    ${newStory.id},
                    ${newStory.by},
                    ${JSON.stringify(newStory.kids)},
                    ${newStory.score},
                    ${newStory.time},
                    ${newStory.title},
                    ${newStory.url},
                    ${newStory.text},
                    ${newStory.summary},
                    ${newStory.active},
                    ${newStory.last_activated}
                )
            `;
        }
        refreshed++;
    }

    return { refreshed };
}

// Used to "load" all top stories and comments from scratch (fresh insert)
export async function addTopStories() {
    // 1. Set all stories/comments to inactive
    await sql`UPDATE stories SET active = -1`;
    await sql`UPDATE comments SET active = FALSE`;

    // 2. Get top stories from HN API
    const topIds: number[] = await fetchJson("https://hacker-news.firebaseio.com/v0/topstories.json");

    const algoliaStories: AlgoliaItem[] = [];
    for (const id of topIds) {
        // Stop after 30 stories
        if (algoliaStories.length >= 30) break;

        // Fetch Algolia story object
        const algoliaUrl = `https://hn.algolia.com/api/v1/items/${id}`;
        const data: AlgoliaItem | AlgoliaError = await fetchJson(algoliaUrl);

        // Only accept if valid and type === "story"
        if ("error" in data) continue;
        if (data.type !== "story") continue;

        algoliaStories.push(data);
    }

    // 3. Insert new stories with correct ranks
    const now = Math.floor(Date.now() / 1000);

    for (let i = 0; i < algoliaStories.length; i++) {
        const algoliaStory = algoliaStories[i];
        const rank = i + 1;

        let newKids: number[] = [];
        let totalNewDescendants = 0;

        // For each child, call addComment
        for (const child of algoliaStory.children) {
            const isNewlyStored = await addComment(child, algoliaStory.id, 0);
            if (isNewlyStored) newKids.push(child.id);
        }
        // Create new record
        const newStory: StoryRecord = {
            id: algoliaStory.id,
            by: algoliaStory.author,
            kids: newKids,
            score: algoliaStory.points || 0,
            time: algoliaStory.created_at_i,
            title: algoliaStory.title || "",
            url: algoliaStory.url,
            text: algoliaStory.text,
            summary: summarize(algoliaStory.url, algoliaStory.text),
            active: rank,
            last_activated: now
        };

        await sql`
            INSERT INTO stories (
                id, by, kids, score, time, title, url, text, summary, active, last_activated
            ) VALUES (
                ${newStory.id},
                ${newStory.by},
                ${JSON.stringify(newStory.kids)},
                ${newStory.score},
                ${newStory.time},
                ${newStory.title},
                ${newStory.url},
                ${newStory.text},
                ${newStory.summary},
                ${newStory.active},
                ${newStory.last_activated}
            )
        `;
    }

    return { "success": true };
}

// Recursive function as described in your spec
async function refreshComment(comment: AlgoliaItem, storyId: number, depth: number): Promise<boolean> {
    let newKids: number[] = [];
    let totalNewDescendants = 0;

    const now = Math.floor(Date.now() / 1000);

    const result = await sql`SELECT * FROM comments WHERE id = ${comment.id}`;

    //if it doesn't exist in the database
    if(result.length === 0){

        // if its older than the last refresh, throw it out
        if (now - comment.created_at_i > 600){
            return false;
        }
        //otherwise, flip a coin and potentially add it
        else {
            // New: flip a coin to decide if we store
            if (Math.random() > 0.5 - depth * 0.2) return false;
            // Recurse on children
            for (const child of comment.children) {
                const isNewlyStored = await refreshComment(child, storyId, depth + 1);
                if (isNewlyStored) newKids.push(child.id);
            }
            // Build and insert new record
            const newComment: CommentRecord = {
                id: comment.id,
                by: comment.author,
                kids: newKids,
                story_id: storyId,
                parent: comment.parent_id ?? 0,
                text: comment.text,
                time: comment.created_at_i,
                active: true,
                is_bot: false
            };
            await sql`
                INSERT INTO comments (
                    id, by, kids, parent, story_id, text, time, active, is_bot
                ) VALUES (
                    ${newComment.id},
                    ${newComment.by},
                    ${JSON.stringify(newComment.kids)},
                    ${newComment.parent},
                    ${newComment.story_id},
                    ${newComment.text},
                    ${newComment.time},
                    ${newComment.active},
                    ${newComment.is_bot}
                )
            `;
            return true;

        }
    }else {
        //if it does, update it

        const record: CommentRecord = result[0];
        for (const child of comment.children) {
            const isNewlyStored = await refreshComment(child, storyId, depth + 1);
            if (isNewlyStored) newKids.push(child.id);
        }
        const updatedKids = Array.from(new Set([...(record.kids || []), ...newKids]));

        await sql`
            UPDATE comments SET
                kids = ${JSON.stringify(updatedKids)},
                active = TRUE
            WHERE id = ${comment.id}
        `;
        return false;
    }
}

async function addComment(comment: AlgoliaItem, storyId: number, depth: number): Promise<boolean> {
    let newKids: number[] = [];
    let totalNewDescendants = 0;

    if (Math.random() > 0.5 - depth * 0.2) false;
    // Recurse on children
    for (const child of comment.children) {
        const isNewlyStored = await addComment(child, storyId, depth + 1);
        if (isNewlyStored) newKids.push(child.id);
    }
    // Build and insert new record
    const newComment: CommentRecord = {
        id: comment.id,
        by: comment.author,
        kids: newKids,
        parent: comment.parent_id ?? 0,
        story_id: storyId,
        text: comment.text,
        time: comment.created_at_i,
        active: true,
        is_bot: false
    };

    await sql`
        INSERT INTO comments (
            id, by, kids, parent, story_id, text, time, active, is_bot
        ) VALUES (
            ${newComment.id},
            ${newComment.by},
            ${JSON.stringify(newComment.kids)},
            ${newComment.parent},
            ${newComment.story_id},
            ${newComment.text},
            ${newComment.time},
            ${newComment.active},
            ${newComment.is_bot}
        )
    `;

    return true;
}
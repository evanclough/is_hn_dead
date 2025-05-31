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
            const [isNewlyStored, newDescendants] = await refreshComment(child);
            if (isNewlyStored) newKids.push(child.id);
            totalNewDescendants += newDescendants;
        }

        // Find if story exists
        const result = await sql`SELECT * FROM stories WHERE id = ${algoliaStory.id}`;
        if (result.length > 0) {
            // Update existing
            const record: StoryRecord = result[0];
            const updatedKids = Array.from(new Set([...(record.kids || []), ...newKids]));
            const updatedDescendants = (record.descendants || 0) + totalNewDescendants;

            await sql`
                UPDATE stories SET
                    kids = ${JSON.stringify(updatedKids)},
                    descendants = ${updatedDescendants},
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
                descendants: totalNewDescendants,
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
                    id, by, kids, descendants, score, time, title, url, text, summary, active, last_activated
                ) VALUES (
                    ${newStory.id},
                    ${newStory.by},
                    ${JSON.stringify(newStory.kids)},
                    ${newStory.descendants},
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
            const [isNewlyStored, newDescendants] = await addComment(child);
            if (isNewlyStored) newKids.push(child.id);
            totalNewDescendants += newDescendants;
        }
        // Create new record
        const newStory: StoryRecord = {
            id: algoliaStory.id,
            by: algoliaStory.author,
            kids: newKids,
            descendants: totalNewDescendants,
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
                id, by, kids, descendants, score, time, title, url, text, summary, active, last_activated
            ) VALUES (
                ${newStory.id},
                ${newStory.by},
                ${JSON.stringify(newStory.kids)},
                ${newStory.descendants},
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
async function refreshComment(comment: AlgoliaItem): Promise<[boolean, number]> {
    let newKids: number[] = [];
    let totalNewDescendants = 0;

    const now = Math.floor(Date.now() / 1000);

    const result = await sql`SELECT * FROM comments WHERE id = ${comment.id}`;

    //if it doesn't exist in the database
    if(result.length === 0){

        // if its older than the last refresh, throw it out
        if (now - comment.created_at_i > 600){
            return [false, 0];
        }
        //otherwise, flip a coin and potentially add it
        else {
            // New: flip a coin to decide if we store
            if (Math.random() < 0.8) return [false, 0];
            // Recurse on children
            for (const child of comment.children) {
                const [isNewlyStored, newDescendants] = await refreshComment(child);
                if (isNewlyStored) newKids.push(child.id);
                totalNewDescendants += newDescendants;
            }
            // Build and insert new record
            const newComment: CommentRecord = {
                id: comment.id,
                by: comment.author,
                kids: newKids,
                parent: comment.parent_id ?? 0,
                text: comment.text,
                time: comment.created_at_i,
                active: true,
                is_bot: false
            };

            await sql`
                INSERT INTO comments (
                    id, by, kids, parent, text, time, active, is_bot
                ) VALUES (
                    ${newComment.id},
                    ${newComment.by},
                    ${JSON.stringify(newComment.kids)},
                    ${newComment.parent},
                    ${newComment.text},
                    ${newComment.time},
                    ${newComment.active},
                    ${newComment.is_bot}
                )
            `;
            return [true, 1 + totalNewDescendants];

        }
    }else {
        //if it does, update it

        const record: CommentRecord = result[0];
        for (const child of comment.children) {
            const [isNewlyStored, newDescendants] = await refreshComment(child);
            if (isNewlyStored) newKids.push(child.id);
            totalNewDescendants += newDescendants;
        }
        const updatedKids = Array.from(new Set([...(record.kids || []), ...newKids]));

        await sql`
            UPDATE comments SET
                kids = ${JSON.stringify(updatedKids)},
                active = TRUE
            WHERE id = ${comment.id}
        `;
        return [false, totalNewDescendants];
    }
}

async function addComment(comment: AlgoliaItem): Promise<[boolean, number]> {
    let newKids: number[] = [];
    let totalNewDescendants = 0;

    // New: flip a coin to decide if we store
    if (Math.random() < 0.2) return [false, 0];
    // Recurse on children
    for (const child of comment.children) {
        const [isNewlyStored, newDescendants] = await addComment(child);
        if (isNewlyStored) newKids.push(child.id);
        totalNewDescendants += newDescendants;
    }
    // Build and insert new record
    const newComment: CommentRecord = {
        id: comment.id,
        by: comment.author,
        kids: newKids,
        parent: comment.parent_id ?? 0,
        text: comment.text,
        time: comment.created_at_i,
        active: true,
        is_bot: false
    };

    await sql`
        INSERT INTO comments (
            id, by, kids, parent, text, time, active, is_bot
        ) VALUES (
            ${newComment.id},
            ${newComment.by},
            ${JSON.stringify(newComment.kids)},
            ${newComment.parent},
            ${newComment.text},
            ${newComment.time},
            ${newComment.active},
            ${newComment.is_bot}
        )
    `;

    return [true, 1 + totalNewDescendants];
}
import { neon } from "@neondatabase/serverless";
import {
    DBRes,
    FrontPage, 
    StoryCard,
    NestedComment,
    BotRecord,
    Guesses,
    CommentWithGuessCounts,
    BotPerformance
} from "@/types";

export const sql = neon(process.env.DATABASE_URL!);

function dbFunctionWrapper<T, R>(f: (...args1: T[]) => Promise<R>): ((...args1: T[]) => DBRes<R>) {
    
    async function wrapped(...args2: T[]): (DBRes<R>){
        try {
            const result = await f(...args2);
            return result as R;
        }catch (err){
            return null;
        }
    }

    return wrapped;
}

async function _grabTopStories(): Promise<FrontPage> {
        const rows = await sql`
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

        return rows as FrontPage;
}
export const grabTopStories: () => DBRes<FrontPage> = dbFunctionWrapper(_grabTopStories);

async function _grabStoryCard(storyId: string): Promise<StoryCard | null> {
    const storyRows = await sql`SELECT * FROM stories WHERE id = ${storyId}`;
    const storyRecord = storyRows[0];

    const [{ count }] = await sql`
        SELECT COUNT(*)::int AS count
        FROM comments
        WHERE story_id = ${storyId}
    `;

    return {...storyRecord, descendants: count} as StoryCard;
}
export const grabStoryCard: (storyId: string) => DBRes<StoryCard> = dbFunctionWrapper(_grabStoryCard);

async function _grabStoryComments(storyId: string): Promise<NestedComment[] | null> {
    const allComments = await sql`SELECT * FROM comments WHERE story_id = ${storyId}`;


    const nestComments: (parentId: string) => NestedComment[] = parentId => {
        return allComments
            .filter(row => row.parent === parentId)
            .map((commentRecord) => 
                {
                    return {...commentRecord, comments: nestComments(commentRecord.id)} as NestedComment
                }) as NestedComment[];
    }

    return nestComments(storyId);

}
export const grabStoryComments: (storyId: string) => DBRes<NestedComment[]> = dbFunctionWrapper(_grabStoryComments);

async function _grabBotRecord(botUsername: string): Promise<BotRecord | null> {
    const rows = await sql`SELECT * FROM bots WHERE username = ${botUsername}`;
    const botRecord = rows[0];

    return botRecord as BotRecord;
}
export const grabBotRecord: (botUsername: string) => DBRes<BotRecord> = dbFunctionWrapper(_grabBotRecord);

async function _grabBotComments(botUsername: string): Promise<CommentWithGuessCounts[]>{
    const rows = await sql`
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
        WHERE c.by = ${botUsername}
        GROUP BY
        c.id, c.by, c.kids, c.parent, c.text,
        c.time, c.active, c.is_bot, c.story_id
        ORDER BY c.time DESC
    `;

    return rows as CommentWithGuessCounts[];
}
export const grabBotComments: (botUsername: string) => DBRes<CommentWithGuessCounts[]> = dbFunctionWrapper(_grabBotComments);

async function _grabTopBots(): Promise<BotPerformance[]> {
    const NUM_BOTS: number = 10;

    const topBots = await sql`
        SELECT
        c.by AS username,

        /* votes that said "human" on a bot comment */
        SUM(CASE WHEN g.is_fake = false THEN 1 ELSE 0 END)::int AS "humanGuesses",

        /* total guesses on this bot’s comments */
        COUNT(g.id)::int AS "totalGuesses",

        /* ratio = human / total  (NULLIF avoids /0) */
        ( SUM(CASE WHEN g.is_fake = false THEN 1 ELSE 0 END)::float
            / NULLIF(COUNT(g.id), 0)
        ) AS "incorrectRatio"

        FROM comments c
        LEFT JOIN guesses g ON g.comment_id = c.id
        WHERE c.is_bot = true
        GROUP BY c.by
        HAVING COUNT(g.id) > 0             -- keep bots with at least one guess
        ORDER BY "incorrectRatio" DESC
        LIMIT ${NUM_BOTS}
    `;

    return topBots as BotPerformance[];
}

export const grabTopBots: () => DBRes<BotPerformance[]> = dbFunctionWrapper(_grabTopBots);

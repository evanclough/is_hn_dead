import { neon } from "@neondatabase/serverless";
import {
  FrontPage,
  StoryCard,
  NestedComment,
  BotRecord,
  CommentWithGuessCounts,
  BotPerformance,
  StoryRecord,
  CommentRecord,
  ContentTable,
  SearchByPK,
} from "@/types";

import { getRandomCommentId } from "@/lib/utils";

import {
  FRONTPAGE_NUM_STORIES,
  NUM_DAYS_KEPT,
  NUM_TOP_BOTS,
} from "@/lib/constants";

const sql = neon(process.env.DATABASE_URL!);

type CountObject = { count: number };
type Count = CountObject[];

type IDObject = { id: number };
type ID = IDObject[];

type RangeObject = { min: number | null; max: number | null };
type Range = RangeObject[];

type NameObject = { name: string | null };
type Name = NameObject[];

type ActiveSample = { id: number; active: number };

export async function grabTopStories(): Promise<FrontPage | null> {
  try {
    const frontPage = (await sql`
            SELECT
            s.id,
            s.by,
            s.kids,
            s.score,
            s.time,
            s.title,
            s.url,
            s.text,
            s.active,
            s.last_activated,
            COUNT(c.id)::int AS descendants         -- comment total
            FROM stories      AS s
            LEFT JOIN comments AS c
                ON c.story_id = s.id
            WHERE s.active > 0
            GROUP BY
            s.id, s.by, s.kids, s.score, s.time,
            s.title, s.url, s.text,
            s.active, s.last_activated
            ORDER BY s.active ASC                     -- rank 1,2,3…
        `) as FrontPage;

    if (frontPage.length !== FRONTPAGE_NUM_STORIES) {
      const [{ count: totalStories }] = (await sql`
        SELECT COUNT(*)::int AS count
        FROM stories
      `) as Count;
      const [{ count: activeStories }] = (await sql`
        SELECT COUNT(*)::int AS count
        FROM stories
        WHERE active > 0
      `) as Count;
      const [{ min: minActivated, max: maxActivated }] = (await sql`
        SELECT
          MIN(last_activated) AS min,
          MAX(last_activated) AS max
        FROM stories
      `) as Range;

      console.error(
        `Error fetching front page: incorrect number of stories ${frontPage.length}`,
      );
      console.error(`Front page debug: expected=${FRONTPAGE_NUM_STORIES}`);
      console.error(
        `Front page debug: total=${totalStories}, active=${activeStories}, last_activated min=${minActivated ?? "null"}, max=${maxActivated ?? "null"}`,
      );
      const [{ name: dbName }] =
        (await sql`SELECT current_database() AS name`) as Name;
      const [{ name: dbUser }] =
        (await sql`SELECT current_user AS name`) as Name;
      const activeSample = (await sql`
        SELECT id, active
        FROM stories
        WHERE active > 0
        ORDER BY active ASC
        LIMIT 5
      `) as ActiveSample[];
      const databaseUrl = process.env.DATABASE_URL;
      if (databaseUrl) {
        try {
          const parsed = new URL(databaseUrl);
          console.error(
            `DB debug: host=${parsed.hostname}, db=${parsed.pathname.replace(/^\//, "")}, user=${parsed.username}, current_database=${dbName ?? "null"}, current_user=${dbUser ?? "null"}`,
          );
        } catch (err) {
          console.error("DB debug: failed to parse DATABASE_URL", err);
        }
      } else {
        console.error("DB debug: DATABASE_URL not set");
      }
      console.error(
        `Front page debug: active sample=${JSON.stringify(activeSample)}`,
      );
      console.error(
        `Env debug: NODE_ENV=${process.env.NODE_ENV ?? "unknown"}, VERCEL_ENV=${process.env.VERCEL_ENV ?? "unknown"}`,
      );
      return null;
    }

    return frontPage;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function grabStoryCard(
  storyId: string,
): Promise<StoryCard | null> {
  try {
    const [storyRecord] =
      (await sql`SELECT * FROM stories WHERE id = ${storyId}`) as StoryRecord[];

    const [{ count }] = (await sql`
            SELECT COUNT(*)::int AS count
            FROM comments
            WHERE story_id = ${storyId}
        `) as Count;

    return { ...storyRecord, descendants: count } as StoryCard;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function grabStoryComments(
  storyId: string,
): Promise<NestedComment[] | null> {
  try {
    const storyComments =
      (await sql`SELECT * FROM comments WHERE story_id = ${storyId}`) as CommentRecord[];

    const nestComments: (parentId: string) => NestedComment[] = (parentId) => {
      return storyComments
        .filter((comment) => comment.parent.toString() === parentId)
        .map((comment) => {
          return {
            ...comment,
            comments: nestComments(comment.id.toString()),
          } as NestedComment;
        }) as NestedComment[];
    };

    return nestComments(storyId);
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function grabBotRecord(
  botUsername: string,
): Promise<BotRecord | null> {
  try {
    const [botRecord] =
      (await sql`SELECT * FROM bots WHERE username = ${botUsername}`) as BotRecord[];
    return botRecord;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function grabBotComments(
  botUsername: string,
): Promise<CommentWithGuessCounts[] | null> {
  try {
    const botComments = (await sql`
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
            COALESCE(SUM(CASE WHEN g.is_fake THEN 1 ELSE 0 END), 0)       AS "bot",
            COALESCE(SUM(CASE WHEN g.is_fake IS FALSE THEN 1 ELSE 0 END), 0) AS "human"
            FROM comments AS c
            LEFT JOIN guesses AS g
            ON g.comment_id = c.id
            WHERE c.by = ${botUsername}
            GROUP BY
            c.id, c.by, c.kids, c.parent, c.text,
            c.time, c.active, c.is_bot, c.story_id
            ORDER BY c.time DESC
        `) as CommentWithGuessCounts[];

    return botComments;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function grabTopBots(): Promise<BotPerformance[] | null> {
  try {
    const topBots = (await sql`
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
            LIMIT ${NUM_TOP_BOTS}
        `) as BotPerformance[];

    return topBots;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function makeGuess(
  commentId: number,
  isFake: boolean,
): Promise<boolean> {
  try {
    const now = Math.floor(Date.now() / 1000);

    const [{ id }] = (await sql`
            INSERT INTO guesses (comment_id, is_fake, timestamp)
            VALUES (${commentId}, ${isFake}, ${now})
            RETURNING id
        `) as ID;

    return id > -1;
  } catch (err) {
    console.error(err);
    return false;
  }
}

export async function pruneOldStories(): Promise<boolean> {
  try {
    const cutoff: number =
      Math.floor(Date.now() / 1000) - 60 * 60 * 24 * NUM_DAYS_KEPT;

    const removedComments = (await sql`
            DELETE FROM comments
            WHERE is_bot = false
            AND story_id IN (
                SELECT id FROM stories
                WHERE last_activated < ${cutoff}
            )
            RETURNING id
        `) as ID;

    const removedStories = (await sql`
            DELETE FROM stories
            WHERE last_activated < ${cutoff}
            RETURNING id
        `) as ID;

    return removedStories.length > -1 && removedComments.length > -1;
  } catch (err) {
    console.error(err);
    return false;
  }
}

export async function getActiveBots(): Promise<BotRecord[] | null> {
  try {
    const activeBots =
      (await sql`SELECT * FROM bots WHERE active = true`) as BotRecord[];

    return activeBots;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function getActiveStories(): Promise<StoryRecord[] | null> {
  try {
    const activeStories =
      (await sql`SELECT * FROM stories WHERE active > 0`) as StoryRecord[];

    return activeStories;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function insertBotComment(
  botUsername: string,
  parentId: string,
  storyId: string,
  response: string,
): Promise<number> {
  try {
    const commentId = getRandomCommentId();
    const now = Math.floor(Date.now() / 1000);

    const [{ id }] = (await sql`
            INSERT INTO comments (id, by, kids, parent, story_id, text, time, active, is_bot)
                VALUES (${commentId}, ${botUsername}, '[]'::jsonb, ${parentId},
                ${storyId},${response}, ${now}, true, true)
                RETURNING id
        `) as ID;

    return id.toString() === commentId.toString() ? id : -1;
  } catch (err) {
    console.error(err);
    return -1;
  }
}

export async function updateKids(
  itemId: string,
  newKids: number[],
  parentTable: ContentTable,
): Promise<boolean> {
  try {
    const [{ id }] =
      parentTable === "stories"
        ? ((await sql`
                    UPDATE stories
                    SET kids = ${JSON.stringify(newKids)}::jsonb
                    WHERE id = ${itemId}
                    RETURNING id`) as ID)
        : ((await sql`
                    UPDATE comments
                    SET kids = ${JSON.stringify(newKids)}::jsonb
                    WHERE id = ${itemId}
                    returning ID`) as ID);

    return id.toString() === itemId;
  } catch (err) {
    console.error(err);
    return false;
  }
}

export async function deactivateFrontPage(): Promise<boolean> {
  try {
    (await sql`UPDATE stories SET active = -1 RETURNING id`) as ID;
    (await sql`UPDATE comments SET active = FALSE RETURNING id`) as ID;

    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

export async function grabStoryRecord(
  storyId: string,
): Promise<SearchByPK<StoryRecord>> {
  try {
    const maybeStory =
      (await sql`SELECT * FROM stories WHERE id = ${storyId}`) as StoryRecord[];

    return [true, maybeStory.length === 0 ? null : maybeStory[0]];
  } catch (err) {
    console.error(err);
    return [false, null];
  }
}

export async function grabCommentRecord(
  commentId: string,
): Promise<SearchByPK<CommentRecord>> {
  try {
    const maybeComment =
      (await sql`SELECT * FROM comments WHERE id = ${commentId}`) as CommentRecord[];

    return [true, maybeComment.length === 0 ? null : maybeComment[0]];
  } catch (err) {
    console.error(err);
    return [false, null];
  }
}

export async function insertStory(story: StoryRecord): Promise<boolean> {
  try {
    const [{ id }] = (await sql`
            INSERT INTO stories (
                id, by, kids, score, time, title, url, text,  active, last_activated
            ) VALUES (
                ${story.id},
                ${story.by},
                ${JSON.stringify(story.kids)},
                ${story.score},
                ${story.time},
                ${story.title},
                ${story.url},
                ${story.text},
                ${story.active},
                ${story.last_activated}
            )
            RETURNING id
        `) as ID;

    return id.toString() === story.id.toString();
  } catch (err) {
    console.error(err);
    return false;
  }
}

export async function insertComment(comment: CommentRecord): Promise<boolean> {
  try {
    const [{ id }] = (await sql`
            INSERT INTO comments (
                id, by, kids, parent, story_id, text, time, active, is_bot
            ) VALUES (
                ${comment.id},
                ${comment.by},
                ${JSON.stringify(comment.kids)},
                ${comment.parent},
                ${comment.story_id},
                ${comment.text},
                ${comment.time},
                ${comment.active},
                ${comment.is_bot}
            )
            RETURNING id
        `) as ID;
    return id.toString() === comment.id.toString();
  } catch (err) {
    console.error(err);
    return false;
  }
}

export async function refreshStoryRecord(
  storyId: string,
  kids: number[],
  score: number,
  rank: number,
): Promise<boolean> {
  try {
    const now = Math.floor(Date.now() / 1000);

    const [{ id }] = (await sql`
            UPDATE stories SET
                kids = ${JSON.stringify(kids)},
                score = ${score},
                active = ${rank},
                last_activated = ${now}
            WHERE id = ${storyId}
            RETURNING id
        `) as ID;

    return id.toString() === storyId;
  } catch (err) {
    console.error(err);
    return false;
  }
}

export async function refreshCommentRecord(
  commentId: string,
  kids: number[],
): Promise<boolean> {
  try {
    const [{ id }] = (await sql`
            UPDATE comments SET
                kids = ${JSON.stringify(kids)},
                active = TRUE
            WHERE id = ${commentId}
            RETURNING id
        `) as ID;

    return id.toString() === commentId;
  } catch (err) {
    console.error(err);
    return false;
  }
}

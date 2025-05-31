
/*
    function generateResponse(bot, story, commentChain){
      return "example response from bot {bot username} on story {story.title}"
    }

    function willMakeResponse(bot, story, commentChain){
      return true 10% of the time.
    }

    function recurseThroughComments(bot: botrecord, story: storyrecord, commentChain: [commentrecord], currentComment: number (comment id)):
      make copy of commentchain
      if currentComment != -1:
        fetch record of current comments id
        append to copy of commentchain

      if willMakeResponse(bot, story, commentChainCopy):
            response = generateResponse(bot, story, commentChainCopy);
            create comment record:
              id: random number between 1 and 40 million
              by: bot.username
              kids: []
              parent: id of last comment in chain copy, or if comment chain copy is empty, id of story
              text: response
              time: current unix timestamp;
              active: true;
              is_bot: true;
            put in comments table.
            if there is a repeat primary key error, try again with a differnet random id.
            when successfully inserted, update the record of either the last comment in the comment chain, or the sotry if its empty,
            by adding the id of the new comment to its kids array.

      for each kid id in the last comment record in the comment chain copy, or the story if its empty:
        recurseThroughComments(bot, story, commentChainCopy, kid id)

    bots = db query("all records in bots table with active = true")

    stories = db query("all stories in stories table with active = true")

    for each bot:
      for each story:
        recurseThroughComments(bot, story, [], null);

*/

// add-bot-comments.ts
import { sql } from "@/db/client";
import type {
  StoryRecord,
  CommentRecord,
  BotRecord,
} from "@/types";

/* ─────────── CONFIG ─────────── */

const BOT_REPLY_CHANCE = 0.03;           // 10 %
const MAX_RANDOM_ID   = 40_000_000;      // 1 … 40 000 000
const RANDOM_ID_RETRY = 5;               // safety cap

/* ─────────── PUBLIC ENTRYPOINT ─────────── */

/** Call this from your cron pipeline */
export async function addBotComments(): Promise<void> {
  const bots  = await sql<BotRecord[]>`SELECT * FROM bots    WHERE active = true`;
  const stories = await sql<StoryRecord[]>`SELECT * FROM stories WHERE active > 0`;

  for (const bot of bots) {
    console.log(`current bot ${bot.username}`);
    for (const story of stories) {
      await recurseThroughComments(bot, story, [], null);
    }
  }
}

/* ─────────── INTERNAL HELPERS ─────────── */

/** 10 % chance to post */
function willMakeResponse(
  _bot: BotRecord,
  _story: StoryRecord,
  _chain: CommentRecord[],
): boolean {
  return Math.random() < BOT_REPLY_CHANCE;
}

/** Very simple text-stub; swap in your LLM call here */
function generateResponse(
  bot: BotRecord,
  story: StoryRecord,
  _chain: CommentRecord[],
): string {
  return `Bot ${bot.username} commenting on “${story.title}”.`;
}

/** Returns a unique random ID in [1, MAX_RANDOM_ID] */
async function getUniqueCommentId(): Promise<number> {
  for (let i = 0; i < RANDOM_ID_RETRY; i += 1) {
    const id = 1 + Math.floor(Math.random() * MAX_RANDOM_ID);
    const existing = await sql`SELECT 1 FROM comments WHERE id = ${id} LIMIT 1`;
    if (existing.length === 0) return id;
  }
  throw new Error("Unable to generate unique comment ID");
}

/** Inserts the new bot comment and patches the parent’s kids array */
async function insertBotComment(
  bot: BotRecord,
  story: StoryRecord,
  parentTable: "stories" | "comments",
  parentId: number,
  response: string,
): Promise<void> {
  const id  = await getUniqueCommentId();
  const now = Math.floor(Date.now() / 1000);

  /* 1. insert the bot’s comment */
  await sql`
    INSERT INTO comments (id, by, kids, parent, text, time, active, is_bot)
    VALUES (${id}, ${bot.username}, '[]'::jsonb, ${parentId},
            ${response}, ${now}, true, true)
  `;

  /* 2. fetch current kids array from the proper parent table */
  const parentRow =
    parentTable === "stories"
      ? await sql<{ kids: number[] | null }[]>`
          SELECT kids FROM stories  WHERE id = ${parentId} LIMIT 1
        `
      : await sql<{ kids: number[] | null }[]>`
          SELECT kids FROM comments WHERE id = ${parentId} LIMIT 1
        `;

  const kids = (parentRow[0]?.kids ?? []) as number[];
  kids.push(id);

  /* 3. write the updated kids array back */
  if (parentTable === "stories") {
    await sql`
      UPDATE stories
      SET kids = ${JSON.stringify(kids)}::jsonb
      WHERE id = ${parentId}
    `;
  } else {
    await sql`
      UPDATE comments
      SET kids = ${JSON.stringify(kids)}::jsonb
      WHERE id = ${parentId}
    `;
  }
}



/** Depth-first traversal that mirrors your pseudocode */
async function recurseThroughComments(
  bot: BotRecord,
  story: StoryRecord,
  chain: CommentRecord[],
  currentCommentId: number | null,
): Promise<void> {
  const chainCopy: CommentRecord[] = [...chain];
  let currentComment: CommentRecord | null = null;

  if (currentCommentId !== null) {
    const rows = await sql<CommentRecord[]>`
      SELECT * FROM comments WHERE id = ${currentCommentId} LIMIT 1
    `;
    if (rows.length === 0) return;              // orphaned ID – skip
    currentComment = rows[0];
    if(!currentComment.active) return;
    chainCopy.push(currentComment);
  }

  /* Decide whether to post */
  if (willMakeResponse(bot, story, chainCopy)) {
    const replyText = generateResponse(bot, story, chainCopy);
    const parentTable = chainCopy.length === 0 ? "stories" : "comments";
    const parentId    = chainCopy.length === 0
      ? story.id
      : chainCopy[chainCopy.length - 1].id;

    await insertBotComment(bot, story, parentTable, parentId, replyText);
    console.log(`inserted comment with to parentid ${parentId}`);
  }

  /* Recurse into children */
  const childIds: number[] =
    chainCopy.length === 0
      ? (story.kids ?? [])
      : ((currentComment?.kids ?? []) as number[]);

  for (const kidId of childIds) {
    await recurseThroughComments(bot, story, chainCopy, kidId);
  }
}

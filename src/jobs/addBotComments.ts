// add-bot-comments.ts
import {
   getActiveBots,
   getActiveStories,
   grabStoryComments,
   insertBotComment,
   updateKids,
   } from "@/db/client";

import type {
  StoryRecord,
  CommentRecord,
  BotRecord,
  NestedComment,
  ParentTable,
  StoryWithComments
} from "@/types";


export async function addBotComments(): Promise<boolean> {
  const bots: BotRecord[] | null = await getActiveBots();
  const activeStories: StoryRecord[] | null = await getActiveStories();

  if (bots === null || activeStories == null){
    return false;
  }

  let success: boolean = true;

  for (const storyRecord of activeStories) {
    const comments: NestedComment[] | null = await grabStoryComments(storyRecord.id.toString());

    if(comments === null){
      success = false;
      continue;
    }

    const story: StoryWithComments = {...storyRecord, comments}

    success &&= await read(bots, story, []);
  }

  return success;
}

const BOT_REPLY_CHANCE = 0.03;

function willMakeResponse(bot: BotRecord, story: StoryRecord, chain: CommentRecord[]): boolean {
  return Math.random() < BOT_REPLY_CHANCE;
}

function generateResponse(bot: BotRecord, story: StoryRecord, chain: CommentRecord[]): string {
  return `Bot ${bot.username} commenting on “${story.title}”.`;
}


async function read(bots: BotRecord[], story: StoryWithComments, commentChain: NestedComment[]): Promise<boolean>{
  const lastComment: NestedComment | undefined = commentChain.at(-1);

  const reading: NestedComment | StoryWithComments = lastComment ?? story;

  const newKids: number[] = [];

  for(const bot of bots){
    if(willMakeResponse(bot, story, commentChain)){
      const response: string = generateResponse(bot, story, commentChain);
      const newResponseId: number | null = await insertBotComment(bot.username, reading.id.toString(), story.id.toString(), response);
      if(newResponseId !== null){
        newKids.push(newResponseId);
      }
    }
  }

  if(newKids.length > 0){
    const parentTable: ParentTable = lastComment === undefined ? "stories" : "comments";
    await updateKids(story.id.toString(), [...reading.kids, ...newKids], parentTable);
  }

  let success = true;

  for(const comment of reading.comments){
    success &&= await read(bots, story, [...commentChain, comment]);
  }

  return true;
}
// add-bot-comments.ts
import {
   getActiveBots,
   getActiveStories,
   grabStoryComments,
   insertBotComment,
   updateKids,
   } from "@/lib/db";

import {
  StoryRecord,
  BotRecord,
  NestedComment,
  ContentTable,
  StoryWithComments,
  FunctionalBot,
} from "@/types";

import {
  getWhenMethod,
  getWhatMethod
} from "@/bot_methods";


export async function addBotComments(): Promise<boolean> {
  const botRecords: BotRecord[] | null = await getActiveBots();
  const activeStories: StoryRecord[] | null = await getActiveStories();

  if (botRecords === null || activeStories == null){
    return false;
  }

  const bots: FunctionalBot[] = botRecords.map((bot: BotRecord) => {
    return {
      ...bot,
      whenMethod: getWhenMethod(bot.when_method_name),
      whatMethod: getWhatMethod(bot.what_method_name)
    } as FunctionalBot;
  })


  let success: boolean = true;

  for (const storyRecord of activeStories) {
    const comments: NestedComment[] | null = await grabStoryComments(storyRecord.id.toString());

    if(comments === null){
      return false;
    }

    const story: StoryWithComments = {...storyRecord, comments}

    success &&= await read(bots, story, []);
  }

  return success;
}


async function read(bots: FunctionalBot[], story: StoryWithComments, commentChain: NestedComment[]): Promise<boolean>{
  const lastComment: NestedComment | undefined = commentChain.at(-1);

  const reading: NestedComment | StoryWithComments = lastComment ?? story;

  const newKids: number[] = [];

  for(const bot of bots){
    if(await bot.whenMethod(bot, story, commentChain)){
      const response: string = await bot.whatMethod(bot, story, commentChain);
      console.log(`Bot ${bot.username} adding comment ${response}`);
      const newResponseId: number = await insertBotComment(bot.username, reading.id.toString(), story.id.toString(), response);
      if(newResponseId !== -1){
        newKids.push(newResponseId);
      }
    }
  }

  if(newKids.length > 0){
    const parentTable: ContentTable = lastComment === undefined ? "stories" : "comments";
    await updateKids(reading.id.toString(), [...reading.kids, ...newKids], parentTable);
  }

  let success = true;

  for(const comment of reading.comments){
    success &&= await read(bots, story, [...commentChain, comment]);
  }

  return success;
}
import {
    BotRecord,
    StoryRecord,
    CommentRecord,
    WhenMethod
} from "@/types";

export const testWhen: WhenMethod = async (bot, story, chain) => {
    const BOT_REPLY_CHANCE = 0.01;
    return Math.random() < BOT_REPLY_CHANCE;
}

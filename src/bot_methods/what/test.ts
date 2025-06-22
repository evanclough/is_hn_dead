import {
    WhatMethod
} from "@/types";

export const testWhat: WhatMethod = async (bot, story, chain) => {
    return `Bot ${bot.username} commenting on “${story.title}. Depth ${chain.length}”.`;
}
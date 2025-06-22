import {
    WhatMethod
} from "@/types";

import OpenAI from 'openai';

const client = new OpenAI({});

export const testOpenAI: WhatMethod = async  (bot, story, chain) => {

    const instructions: string = `
        You are an assistant, tasked with making a comment on the behalf of a user on a technology forum.
        The user has the username ${bot.username}, and has a bio of ${bot.context}.
        You should take into account the user's bio in your thinking, try to post something
        they themselves would post.
        Please make your response in plaintext, with no markdown, formatting, or emojis.
    `

    let prompt: string = chain.length === 0 ? 
        `Make a comment in response to a story with this title: ${story.title}` : 
        `Make a comment in response to this comment: ${chain.at(-1)?.text}, with 
            the following comments preceding it: ${chain.slice(0, -1).join("\n")},
            which are all in response to a story with this title: ${story.title}.
        `

    const response = await client.responses.create({
        model: 'gpt-4o',
        instructions: instructions,
        input: prompt,
    });

    return response.output_text;
};

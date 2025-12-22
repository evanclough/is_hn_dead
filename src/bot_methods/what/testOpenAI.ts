import {
    WhatMethod
} from "@/types";

import OpenAI from 'openai';

const client = new OpenAI({});

export const testOpenAI: WhatMethod = async  (bot, story, chain) => {

    const instructions: string = `
        You are an assistant, tasked with making a comment on the behalf of a user on a technology forum.
        
        The user has found a comment that they'd like to respond to, but can't think of what to say.
        They want you to generate a response on their behalf.

        ${bot.context}

        The user wants the response to be authentic, to sound like something they themselves would write.
        Please make your response in plaintext, with no markdown, formatting, or emojis.
    `
    
    const textContent: string = story.text === null ? `` : `, with this text body: ${story.text}`;
    const urlContent: string = story.url === null ? `` : `, that links to this url: ${story.url}`;
    const storyContent: string = `to a story with this title: ${story.title} ` + textContent + urlContent

    const recentCommentContent: string = chain.length === 0 ? `` : 
        `to this comment: ${chain.at(-1)?.text}`;
    const chainContent: string = chain.length < 2 ? `` : 
        `, with the following comments preceding it: ${chain.slice(0, -1).join("\n")}`;

    const connector: string = chain.length === 0 ? `` : `, which are all in response `
    
    const commentContent: string = recentCommentContent + chainContent + connector;

    const prompt: string = `Make a comment in response ` + commentContent + storyContent;

    const response = await client.responses.create({
        model: 'gpt-4o',
        instructions: instructions,
        input: prompt,
    });

    return response.output_text;
};

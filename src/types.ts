// types.ts

export type AlgoliaItem = {
    author: string;
    children: AlgoliaItem[];
    created_at: string;
    created_at_i: number;
    id: number;
    options: any[];
    parent_id: number | null;
    points: number | null;
    story_id: number;
    text: string | null;
    title: string | null;
    type: string;
    url: string | null;
};

export type AlgoliaStory = {
    author: string;
    children: AlgoliaComment[];
    created_at_i: number; 
    id: number;
    points: number;
    story_id: number;
    text: string | null;
    title: string;
    url: string | null;
}

export type AlgoliaComment = {
    author: string;
    children: AlgoliaComment[];
    created_at_i: number;
    id: number;
    parent_id: number;
    story_id: number;
    text: string;
}

export type AlgoliaError = {
    error: string;
    status: number;
};

export type StoryRecord = {
    id: number;
    by: string;
    kids: number[];
    score: number;
    time: number;
    title: string;
    url: string | null;
    text: string | null;
    summary: string;
    active: number;
    last_activated: number;
};
export type FinishedStoryRecord = StoryRecord & { descendants: number };

export type StoryCard = StoryRecord & {descendants: number};

export type FrontPage = StoryCard[];

export type CommentRecord = {
    id: number;
    by: string;
    kids: number[];
    parent: number;
    story_id: number;
    text: string;
    time: number;
    active: boolean;
    is_bot: boolean;
};

export type NestedComment = CommentRecord & { comments: NestedComment[] };

export type Guesses = {
    human: number;
    bot: number;
}

export type CommentWithGuessCounts = CommentRecord & Guesses;

export type StoryWithComments = StoryRecord & { comments: NestedComment[] };


export type GuessRecord = {
    id: number;
    comment_id: number | null; // nullable because of ON DELETE SET NULL
    is_real: boolean;
    timestamp: number;
};

export type BotRecord = {
    username: string;
    llm: string;
    when_method_name: WhenMethodName;
    what_method_name: WhatMethodName;
    context: string; 
    created: number;
    active: boolean;
};

export type FunctionalBot = BotRecord & {whenMethod: WhenMethod, whatMethod: WhatMethod};

export type BotPerformance = {
  username: string;
  humanGuesses: number;
  totalGuesses: number;
  incorrectRatio: number;
};

export type DBRes<T> = Promise<T | null>;

export type ContentTable = "stories" | "comments";

export type SearchByPK<T> = [boolean, T | null];

export type WhenMethodName = "test";

export type WhatMethodName = "test" | "testOpenAI";

export type WhenMethod = (bot: BotRecord, story: StoryRecord, commentChain: CommentRecord[]) => Promise<boolean>;
export type WhatMethod = (bot: BotRecord, story: StoryRecord, commentChain: CommentRecord[]) => Promise<string>;
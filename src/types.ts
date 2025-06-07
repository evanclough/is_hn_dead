// types.ts

export type AlgoliaItem = {
    author: string;
    children: AlgoliaItem[];
    created_at: string;
    created_at_i: number; // unix timestamp
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
    method: string;
    personality: any; // JSON object, you can type this further if you want
    created: number;
    active: boolean;
};

export type BotPerformance = {
  username: string;
  humanGuesses: number;
  totalGuesses: number;
  incorrectRatio: number;
};

export type DBRes<T> = Promise<T | null>;

export type ContentTable = "stories" | "comments";
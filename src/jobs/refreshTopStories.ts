import {
  deactivateFrontPage,
  grabStoryRecord,
  grabCommentRecord,
  insertStory,
  refreshStoryRecord,
  refreshCommentRecord,
  insertComment,
} from "@/lib/db";
import type {
  AlgoliaStory,
  AlgoliaComment,
  StoryRecord,
  CommentRecord,
  SearchByPK,
} from "@/types";

import {
  CRON_PERIOD_SECONDS,
  FRONTPAGE_NUM_STORIES,
  KEEP_COMMENT_CHANCE,
  KEEP_COMMENT_CHANCE_DEPTH_FACTOR,
} from "@/lib/constants";

async function insertAlgoliaStory(
  algoliaStory: AlgoliaStory,
  kids: number[],
  rank: number,
): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);

  const newStory: StoryRecord = {
    id: algoliaStory.id,
    by: algoliaStory.author,
    kids: kids,
    score: algoliaStory.points,
    time: algoliaStory.created_at_i,
    title: algoliaStory.title,
    url: algoliaStory.url,
    text: algoliaStory.text,
    active: rank,
    last_activated: now,
  };

  const dbSuccess: boolean = await insertStory(newStory);
  return dbSuccess;
}

async function insertAlgoliaComment(
  algoliaComment: AlgoliaComment,
  kids: number[],
): Promise<boolean> {
  const newComment: CommentRecord = {
    id: algoliaComment.id,
    by: algoliaComment.author,
    kids: kids,
    story_id: algoliaComment.story_id,
    parent: algoliaComment.parent_id,
    text: algoliaComment.text,
    time: algoliaComment.created_at_i,
    active: true,
    is_bot: false,
  };
  const dbSuccess: boolean = await insertComment(newComment);
  return dbSuccess;
}

function isAlgoliaStory(obj: any): obj is AlgoliaStory {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.author === "string" &&
    isAlgoliaChildren(obj.children) &&
    typeof obj.created_at_i === "number" &&
    typeof obj.id === "number" &&
    typeof obj.points === "number" &&
    obj.points !== null &&
    typeof obj.story_id === "number" &&
    obj.story_id === obj.id &&
    (obj.text === null || typeof obj.text === "string") &&
    typeof obj.title === "string" &&
    (obj.url === "null" || typeof obj.url === "string") &&
    obj.type === "story"
  );
}

function isAlgoliaComment(obj: any): obj is AlgoliaComment {
  return (
    typeof obj === "object" &&
    obj !== null &&
    isAlgoliaChildren(obj.children) &&
    typeof obj.author === "string" &&
    typeof obj.created_at_i === "number" &&
    typeof obj.id === "number" &&
    typeof obj.story_id === "number" &&
    typeof obj.parent_id === "number" &&
    typeof obj.text === "string" &&
    obj.type === "comment"
  );
}

function isAlgoliaChildren(arr: any): arr is AlgoliaComment[] {
  return Array.isArray(arr) && arr.every((item) => isAlgoliaComment(item));
}

function isTopStoryIdList(arr: any): arr is number[] {
  return Array.isArray(arr) && arr.every((item) => typeof item === "number");
}

async function fetchAlgoliaStory(
  storyId: string,
): Promise<AlgoliaStory | null> {
  const ALGOLIA_ITEM_URL = "https://hn.algolia.com/api/v1/items/";
  const url: string = `${ALGOLIA_ITEM_URL}${storyId}`;

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Error fetching ${url}: res is not ok :(`);
    return null;
  }
  const obj = await res.json();

  if (!isAlgoliaStory(obj)) {
    return null;
  }

  const algoliaStory: AlgoliaStory = obj;
  return algoliaStory;
}

async function fetchTopStoryIds(): Promise<number[] | null> {
  const HN_TOP_STORIES_URL: string =
    "https://hacker-news.firebaseio.com/v0/topstories.json";

  const res = await fetch(HN_TOP_STORIES_URL);
  if (!res.ok) {
    console.error(`Error fetching top story ids: HN is not ok :(`);
    return null;
  }
  const obj = await res.json();

  if (!isTopStoryIdList(obj)) {
    console.error("error fetching top story ids: wrong type");
    return null;
  }

  const topStoryIdList: number[] = obj;
  return topStoryIdList;
}

async function fetchCurrentFrontPage(): Promise<AlgoliaStory[] | null> {
  const topStoryIds: number[] | null = await fetchTopStoryIds();

  if (topStoryIds === null) {
    return null;
  }

  const topStories: AlgoliaStory[] = [];

  for (const id of topStoryIds) {
    if (topStories.length >= FRONTPAGE_NUM_STORIES) {
      break;
    }
    const algoliaStory: AlgoliaStory | null = await fetchAlgoliaStory(
      id.toString(),
    );

    if (algoliaStory !== null) {
      topStories.push(algoliaStory);
    }
  }

  if (topStories.length !== FRONTPAGE_NUM_STORIES) {
    console.error("error: couldn't fetch enough stories to fill front page");
    return null;
  }

  return topStories;
}

export async function refreshFrontPage(): Promise<boolean> {
  const deactivate: boolean | null = await deactivateFrontPage();

  if (!deactivate) {
    return false;
  }

  const topStories: AlgoliaStory[] | null = await fetchCurrentFrontPage();

  if (topStories === null) {
    return false;
  }

  for (let i = 0; i < topStories.length; i++) {
    const [dbSuccess, storyRecord]: SearchByPK<StoryRecord> =
      await grabStoryRecord(topStories[i].id.toString());

    if (!dbSuccess) {
      return false;
    }

    if (storyRecord === null) {
      const dbSuccess = await addStory(topStories[i], i + 1);

      if (!dbSuccess) {
        return false;
      }
    } else {
      const dbSuccess = await refreshStory(topStories[i], storyRecord, i + 1);

      if (!dbSuccess) {
        return false;
      }
    }
  }

  return true;
}

export async function addFrontPage(): Promise<boolean> {
  const deactivate: boolean = await deactivateFrontPage();

  if (!deactivate) {
    return false;
  }

  const topStories: AlgoliaStory[] | null = await fetchCurrentFrontPage();

  if (topStories === null) {
    return false;
  }

  for (let i = 0; i < topStories.length; i++) {
    const dbSuccess: boolean = await addStory(topStories[i], i + 1);
    if (!dbSuccess) {
      console.error(`failure inserting story ${topStories[i].id}`);
      return false;
    }
  }

  return true;
}

export async function addStory(
  algoliaStory: AlgoliaStory,
  rank: number,
): Promise<boolean> {
  const keptKids: number[] | null = await addComments(algoliaStory.children, 0);

  if (keptKids === null) {
    return false;
  }

  const dbSuccess: boolean = await insertAlgoliaStory(
    algoliaStory,
    keptKids,
    rank,
  );

  console.log(`added story ${algoliaStory.title}`);

  return dbSuccess;
}

export async function refreshStory(
  algoliaStory: AlgoliaStory,
  storyRecord: StoryRecord,
  rank: number,
): Promise<boolean> {
  const newKids: number[] | null = await refreshComments(
    algoliaStory.children,
    0,
  );

  if (newKids === null) {
    return false;
  }

  const updatedKids: number[] = [...storyRecord.kids, ...newKids];

  const dbSuccess: boolean = await refreshStoryRecord(
    storyRecord.id.toString(),
    updatedKids,
    algoliaStory.points,
    rank,
  );

  console.log(`refreshed story ${algoliaStory.title}`);

  return dbSuccess;
}

async function refreshComments(
  algoliaComments: AlgoliaComment[],
  depth: number,
): Promise<number[] | null> {
  const newKids: number[] = [];

  for (const algoliaComment of algoliaComments) {
    const [dbSuccess, commentRecord]: SearchByPK<CommentRecord> =
      await grabCommentRecord(algoliaComment.id.toString());

    if (!dbSuccess) {
      return null;
    }

    if (commentRecord === null) {
      const isRecent =
        Math.floor(Date.now() / 1000) - algoliaComment.created_at_i <
        CRON_PERIOD_SECONDS;
      if (!isRecent) {
        continue;
      }
      const kept: boolean | null = await addComment(algoliaComment, depth + 1);

      if (kept === null) {
        return null;
      }

      if (kept) {
        newKids.push(algoliaComment.id);
      }
    } else {
      const newGrandkids: number[] | null = await refreshComments(
        algoliaComment.children,
        depth + 1,
      );

      if (newGrandkids === null) {
        return null;
      }

      const updatedGrandkids: number[] = [
        ...commentRecord.kids,
        ...newGrandkids,
      ];

      const dbSuccess = await refreshCommentRecord(
        algoliaComment.id.toString(),
        updatedGrandkids,
      );
      if (!dbSuccess) {
        return null;
      }

      console.log(`refreshed comment with id ${algoliaComment.id}`);
    }
  }

  return newKids;
}

async function addComments(
  algoliaComments: AlgoliaComment[],
  depth: number,
): Promise<number[] | null> {
  const newKids: number[] = [];
  for (const algoliaComment of algoliaComments) {
    const kept: boolean | null = await addComment(algoliaComment, depth);

    if (kept === null) {
      return null;
    }

    if (kept) {
      newKids.push(algoliaComment.id);
    }
  }

  return newKids;
}

async function addComment(
  algoliaComment: AlgoliaComment,
  depth: number,
): Promise<boolean | null> {
  const isLucky =
    Math.random() <
    KEEP_COMMENT_CHANCE + depth * KEEP_COMMENT_CHANCE_DEPTH_FACTOR;

  if (!isLucky) {
    return false;
  }

  const grandkids: number[] | null = await addComments(
    algoliaComment.children,
    depth + 1,
  );

  if (grandkids === null) {
    return null;
  }

  const dbSuccess: boolean = await insertAlgoliaComment(
    algoliaComment,
    grandkids,
  );
  if (!dbSuccess) {
    return null;
  }
  console.log(`added comment with id ${algoliaComment.id}`);

  return true;
}

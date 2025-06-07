import { 
    deactivateFrontPage,
    grabStoryRecord,
    grabCommentRecord,
    insertStory,
    refreshStoryRecord,
    refreshCommentRecord,
    insertExistingComment,
    updateKids,
 } from "@/db/client";
import type { 
    AlgoliaItem,
    AlgoliaError,
    StoryRecord,
    CommentRecord,
    ContentTable
     } from "@/types";

//TODO: typeguards ?

async function fetchJson<T>(url: string): Promise<T | null> {
    try{
        const res = await fetch(url);
        if (!res.ok) {
            return null;
        }
        const obj: T = await res.json();
        return obj;
    }catch(err){
        return null;
    }
}

async function fetchAlgoliaItem(itemId: string): Promise<AlgoliaItem | null>{
    const ALGOLIA_ITEM_URL = "https://hn.algolia.com/api/v1/items/";
    const res: AlgoliaItem | AlgoliaError | null = await fetchJson<AlgoliaItem | AlgoliaError>(`${ALGOLIA_ITEM_URL}${itemId}`);
    return (res === null || "error" in res) ? null : res;
}

function summarize(url: string | null, text: string | null) {
    if (url && text) return url + " " + text;
    if (url) return url;
    if (text) return text;
    return "";
}

async function fetchCurrentFrontPage(): Promise<AlgoliaItem[] | null>{
    const HN_TOP_STORIES_URL: string = "https://hacker-news.firebaseio.com/v0/topstories.json";
    const topStoryIds: number[] | null = await fetchJson<number[]>(HN_TOP_STORIES_URL);

    if(topStoryIds === null){
        return null;
    }

    const FRONTPAGE_NUM_STORIES: number = 30;

    const topStories: AlgoliaItem[] = [];

    for (const id of topStoryIds) {
        if (topStories.length >= FRONTPAGE_NUM_STORIES){
            break;
        }
        const algoliaRes: AlgoliaItem | null = await fetchAlgoliaItem(id.toString());

        if (algoliaRes !== null && algoliaRes.type === "story"){
            topStories.push(algoliaRes);
        }
    }

    if(topStories.length !== FRONTPAGE_NUM_STORIES){
        return null;
    }

    return topStories;
}

async function insertAlgoliaStory(algoliaStory: AlgoliaItem, kids: number[], rank: number): Promise<void>{

        const now = Math.floor(Date.now() / 1000);

        const newStory: StoryRecord = {
            id: algoliaStory.id,
            by: algoliaStory.author,
            kids: kids,
            score: algoliaStory.points || 0,
            time: algoliaStory.created_at_i,
            title: algoliaStory.title || "",
            url: algoliaStory.url,
            text: algoliaStory.text,
            summary: summarize(algoliaStory.url, algoliaStory.text),
            active: rank,
            last_activated: now
        };

        await insertStory(newStory);
}

async function insertAlgoliaComment(algoliaComment: AlgoliaItem, kids: number[], storyId: number): Promise<void>{
    const newComment: CommentRecord = {
        id: algoliaComment.id,
        by: algoliaComment.author,
        kids: kids,
        story_id: storyId,
        parent: algoliaComment.parent_id ?? 0,
        text: algoliaComment.text!,
        time: algoliaComment.created_at_i,
        active: true,
        is_bot: false
    };
    await insertExistingComment(newComment);
}

export async function refreshFrontPage(cronInterval: number): Promise<boolean> {

    const deactivate: boolean | null = await deactivateFrontPage();

    if(!deactivate){
        return false;
    }

    const topStories: AlgoliaItem[] | null = await fetchCurrentFrontPage();

    if(topStories === null){
        return false;
    }

    for (let i = 0; i < topStories.length; i++) {
        const algoliaStory = topStories[i];

        const potentialStoryRecord: StoryRecord[] | null = await grabStoryRecord(algoliaStory.id.toString());

        if(potentialStoryRecord === null){
            return false;
        }

        if(potentialStoryRecord.length === 0){
            await addStory(algoliaStory, i + 1);
        }else {
            const storyRecord = potentialStoryRecord[0];
            await refreshStory(algoliaStory, storyRecord, i + 1, cronInterval)
        }
    }

    return true;
}

export async function addFrontPage(): Promise<boolean> {

    const deactivate: boolean | null = await deactivateFrontPage();

    if(!deactivate){
        return false;
    }

    const topStories: AlgoliaItem[] | null = await fetchCurrentFrontPage();

    if(topStories === null){
        return false;
    }


    for (let i = 0; i < topStories.length; i++) {
        await addStory(topStories[i], i + 1);
    }

    return true;
}

export async function addStory(algoliaStory: AlgoliaItem, rank: number){

    const keptKids = [];
    for (const childAlgoliaComment of algoliaStory.children) {
        if(await addComment(childAlgoliaComment, algoliaStory.id, 0)){
            keptKids.push(childAlgoliaComment.id);
        }
    }

    await insertAlgoliaStory(algoliaStory, keptKids, rank);

    console.log(`added story ${algoliaStory.title}`);
}

export async function refreshStory(algoliaStory: AlgoliaItem, storyRecord: StoryRecord, rank: number, cronInterval: number){
    
    const newKids = [];
    for(const childAlgoliaComment of algoliaStory.children){
        const commentResult: CommentRecord[] | null = await grabCommentRecord(childAlgoliaComment.id.toString());
        if(commentResult === null){
            return;
        }
        if(commentResult.length === 0){
            const age = Math.floor(Date.now() / 1000) - childAlgoliaComment.created_at_i;
            if(age < cronInterval && await addComment(childAlgoliaComment, algoliaStory.id, 0)){
                newKids.push(childAlgoliaComment.id);
            }
        }else{
            await refreshComment(childAlgoliaComment, commentResult[0], algoliaStory.id, 0, cronInterval);
        }
    }

    console.log(`refreshed story ${algoliaStory.title}`);

    await refreshStoryRecord(storyRecord.id.toString(), [...storyRecord.kids, ...newKids], algoliaStory.points || storyRecord.score, rank);
}

async function refreshComment(algoliaComment: AlgoliaItem, commentRecord: CommentRecord, storyId: number, depth: number, cronInterval: number): Promise<void> {

    let newKids: number[] = [];

    for (const childAlgoliaComment of algoliaComment.children) {
        const commentResult: CommentRecord[] | null = await grabCommentRecord(childAlgoliaComment.id.toString());

        if(commentResult === null){
            return;
        }

        if(commentResult.length === 0){
            const age = Math.floor(Date.now() / 1000) - childAlgoliaComment.created_at_i;
            if(age < cronInterval && await addComment(childAlgoliaComment, storyId, depth + 1)){
                newKids.push(childAlgoliaComment.id);
            }
        }else{
            await refreshComment(childAlgoliaComment, commentResult[0], storyId, depth + 1, cronInterval);
        }
    }

    await refreshCommentRecord(algoliaComment.id.toString(), [...commentRecord.kids, ...newKids]);
}

async function addComment(algoliaComment: AlgoliaItem, storyId: number, depth: number): Promise<boolean> {
    const KEEP_CHANCE = 0.5;
    const KEEP_CHANCE_DEPTH_FACTOR = 0.15;
    if (Math.random() > KEEP_CHANCE + depth * KEEP_CHANCE_DEPTH_FACTOR) {
        return false;
    }

    const keptKids: number[] = [];

    for (const childAlgoliaComment of algoliaComment.children) {
        if (await addComment(childAlgoliaComment, storyId, depth + 1)) {
            keptKids.push(childAlgoliaComment.id);
        }
    }

    await insertAlgoliaComment(algoliaComment, keptKids, storyId);

    return true;
}
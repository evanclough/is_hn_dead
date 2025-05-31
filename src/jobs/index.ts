import { refreshTopStories, addTopStories } from "./refreshTopStories";
import { pruneOldStories }   from "./pruneOldStories";
import { addBotComments }    from "./addBotComments";

export async function runCronPipeline() {
  await refreshTopStories();
  await addBotComments();
  await pruneOldStories();
  return {"success": true};  // helpful for debugging or JSON response
}

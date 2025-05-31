import { refreshTopStories, addTopStories } from "./refreshTopStories";
import { pruneOldStories }   from "./pruneOldStories";
import { addBotComments }    from "./addBotComments";

export async function runCronPipeline() {
  const results = {
    ...await refreshTopStories()
  };

  return results;  // helpful for debugging or JSON response
}

import { refreshTopStories } from "./refreshTopStories";
import { pruneOldStories }   from "./pruneOldStories";
import { addBotComments }    from "./addBotComments";

export async function runCronPipeline() {
  const results = {
    ...await refreshTopStories(),
    ...await pruneOldStories(),
    ...await addBotComments(),
  };

  console.log("successfully ran cronjob");

  return results;  // helpful for debugging or JSON response
}

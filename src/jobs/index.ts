import { refreshTopStories, addTopStories } from "./refreshTopStories";
import { pruneOldStories }   from "./pruneOldStories";
import { addBotComments }    from "./addBotComments";

export async function runCronPipeline() {

  const CRON_PERIOD_MINUTES: number = parseInt(process.env.CRON_PERIOD_MINUTES!);

  await refreshTopStories(CRON_PERIOD_MINUTES * 60);
  await addBotComments();
  await pruneOldStories();
  return {"success": true};  // helpful for debugging or JSON response
}

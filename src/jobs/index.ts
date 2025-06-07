import { addFrontPage, refreshFrontPage  } from "./refreshTopStories";
import { addBotComments }    from "./addBotComments";
import { pruneOldStories } from "@/db/client";

export async function runCronPipeline() {

    const CRON_PERIOD_MINUTES: number = parseInt(process.env.CRON_PERIOD_MINUTES!);

    const NUM_DAYS_KEPT = 3;

    await addFrontPage();
    //await refreshFrontPage(CRON_PERIOD_MINUTES * 60);
    // await addBotComments();
    //await pruneOldStories(NUM_DAYS_KEPT);
    
    return {"success": true};  // helpful for debugging or JSON response
}

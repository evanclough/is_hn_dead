import { addFrontPage, refreshFrontPage  } from "./refreshTopStories";
import { addBotComments }    from "./addBotComments";
import { pruneOldStories } from "@/lib/db";

import {
    CRON_PERIOD_SECONDS,
    NUM_DAYS_KEPT
} from "@/lib/constants";

export async function runCronPipeline(): Promise<void> {


    console.log(`starting cronjob...`);
    //await addFrontPage();

    console.log(`refreshing database with last ${CRON_PERIOD_SECONDS / 60} minutes of HN data...`);
    const refreshSuccess: boolean = await refreshFrontPage();
    console.log(`refresh ${refreshSuccess ? "succeeded" : "failed"}`);

    console.log(`showing front page to bots`);
    console.log(`bots successfully read front page`);

    console.log(`removing all stories and comments more than ${NUM_DAYS_KEPT} days old...`);
    const pruneSuccess: boolean = await pruneOldStories();
    console.log(`removal ${pruneSuccess ? "succeeded" : "failed"}`);

    console.log(`successfully completed cronjob`);
    
}

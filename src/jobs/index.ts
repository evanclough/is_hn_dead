import { addFrontPage, refreshFrontPage } from "./refreshTopStories";
import { addBotComments } from "./addBotComments";
import { pruneOldStories } from "@/lib/db";
import { CRON_PERIOD_SECONDS, NUM_DAYS_KEPT } from "@/lib/constants";

export async function seed(): Promise<boolean> {
  console.log(`Starting seed...`);

  console.log(`Seeding front page...`);
  const seedSuccess: boolean = await addFrontPage();
  console.log(`Seeding ${seedSuccess ? "succeeded" : "failed"}`);

  console.log(`Adding bot comments`);
  const seedBotsSuccess: boolean = await addBotComments();
  console.log(`Seeding bots ${seedBotsSuccess ? "succeeded" : "failed"}`);

  return seedSuccess && seedBotsSuccess;
}

export async function refresh(): Promise<boolean> {
  console.log(`starting refresh...`);
  console.log(
    `refreshing database with last ${CRON_PERIOD_SECONDS / 60} minutes of HN data...`,
  );
  const refreshSuccess: boolean = await refreshFrontPage();
  console.log(`refresh ${refreshSuccess ? "succeeded" : "failed"}`);

  //console.log(`showing front page to bots`);
  //const botSuccess: boolean = await addBotComments();
  //console.log(
  //  `bots ${botSuccess ? "successfully" : "failed to"} read front page`,
  //);

  console.log(
    `removing all stories and comments more than ${NUM_DAYS_KEPT} days old...`,
  );
  const pruneSuccess: boolean = await pruneOldStories();
  console.log(`removal ${pruneSuccess ? "succeeded" : "failed"}`);

  return refreshSuccess && pruneSuccess; // && botSuccess;
}

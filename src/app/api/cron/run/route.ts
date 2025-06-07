/*
  ENDPOINT: /api/cron/run

  Scuffed implementation of cronjob, called periodically by a GitHub action.

  Takes in a secret token, and if valid, runs the cronjob.

*/

import { runCronPipeline } from "@/jobs";
export const config = { runtime: "edge" };

export async function GET(req: Request) {
  // token guard
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (token !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const summary = await runCronPipeline();
    return new Response("Cron success", { status: 200} )
  } catch (err) {
    return new Response("Cron failed", { status: 500 });
  }
}
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
    return Response.json(summary);
  } catch (err) {
    console.error("Cron pipeline failed", err);
    return new Response("Cron failed", { status: 500 });
  }
}
import { runCronPipeline } from "@/jobs";
export const config = { runtime: "edge" };

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (token !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await runCronPipeline();
    return new Response("Cron success", { status: 200} );
  } catch (err) {
    console.error(err);
    return new Response("Cron failed", { status: 500 });
  }
}
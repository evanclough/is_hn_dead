import { runCronPipeline } from "@/jobs";
import { revalidatePath } from 'next/cache';

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (token !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await runCronPipeline();
    revalidatePath('/', 'layout');
    return new Response("Cron success", { status: 200} );
  } catch (err) {
    console.error(err);
    return new Response("Cron failed", { status: 500 });
  }
}
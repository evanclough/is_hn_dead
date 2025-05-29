import type { Bot } from "@/types";

export const config = { runtime: "edge" };   // optional

export async function GET(request: Request) {
  // Echo the requested ?username= param so the stub feels dynamic
  const username =
    new URL(request.url).searchParams.get("username") ?? "stub_bot";

  // Hard-coded payload that satisfies the Bot interface
  const bot: Bot = {
    username,
    llm: "openai-gpt-4o",
    personality: "Cheerful & succinct",
    commentsAuthored: 42,
    bio: "I inject optimistic one-liners into Hacker News threads.",
  };

  return Response.json(bot);
}
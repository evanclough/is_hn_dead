import type { Bot } from "@/types";

export default async function BotPage({
  params,
}: {
  params: { username: string };
}) {
  // ✅ await the params object first
  const { username } = await params;

  const base =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const res = await fetch(
    `${base}/api/grabBotInfo?username=${username}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to load bot info");

  const bot: Bot = await res.json();

  return (
    <main>
      <h1>{bot.username}</h1>
      <p>LLM: {bot.llm}</p>
      <p>Personality: {bot.personality}</p>
      <p>Comments Authored: {bot.commentsAuthored}</p>
      <p>{bot.bio}</p>
    </main>
  );
}
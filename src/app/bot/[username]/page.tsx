import type { BotRecord } from "@/types";

export default async function BotPage({
  params,
}: {
  params: { username: string };
}) {
  const { username } = params;

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Fetch bot info from the RESTful endpoint
  const res = await fetch(
    `${base}/api/grabBotInfo/${encodeURIComponent(username)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to load bot info");

  const bot: BotRecord = await res.json();

  return (
    <main>
      <h1>{bot.username}</h1>
      <p>LLM: {bot.llm}</p>
      <p>Method: {bot.method}</p>
      <p>Personality: {JSON.stringify(bot.personality)}</p>
      <p>Created: {new Date(bot.created * 1000).toLocaleString()}</p>
      <p>Active: {bot.active ? "Yes" : "No"}</p>
    </main>
  );
}

import type { ResultsSummary } from "@/types";

export const config = { runtime: "edge" };   // optional Edge Function

export async function GET() {
  // Hard-coded list you’ll replace with a DB query later
  const payload: ResultsSummary = {
    botIds: ["stub_bot", "chatty_bot", "optimist_bot"],
  };

  return Response.json(payload);
}
import { sql } from "@/db/client";
export const config = { runtime: "edge" };

export async function GET() {
  // ① query Postgres
  const rows = await sql`SELECT now()`;

  return Response.json({ dbTime: rows[0].now });
}
import { sql } from "@/db/client";

export const config = { runtime: "edge" };

export async function GET() {
    const rows = await sql`
        SELECT username FROM bots
        ORDER BY username ASC
        LIMIT 5
    `;
    const usernames = rows.map((row: { username: string }) => row.username);

    return Response.json(usernames);
}
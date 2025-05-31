import { sql } from "@/db/client";
import type { BotRecord } from "@/types";

export const config = { runtime: "edge" };

export async function GET(
    req: Request,
    { params }: { params: { username: string } }
) {
    const username = params.username;

    // Simple validation
    if (typeof username !== "string" || username.length < 1) {
        return Response.json({ error: "Invalid username" }, { status: 400 });
    }

    // Query the bots table for the username
    const rows = await sql`
        SELECT username, llm, method, personality, created, active
        FROM bots
        WHERE username = ${username}
        LIMIT 1
    `;

    if (rows.length === 0) {
        return Response.json({ error: "Bot not found" }, { status: 404 });
    }

    const bot: BotRecord = rows[0];

    return Response.json(bot);
}

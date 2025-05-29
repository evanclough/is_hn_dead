import { sql } from "@/db/client";

export const config = { runtime: "edge" };

export async function GET() {
    const ids = [12345, 12346, 12347];
    return Response.json(ids);
}
import { sql } from "@/db/client";
import type { GuessRecord } from "@/types";

export const config = { runtime: "edge" };

/**
 * Convert `value` to a JS integer if it’s a finite, positive sequence of digits
 * and fits in the IEEE-754 “safe” range.  Otherwise throw.
 */
function toSafeInt(value: unknown): number {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value)
      ? Number(value)
      : NaN;

  if (!Number.isSafeInteger(n) || n < 1) {
    throw new Error("comment_id must be a positive 53-bit integer");
  }
  return n;
}
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const commentId = toSafeInt(body.comment_id);   // ← use the helper
    if (typeof body.is_fake !== "boolean") {
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const now = Math.floor(Date.now() / 1000);

    const [guess] = await sql`
      INSERT INTO guesses (comment_id, is_fake, timestamp)
      VALUES (${commentId}, ${body.is_fake}, ${now})
      RETURNING id, comment_id, is_fake, timestamp
    `;

    return Response.json(guess as GuessRecord, { status: 201 });
  } catch (err) {
    /* helper or db failure ends up here */
    return Response.json(
      { error: "Invalid input", details: (err as Error).message },
      { status: 400 }
    );
  }
}
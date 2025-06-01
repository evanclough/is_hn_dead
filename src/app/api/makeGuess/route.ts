/*

    ENDPOINT: makeGuess

    Takes in a JSON containing a comment ID as a string, and a guess as a boolean,
    and inserts into database.

    Code is odd because of security concern of converting the string comment ID to a number. 

    TODO: fix that

*/


import { NextRequest, NextResponse } from "next/server";
import { sql, makeGuess } from "@/db/client";

export const config = { runtime: "edge" };

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const commentId = Number(body.comment_id);

        if(Number.isNaN(commentId) || commentId < 0 || commentId > 1e9){
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        if (typeof body.is_fake !== "boolean") {
            return NextResponse.json({ error: "Invalid input" }, { status: 400 });
        }

        const response = makeGuess(commentId, body.is_fake);

        return response === null ? 
            NextResponse.json(
                { error: "Invalid input"},
                { status: 400 }
            )
        : 
            NextResponse.json({}, { status: 201 });
    }catch(err){
        return NextResponse.json(
            { error: "Invalid input"},
            { status: 400 }
        )
    }
}

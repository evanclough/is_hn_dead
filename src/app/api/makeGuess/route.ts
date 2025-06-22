import { 
    NextRequest,
    NextResponse 
} from "next/server";

import { makeGuess } from "@/lib/db";

export const config = { runtime: "edge" };

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const commentId = Number(body.comment_id);

        if(Number.isNaN(commentId) || commentId < 0 || commentId > 1e10){
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
        console.error(err);
        return NextResponse.json(
            { error: "Invalid input"},
            { status: 400 }
        )
    }
}

export const config = { runtime: "edge" }; // deploy as an Edge Function

interface Comment {
  id: number;
  text: string;
  isBot: boolean;
  children: Comment[];
}

export async function GET(request: Request) {
  // read the ?id= query param so the URL /story/<id> still works
  const idParam = new URL(request.url).searchParams.get("id") ?? "0";
  const storyId = Number(idParam);

  // ---------- hard-coded story payload ----------
  const story = {
    id: storyId,
    title: "Hello, Hacker News (Stub Story)",
    url: "https://example.com/hello-hn",
    comments: [
      {
        id: 1,
        text: "This is a human comment. Neat project! 👍",
        isBot: false,
        children: [],
      },
      {
        id: 2,
        text: "🤖 I am a bot, but can you tell?",
        isBot: true,
        children: [
          {
            id: 3,
            text: "Looks like a bot to me.",
            isBot: false,
            children: [],
          },
        ],
      },
    ] as Comment[],
  };

  // return JSON response
  return Response.json(story);
}
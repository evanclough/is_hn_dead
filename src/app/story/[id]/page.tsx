import Comment from "./Comment";
import type { Comment as CommentType } from "@/types";

export default async function StoryPage({
  params,
}: {
  params: { id: string };
}) {
  // ✅ await params before destructuring
  const { id } = await params;

  const base =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const res = await fetch(`${base}/api/grabStory?id=${id}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load story");

  const story: { id: number; title: string; comments: CommentType[] } =
    await res.json();

  return (
    <main style={{ padding: "1rem" }}>
      <h1>Story {story.id}</h1>

      {story.comments.map((c) => (
        <Comment key={c.id} comment={c} depth={0} />
      ))}
    </main>
  );
}
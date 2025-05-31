import React from "react";
import { getTimeString } from "@/lib/utils";
import type { StoryWithComments } from "@/types";
import CommentItem from "./CommentItem";
import styles from "./Story.module.css";


/* Helper to show host or github.com/user */
function displayHost(urlStr: string | null) {
  try {
    if (!urlStr) return null;
    const url = new URL(urlStr);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "github.com") {
      const user = url.pathname.split("/").filter(Boolean)[0];
      return user ? `github.com/${user}` : "github.com";
    }
    return host;
  } catch {
    return null;
  }
}

export default async function StoryPage({ params }: { params: { id: string } }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/grabStory/${params.id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load story");

  const story: StoryWithComments = await res.json();
  const host = displayHost(story.url);

  return (
    <main className={styles.container}>
      {/* story header block */}
      <div className={styles.titleLine}>
        <a href={story.url ?? "#"} target="_blank" rel="noopener noreferrer" className={styles.titleLink}>
          {story.title}
        </a>
        {host && <span className={styles.domain}>({host})</span>}
      </div>
      <div className={styles.subtext}>
        {story.score} points by {story.by} {getTimeString(story.time)}
      </div>

      {/* comments */}
      <div className={styles.commentsBlock}>
        {story.comments.length === 0 ? (
          <div>No comments yet.</div>
        ) : (
          story.comments.map((root, i) => (
            <CommentItem
              key={root.id}
              comment={root}
              level={0}
              rootId={root.id}
              parentId={null}
              prevId={i > 0 ? story.comments[i - 1].id : null}
              nextId={i < story.comments.length - 1 ? story.comments[i + 1].id : null}
            />
          ))
        )
        }
      </div>
    </main>
  );
}

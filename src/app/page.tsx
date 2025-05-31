// app/page.tsx
import React from "react";  
import type { StoryRecord } from "@/types";
import styles from "./StoryTable.module.css";
import { getTimeString } from "@/lib/utils";

/** Formats domain: (github.com/user) special-cased, others host only */
function displayHost(urlStr: string | null) {
  try {
    if (!urlStr) return null;
    const url = new URL(urlStr);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "github.com") {
      const user = url.pathname.split("/").filter(Boolean)[0]; // first path segment
      return user ? `github.com/${user}` : "github.com";
    }
    return host;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/grabTopStories`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load top stories");

  const stories: StoryRecord[] = await res.json();

  return (
    <table className={styles.table}>
      <tbody>
        {stories.map((story, idx) => {
          const host = displayHost(story.url);

          return (
            /* React fragment because each story is three separate <tr>s */
            <React.Fragment key={story.id}>
              {/* ─── row 1: rank + title line ─── */}
              <tr>
                <td className={styles.rank}>{idx + 1}.</td>
                <td className={styles.titleLine}>
                  <a href={`/story/${story.id}`} className={styles.titleLink}>
                    {story.title}
                  </a>
                  {host && (
                    <span className={styles.domain}>({host})</span>
                  )}
                </td>
              </tr>

              {/* ─── row 2: points line ─── */}
              <tr>
                <td /> {/* empty cell under rank */}
                  <td className={styles.subtext}>
                    {story.score} points by {story.by} {getTimeString(story.time)}  | <a className={styles.subtextLink} href={`/story/${story.id}`}>{story.descendants} comments </a>
                  </td>
              </tr>

              {/* spacer row for visual separation */}
              <tr className={styles.spacer}>
                <td colSpan={2} />
              </tr>
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

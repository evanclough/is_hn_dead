/*

  FRONTEND PAGE: /

  Displays what should be an almost exact clone of the hacker news front page,
  without the upvote button.

  State should just be the list of story records, along with their descendant counts.

*/
import React from "react";  
import type { FrontPage } from "@/types";
import styles from "./StoryTable.module.css";
import { getTimeString, displayHost } from "@/lib/utils";
import {grabTopStories} from "@/db/client";
import { decode } from 'he';

export default async function HomePage() {

  const stories: FrontPage | null = await grabTopStories();

  return (
    <table className={styles.table}>
      <tbody>
        
        {stories === null ? 
          <p>error retrieving top stories</p>
          : 
        stories.map((story, idx) => {
          const host: string | null = displayHost(story.url);

          return (
            /* React fragment because each story is three separate <tr>s */
            <React.Fragment key={story.id}>
              {/* ─── row 1: rank + title line ─── */}
              <tr>
                <td className={styles.rank}>{idx + 1}.</td>
                <td className={styles.titleLine}>
                  <a href={story.url ?? `/story/${story.id}`} className={styles.titleLink}>
                    {decode(story.title)}
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
                    {story.score} points by {story.by} {getTimeString(story.time)}  | <a className={styles.subtextLink} href={`/story/${story.id}`}>{story.descendants} comment{story.descendants > 0 ? "s" : ""} </a>
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

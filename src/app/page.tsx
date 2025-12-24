import React from "react";
import type { FrontPage } from "@/types";
import styles from "./StoryTable.module.css";
import { getTimeString, displayHost } from "@/lib/utils";
import { grabTopStories } from "@/lib/db";
import { decode } from "he";

export default async function HomePage() {
  const stories: FrontPage | null = await grabTopStories();

  return (
    <table className={styles.table}>
      <tbody>
        {stories === null ? (
          <tr>
            <td colSpan={2}>
              <p>error retrieving top stories</p>
            </td>
          </tr>
        ) : (
          stories.map((story, idx) => {
            const host: string | null = displayHost(story.url);

            return (
              <React.Fragment key={story.id}>
                <tr>
                  <td className={styles.rank}>{idx + 1}.</td>
                  <td className={styles.titleLine}>
                    <a
                      href={story.url ?? `/story/${story.id}`}
                      className={styles.titleLink}
                    >
                      {decode(story.title)}
                    </a>
                    {host && <span className={styles.domain}>({host})</span>}
                  </td>
                </tr>

                <tr>
                  <td>&nbsp;</td>
                  <td className={styles.subtext}>
                    {story.score} points by {story.by}{" "}
                    {getTimeString(story.time)} |{" "}
                    <a
                      className={styles.subtextLink}
                      href={`/story/${story.id}`}
                    >
                      {story.descendants} comment
                      {story.descendants === 1 ? "" : "s"}{" "}
                    </a>
                  </td>
                </tr>

                <tr className={styles.spacer}>
                  <td colSpan={2} />
                </tr>
              </React.Fragment>
            );
          })
        )}
      </tbody>
    </table>
  );
}

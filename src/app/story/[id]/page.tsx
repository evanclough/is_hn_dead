/*

  FRONTEND PAGE: /story/[id]

  Displays a story page, supposed to look almost exactly like that of HN,
  without the upvote button / comment submission box,
  and with the human / bot guesses.

  State should be just the storys record along with all of the comments.

*/


import React from "react";
import { getTimeString } from "@/lib/utils";
import type { StoryWithComments, StoryCard, NestedComment } from "@/types";
import CommentItem from "./CommentItem";
import styles from "./Story.module.css";
import {grabStoryCard, grabStoryComments} from "@/lib/db";
import {displayHost} from "@/lib/utils";
import { decode } from 'he';


export default async function Story({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // await the params object before using .id
  const { id } = await params;

  const storyCard: StoryCard | null = await grabStoryCard(id);
  const host = displayHost(storyCard!.url);

  const comments: NestedComment[] | null = await grabStoryComments(id);

  return (
    <main className={styles.container}>
      {/* story header block */}
        {
          storyCard === null ? 
            <p>error fetching story card</p>
          :
          <React.Fragment>
            <div className={styles.titleLine}>
              <a
                href={storyCard.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.titleLink}
              >
                {decode(storyCard.title)}
              </a>
              {host && <span className={styles.domain}>({host})</span>}
            </div>
            <div className={styles.subtext}>
              {storyCard.score} points by {storyCard.by} {getTimeString(storyCard.time)}
            </div>
          </React.Fragment>
        }
        {/* comments */}
        <div className={styles.commentsBlock}>
          {
            comments === null ? 
              <p> error fetching comments</p>
            :
              comments!.length === 0 ? (
                <div>no comments yet.</div>
              ) : (
                comments!.map((root, i) => (
                  <CommentItem
                    key={root.id}
                    comment={root}
                    level={0}
                    rootId={root.id}
                    parentId={null}
                    prevId={i > 0 ? comments[i - 1].id : null}
                    nextId={
                      i < comments.length - 1
                        ? comments[i + 1].id
                        : null
                    }
                  />
                ))
              )
          }
        </div>
    </main>
  );
}

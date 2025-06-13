import React from "react";
import { decode } from 'he';

import styles from "./Story.module.css";
import CommentItem from "./CommentItem";

import type { 
  StoryCard, 
  NestedComment 
} from "@/types";
import { 
  getTimeString
} from "@/lib/utils";
import {
  grabStoryCard, 
  grabStoryComments
} from "@/lib/db";
import {
  displayHost,
  renderHTML
} from "@/lib/utils";


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

        {
          storyCard === null ? 
            <p>error fetching story card</p>
          :
          <div>
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
              {storyCard.score} points by {storyCard.by} {getTimeString(storyCard.time)} | {storyCard.descendants} comment{storyCard.descendants === 1 ? "" : "s"}
            </div>
            {storyCard.text !== null && 
              <div className={styles.mainText}>
                {renderHTML(storyCard.text)}
              </div>
            }
            <div className={styles.fakeTextBox}>
              <textarea defaultValue={`to make a comment, head over to the real post at https://news.ycombinator.com/item?id=${storyCard.id}`}className={styles.fakeTextArea} disabled></textarea>
            </div>
          </div>
        }

        <div className={styles.commentsBlock}>
          {
            comments === null ? 
              <p> error fetching comments</p>
            :
              comments.length === 0 ? (
                <div>no comments yet.</div>
              ) : (
                comments.map((root, i) => (
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

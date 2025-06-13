"use client";

import Link from "next/link";
import { useState } from "react";

import styles from "./Story.module.css";

import type { NestedComment } from "@/types";
import { 
  getTimeString,
  renderHTML 
} from "@/lib/utils";

type Props = {
  comment: NestedComment;
  level: number;
  rootId: number;
  parentId: number | null;
  prevId: number | null;
  nextId: number | null;
};


function countDesc(c: NestedComment): number {
  return c.comments.reduce((sum, child) => sum + 1 + countDesc(child), 0)
}

export default function CommentItem({
  comment,
  level,
  rootId,
  parentId,
  prevId,
  nextId,
}: Props) {
  const [guessed, setGuessed] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const hiddenCount = countDesc(comment) + 1;

  function navTo(id: number | null | undefined) {
    const el = id ? document.getElementById(`c-${id}`) : null;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleGuess(isFake: boolean) {
    try {
      await fetch("/api/makeGuess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        comment_id: comment.id,
        is_fake: isFake,
        }),
      });
      setIsCorrect(isFake === comment.is_bot);
      setGuessed(true);
    } catch (err) {
      console.error("guess error", err);
    }
  }

  return (
    <div
      className={styles.commentBlock}
      id={`c-${comment.id}`}
      style={{ "--level": level } as React.CSSProperties}
    >
      <div className={styles.commentSubtext}>
        {guessed ? 
          (
            comment.is_bot ? 
              (
              <Link href={`/bot/${comment.by}`} className={styles.commentLink}>
                {comment.by}
              </Link>
              ) : (
                <a
                  href={`https://news.ycombinator.com/user?id=${comment.by}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.commentLink}
                >
                  {comment.by}
                </a>
              )
          ) : 
          (
            "hn_user"
          )
        }

        &nbsp;{getTimeString(comment.time)}

        {comment.is_bot && guessed && <span>&nbsp;[bot]</span>}

        {level >= 1 && 
          (
            <>
              &nbsp;|&nbsp;
              {level >= 2 && 
                (
                  <>
                    <span
                      className={styles.commentLink}
                      onClick={() => navTo(rootId)}
                    >
                      root
                    </span>
                    &nbsp;|&nbsp;
                  </>
                )
              }
              <span
                className={styles.commentLink}
                onClick={() => navTo(parentId)}
              >
                parent
              </span>
            </>
          )
        }

        {prevId && 
          (
            <>
              &nbsp;|&nbsp;
              <span
                className={styles.commentLink}
                onClick={() => navTo(prevId)}
              >
                prev
              </span>
            </>
          )
        }

        {nextId && 
          (
            <>
              &nbsp;|&nbsp;
              <span
                className={styles.commentLink}
                onClick={() => navTo(nextId)}
              >
                next
              </span>
            </>
          )
        }

        &nbsp;
        <span
          className={styles.collapseBtn}
          onClick={() => setCollapsed((c) => !c)}
        >
          [{collapsed ? `${hiddenCount} more` : "-"}]
        </span>
      </div>

      {!collapsed && (
        <>
          <div className={styles.commentBody}>{renderHTML(comment.text)}</div>

          <div className={styles.commentSubtext}>
            {guessed ? (
              <span
                className={isCorrect ? styles.resultCorrect : styles.resultWrong}
              >
                {isCorrect ? "correct" : "incorrect"}
              </span>
            ) : (
              <>
                <span
                  className={styles.guessLink}
                  onClick={() => handleGuess(false)}
                >
                  human
                </span>
                &nbsp;or&nbsp;
                <span
                  className={styles.guessLink}
                  onClick={() => handleGuess(true)}
                >
                  bot
                </span>
                &nbsp;?
              </>
            )}
          </div>

          {comment.comments.map((child, i) => (
              <CommentItem
                key={child.id}
                comment={child}
                level={level + 1}
                rootId={rootId}
                parentId={comment.id}
                prevId={i > 0 ? comment.comments[i - 1].id : null}
                nextId={
                  i < comment.comments.length - 1
                    ? comment.comments[i + 1].id
                    : null
                }
              />
            )
          )}
        </>
      )}
    </div>
  );
}

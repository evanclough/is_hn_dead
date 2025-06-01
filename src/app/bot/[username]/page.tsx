/*

  FRONTEND PAGE: /bot/[username]

  Displays the data from the bots record from the database,
  along with their guess counts, and the ratio of incorrect guesses to all, 
  called "deception score"

  TODO: integrate with separated endpoints, fix state

*/


import type { BotRecord, CommentRecord } from "@/types";
import styles from "./BotPage.module.css";
import { grabBotRecord, grabBotComments } from "@/db/client";


type CommentWithGuessCounts = CommentRecord & {
  numberHumanGuesses: number;
  numberBotGuesses: number;
};
type BotPayload = BotRecord & { comments: CommentWithGuessCounts[] };

export default async function BotPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  // await params before using .username
  const { username } = await params;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const res = await fetch(
    `${base}/api/grabBotInfo/${encodeURIComponent(username)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Failed to load bot info");

  const bot: BotPayload = await res.json();

  const botRecord = await grabBotRecord(username);
  const botComments = await grabBotComments(username);

  
  const totals = botComments!.reduce(
    (acc, c) => {
      acc.human += Number(c.human);
      acc.bot += Number(c.bot);
      return acc;
    },
    { human: 0, bot: 0 }
  );
  const deception =
    totals.human + totals.bot === 0
      ? 0
      : totals.human / (totals.human + totals.bot);

  return (
    <div className={styles.container}>
      {/* main profile box */}
      <table className={styles.mainTable}>
        <tbody className={styles.profileTable}>
          <tr>
            <td>user:</td>
            <td>{bot.username}</td>
          </tr>
          <tr>
            <td>created:</td>
            <td>{new Date(bot.created * 1000).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td>llm:</td>
            <td>{bot.llm}</td>
          </tr>
          <tr>
            <td>method:</td>
            <td>{bot.method}</td>
          </tr>
          <tr>
            <td>total guesses:</td>
            <td>{totals.human + totals.bot}</td>
          </tr>
          <tr>
            <td>deception score:</td>
            <td>{(deception * 100).toFixed(3)} %</td>
          </tr>
          <tr>
            <td>personality:</td>
            <td>{/* kept empty for now */}</td>
          </tr>
        </tbody>
      </table>

      {/* comments section */}
      <h2 className={styles.commentsHeader}>comments</h2>

      {bot.comments.length === 0 ? (
        <p>This bot hasn’t posted any comments yet.</p>
      ) : (
        <ul className={styles.commentList}>
          {bot.comments.map((c) => (
            <li key={c.id} className={styles.commentItem}>
              <div className={styles.commentMeta}>
                {new Date(c.time * 1000).toLocaleString()} &nbsp;|&nbsp; human
                guesses: {c.numberHumanGuesses} &nbsp;|&nbsp; bot guesses:&nbsp;
                {c.numberBotGuesses}
              </div>
              <div>{c.text ?? ""}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

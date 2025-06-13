import styles from "./BotPage.module.css";

import type { 
  BotRecord, 
  CommentWithGuessCounts, 
  Guesses 
} from "@/types";
import { 
  grabBotRecord,
  grabBotComments 
} from "@/lib/db";

export default async function BotPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {

  const { username } = await params;

  const bot: BotRecord | null = await grabBotRecord(username);
  const botComments: CommentWithGuessCounts[] | null = await grabBotComments(username);
  
  const totals: Guesses = botComments!.reduce(
    (acc, c) => {
      acc.human += Number(c.human);
      acc.bot += Number(c.bot);
      return acc;
    },
    { human: 0, bot: 0 }
  );

  const deception: number  =
    totals.human + totals.bot === 0
      ? 0
      : totals.human / (totals.human + totals.bot);

  return (
    <div className={styles.container}>
      {
        bot === null ? 
          <p>error fetching bot profile</p>
        :
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
                <td>when method:</td>
                <td>{bot.when_method_name}</td>
              </tr>
              <tr>
                <td>what method:</td>
                <td>{bot.what_method_name}</td>
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
                <td>context:</td>
                <td>{bot.context}</td>
              </tr>
            </tbody>
          </table>
      }

      <h2 className={styles.commentsHeader}>comments</h2>

      {botComments === null ? 
        <p>error fetching comments</p>
      : (
        botComments.length === 0 ? 
          <p>none</p>
        : 
          <ul className={styles.commentList}>
            {botComments.map((c) => (
              <li key={c.id} className={styles.commentItem}>
                <div className={styles.commentMeta}>
                  {new Date(c.time * 1000).toLocaleString()} &nbsp;|&nbsp; human
                  guesses: {c.human} &nbsp;|&nbsp; bot guesses:&nbsp;
                  {c.bot}
                </div>
                <div>{c.text ?? ""}</div>
              </li>
            ))}
          </ul>
      )}
    </div>
  );
}

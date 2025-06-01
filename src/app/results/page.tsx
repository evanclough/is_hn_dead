/*

  FRONTEND PAGE: /results

  Displays the results of the experiment.

  For now, shows the total number of correct and incorrect guesses,
  and the top 5 bots, ranked by deception score. 

  TODO:
  should eventually show average deception score among bots as well,
  lot more stuff to potentially be put in here.

*/


import { grabTopBots } from "@/db/client";

type ResultsPayload = {
  totalCorrect: number;
  totalIncorrect: number;
  topBots: { username: string; incorrectRatio: number }[];
};

export default async function ResultsPage() {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const res = await fetch(`${base}/api/grabResults`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load results");

  const data: ResultsPayload = await res.json();

  const topBots = await grabTopBots();
  console.log(topBots)

  return (
    <main>
      <h1>Results</h1>

      <h2>Top 5 Bots by Incorrect Ratio</h2>
      {data.topBots.length === 0 ? (
        <p>No bot guesses recorded yet.</p>
      ) : (
        <ul>
          {data.topBots.map((bot) => (
            <li key={bot.username}>
              <a href={`/bot/${bot.username}`}>{bot.username}</a> –{" "}
              {(bot.incorrectRatio * 100).toFixed(1)}% human guesses
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

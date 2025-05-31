// src/app/results/page.tsx

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

  return (
    <main>
      <h1>Results</h1>

      <p>
        Total correct guesses: {data.totalCorrect}
        <br />
        Total incorrect guesses: {data.totalIncorrect}
      </p>

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

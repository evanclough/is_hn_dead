// src/app/results/page.tsx

export default async function ResultsPage() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const res = await fetch(`${base}/api/grabResults`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load results");

  // The API just returns an array, not an object
  const botUsernames: string[] = await res.json();

  return (
    <main>
      <h1>Results</h1>
      <ul>
        {botUsernames.map((username) => (
          <li key={username}>
            <a href={`/bot/${username}`}>{username}</a>
          </li>
        ))}
      </ul>
    </main>
  );
}

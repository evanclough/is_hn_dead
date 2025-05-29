// Server Component for "/" – fetches /api/grabTopStories and
// prints the returned IDs, each linking to /story/<id>. Also
// shows one link to /results.

export default async function HomePage() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const res = await fetch(`${base}/api/grabTopStories`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to load top stories");

  const ids: number[] = await res.json();

  return (
    <main style={{ padding: "1rem" }}>
      <h1>Top Stories</h1>

      <ul style={{ margin: "0.5rem 0 1rem", paddingLeft: "1.25rem" }}>
        {ids.map((id) => (
          <li key={id}>
            <a href={`/story/${id}`}>{id}</a>
          </li>
        ))}
      </ul>

      <a href="/results">See results</a>
    </main>
  );
}
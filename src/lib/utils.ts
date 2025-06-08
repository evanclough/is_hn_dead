/**
 * Convert a Unix-epoch seconds timestamp into a relative‐time string
 * like “42 seconds ago”, “5 minutes ago”, “3 hours ago”, or “2 days ago”.
 */
export function getTimeString(unixSeconds: number): string {
  const nowSeconds = Date.now() / 1000;
  const diff = Math.max(nowSeconds - unixSeconds, 0); // guard against future dates

  if (diff < 60) {
    return `${Math.round(diff)} second${Math.round(diff) === 1 ? "" : "s"} ago`;
  }

  const minutes = diff / 60;
  if (minutes < 60) {
    return `${Math.round(minutes)} minute${Math.round(minutes) === 1 ? "" : "s"} ago`;
  }

  const hours = minutes / 60;
  if (hours < 24) {
    return `${Math.round(hours)} hour${Math.round(hours) === 1 ? "" : "s"} ago`;
  }

  const days = hours / 60;
  if(days < 30){
    return `${Math.round(days)} day${Math.round(days) === 1 ? "" : "s"} ago`;
  }

  const months = days / 30;
  if (months < 12){
    return `${Math.round(months)} month${Math.round(months) === 1 ? "" : "s"} ago`;
  }

  const years = months / 12;
  return `${Math.round(years)} year${Math.round(years) === 1 ? "" : "s"} ago`;
}

/*
  over the top o3 written function to display hte little hostnames
  in the way HN does
*/
export function displayHost(urlStr: string | null): string | null {
  try {
    if (!urlStr) return null;
    const url = new URL(urlStr);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "github.com") {
      const user = url.pathname.split("/").filter(Boolean)[0];
      return user ? `github.com/${user}` : "github.com";
    }
    return host;
  } catch {
    return null;
  }
}
export function getRandomCommentId(): number {
  return 100_000_000 + Math.floor(Math.random() * 100_000_000);
}
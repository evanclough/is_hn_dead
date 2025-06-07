/**
 * Convert a Unix-epoch seconds timestamp into a relative‐time string
 * like “42 seconds ago”, “5 minutes ago”, “3 hours ago”, or “2 days ago”.
 */
export function getTimeString(unixSeconds: number): string {
  const nowSeconds = Date.now() / 1000;
  const diff = Math.max(nowSeconds - unixSeconds, 0); // guard against future dates

  if (diff < 60) {
    return `${Math.floor(diff)} second${Math.floor(diff) === 1 ? "" : "s"} ago`;
  }

  const minutes = diff / 60;
  if (minutes < 60) {
    return `${Math.floor(minutes)} minute${Math.floor(minutes) === 1 ? "" : "s"} ago`;
  }

  const hours = minutes / 60;
  if (hours < 24) {
    return `${Math.floor(hours)} hour${Math.floor(hours) === 1 ? "" : "s"} ago`;
  }

  const days = hours / 60;
  if(days < 30){
    return `${Math.floor(days)} day${Math.floor(days) === 1 ? "" : "s"} ago`;
  }

  const months = days / 30;
  if (months < 12){
    return `${Math.floor(months)} month${Math.floor(months) === 1 ? "" : "s"} ago`;
  }

  const years = months / 12;
  return `${Math.floor(years)} year${Math.floor(years) === 1 ? "" : "s"} ago`;
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
const MAX_RANDOM_ID   = 40_000_000;

export function getRandomCommentId(): number {
  return 1 + Math.floor(Math.random() * MAX_RANDOM_ID);
}
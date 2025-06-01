/**
 * Convert a Unix-epoch seconds timestamp into a relative‐time string
 * like “42 seconds ago”, “5 minutes ago”, “3 hours ago”, or “2 days ago”.
 */
export function getTimeString(unixSeconds: number): string {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const diff = Math.max(nowSeconds - unixSeconds, 0); // guard against future dates

  if (diff < 60) {
    return `${diff} second${diff === 1 ? "" : "s"} ago`;
  }

  const minutes = Math.floor(diff / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
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
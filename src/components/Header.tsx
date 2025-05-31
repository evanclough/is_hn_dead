import Link from "next/link";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      {/* Robot icon → root */}
      <Link href="/">
        <span aria-label="robot icon" className={styles.robotBadge}>
          🤖
        </span>
      </Link>

      {/* Title → root */}
      <Link href="/" className={styles.title}>
        Hacker News?
      </Link>

      {/* Inline links */}
      <div className={styles.links}>
        <Link href="/results" className={styles.link}>
          results
        </Link>

        <span className={styles.pipe}>|</span>

        <Link
          href="https://news.ycombinator.com"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          writeup
        </Link>

        <span className={styles.pipe}>|</span>

        <Link
          href="https://news.ycombinator.com"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          source
        </Link>
      </div>
    </header>
  );
}

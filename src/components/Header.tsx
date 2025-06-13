import Link from "next/link";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.robotLink}>
        <span aria-label="robot icon" className={styles.robotBadge}>
          🤖
        </span>
      </Link>

      <div className={styles.navBlock}>
        <Link href="/" className={styles.title}>
          Hacker News?
        </Link>

        <nav className={styles.links}>
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
        </nav>
      </div>
    </header>
  );
}

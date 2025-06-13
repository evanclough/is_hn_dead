import "@/app/globals.css";
import Header from "@/components/Header";
import styles from "./Container.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Is Hacker News Dead?",
  description: "An experiment on the validity of the Dead Internet Theory, performed on Hacker News.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/question_mark.svg" type="image/svg+xml" />
      </head>
      <body>
        <div className={styles.container}>
          <Header />
          <main className={styles.main}>{children}</main>
        </div>
      </body>
    </html>
  );
}

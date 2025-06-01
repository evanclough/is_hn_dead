/*

  Container for the whole frontend, shows the header at the top.

*/
import "@/app/globals.css";
import Header from "@/components/Header";
import styles from "./AppBox.module.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HN Clone",
  description: "A Hacker-News-style site with AI bots",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* Reset default margins globally in CSS; no Tailwind needed */}
      <body>
        <div className={styles.container}>
          <Header />

          <main className={styles.main}>{children}</main>
        </div>
      </body>
    </html>
  );
}

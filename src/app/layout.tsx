// Minimal root layout – nothing but the required HTML/BODY wrapper.
// Keep the import if you generated Tailwind via `create-next-app --tailwind`.
import "./globals.css";

export const metadata = {
  title: "HN-Clone",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
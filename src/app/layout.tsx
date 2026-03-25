import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Party Match 💘",
  description: "Find your perfect match at the party!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}

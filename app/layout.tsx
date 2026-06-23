import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gorgon.Net — AI Web3 Search Engine",
  description: "Search, discover, and securely browse Web3 protocols with AI-powered trust scoring. Powered by the 0G decentralized knowledge graph.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

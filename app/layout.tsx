import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#07060A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Gorgon.Net — AI Web3 Search Engine",
  description: "Search, discover, and securely browse Web3 protocols with AI-powered trust scoring. Powered by the 0G decentralized knowledge graph.",
  keywords: ["Web3", "AI", "0G", "Security", "Search Engine", "Crypto", "DeFi"],
  metadataBase: new URL("https://gorgon.net"),
  openGraph: {
    title: "Gorgon.Net — AI Web3 Search Engine",
    description: "Search, discover, and securely browse Web3 protocols with AI-powered trust scoring.",
    url: "https://gorgon.net",
    siteName: "Gorgon.Net",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Gorgon.Net Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gorgon.Net — AI Web3 Search Engine",
    description: "Search, discover, and securely browse Web3 protocols with AI-powered trust scoring.",
    images: ["/opengraph-image.png"],
  },
  manifest: "/manifest.json",
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

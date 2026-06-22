import { createFileRoute } from "@tanstack/react-router";
import { BrowserLayout } from "../components/BrowserLayout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aegis — AI Trust Layer for Web3" },
      { name: "description", content: "Aegis is the AI trust layer for Web3 — a Chrome sidebar that explains, scores, and sandboxes every site and transaction before you sign." },
      { property: "og:title", content: "Aegis — AI Trust Layer for Web3" },
      { property: "og:description", content: "Sidebar AI that explains, scores, and sandboxes every Web3 interaction before you sign." },
    ],
  }),
  component: Index,
});

function Index() {
  return <BrowserLayout />;
}


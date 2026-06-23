import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  FlaskConical,
  Settings,
  HelpCircle,
  Globe,
  Ban,
  Network,
  Users,
  Compass,
  FileSearch,
  MessageSquarePlus,
  ThumbsUp,
  ChevronDown,
  FileText,
  AlertTriangle,
  Flag,
  Check,
  X,
  Wallet,
  ArrowRightLeft,
  Database,
  Lock,
  Unlock,
  Plus,
  Sparkles,
  MessageCircle,
  TrendingUp,
  Flame,
  Star,
  ChevronRight,
  Zap,
} from "lucide-react";
import { MockDApps } from "./MockDApps";
import { SimulatedWalletDialog } from "./SimulatedWalletDialog";
import { SearchResults } from "./SearchResults";
import { AiChatPanel } from "./AiChatPanel";
import { OgNetworkPanel } from "./OgNetworkPanel";
import { loadSession, saveSession, addSearchHistory } from "../lib/session";
import { toast } from "sonner";
import { ogChat, CHAT_MODEL } from "../lib/og-client";

interface TimelineEvent {
  risk: "low" | "med" | "high";
  time: string;
  action: string;
  detail: string;
}

interface SiteRecord {
  favicon: string;
  domain: string;
  category: string;
  score: number;
  ring: string;
  threat: { level: string; pct: number; color: string };
  summary: string;
  pills: string[];
  explainer: string;
  actionExplainer: string;
  techDetails: string;
  checks: Array<{ state: string; text: string; sub: string }>;
  nodes: number;
  updated: string;
  posSentiment: number;
  negSentiment: number;
}

interface BrowserTab {
  id: string;
  title: string;
  url: string;
  history: string[];
  historyIdx: number;
}

export function BrowserLayout({ initialQuery = "" }: { initialQuery?: string }) {
  const isInitialSearch = !!initialQuery.trim();

  // --- Tab Management ---
  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: "1",
      title: isInitialSearch ? `Search: ${initialQuery}` : "Gorgon.Net — Home",
      url: isInitialSearch ? `search:${initialQuery}` : "",
      history: [isInitialSearch ? `search:${initialQuery}` : ""],
      historyIdx: 0,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>("1");
  const [urlInput, setUrlInput] = useState<string>(isInitialSearch ? initialQuery : "");

  // Get active tab helper
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // --- Browser Core State (Synced with Active Tab) ---
  const activeUrl = activeTab.url;
  const history = activeTab.history;
  const historyIdx = activeTab.historyIdx;

  // --- Sandbox Isolated Workspace Overlay ---
  const [safeMode, setSafeMode] = useState<boolean>(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState<boolean>(false);

  // Active Sidebar Tab
  const [activeTabPanel, setActiveTabPanel] = useState<
    "overview" | "scan" | "sandbox" | "discover" | "community" | "ai" | "0g"
  >("overview");

  // --- Search Engine Mode ---
  // isSearchMode=true when user typed a natural-language query (not a URL)
  const [isSearchMode, setIsSearchMode] = useState<boolean>(isInitialSearch);
  const [currentQuery, setCurrentQuery] = useState<string>(initialQuery);
  // Home page is shown when URL is empty, "home", or "new-tab"
  const [isHomePage, setIsHomePage] = useState<boolean>(!isInitialSearch);
  const [homeInput, setHomeInput] = useState<string>(initialQuery);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [historySelectedIndex, setHistorySelectedIndex] = useState<number>(-1);
  const [isSearching, setIsSearching] = useState(false);

  // Listen for urlInput clearing to dynamically reset state
  useEffect(() => {
    if (urlInput === "") {
      setIsHomePage(true);
      setIsSearchMode(false);
      setCurrentQuery("");
      setHomeInput("");
      setTabs((prevTabs) =>
        prevTabs.map((t) => (t.id === activeTabId ? { ...t, url: "", title: "Gorgon.Net — Home" } : t))
      );
    }
  }, [urlInput, activeTabId]);

  // Session mount
  useEffect(() => {
    const session = loadSession();
    setSearchHistory(session.searchHistory);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD/CTRL + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput =
          document.getElementById("omnibox-input") || document.getElementById("home-search-input");
        if (searchInput) {
          searchInput.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Built-in Wallet Manager Panel Toggle
  const [isWalletOpen, setIsWalletOpen] = useState<boolean>(false);

  // Virtual Wallet State (shared across tabs for demo consistency)
  const [wallet, setWallet] = useState({
    eth: 10.0,
    usdc: 5000.0,
    nfts: ["Bored Ape #4210", "Mutant Ape #8892"],
  });

  // Real Wallet State
  const [realWalletAddress, setRealWalletAddress] = useState<string | null>(null);

  const connectWallet = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
        if (accounts.length > 0) {
          setRealWalletAddress(accounts[0]);
          import("sonner").then(({ toast }) => toast.success("Wallet connected securely"));
        }
      } catch (err: any) {
        import("sonner").then(({ toast }) =>
          toast.error(err.message || "Failed to connect wallet"),
        );
      }
    } else {
      import("sonner").then(({ toast }) =>
        toast.error("Please install MetaMask or another Web3 wallet."),
      );
    }
  };

  // Sandbox Timeline & Debrief Logs
  const [timeline, setTimeline] = useState<TimelineEvent[]>([
    {
      risk: "low",
      time: "00:02",
      action: "Connect wallet",
      detail: "Requested virtual wallet address — eth_accounts",
    },
  ]);
  const [simActionsCount, setSimActionsCount] = useState<number>(1);
  const [hiddenCallsCount, setHiddenCallsCount] = useState<number>(0);
  const [flagsCount, setFlagsCount] = useState<number>(0);
  const [activeModel, setActiveModel] = useState("deepseek-v4-flash");

  // Signature Interception & Pre-sign AI Audit Modal
  const [isSignModalOpen, setIsSignModalOpen] = useState<boolean>(false);
  const [pendingTx, setPendingTx] = useState<any>(null);

  // Normal Mode: AI Contract Audit Progress before signature
  const [isAiInterpreting, setIsAiInterpreting] = useState<boolean>(false);
  const [aiInterpretationStep, setAiInterpretationStep] = useState<string>("");

  // Debrief Modal
  const [isDebriefOpen, setIsDebriefOpen] = useState<boolean>(false);

  // 0G Decentralized Knowledge Graph Registry
  const [ogNodesCount, setOgNodesCount] = useState<number>(1284);
  const [ogSyncedRecords, setOgSyncedRecords] = useState<number>(312);
  const [isQueryingOg, setIsQueryingOg] = useState<boolean>(false);
  const [ogCacheStatus, setOgCacheStatus] = useState<string>("Cached"); // "Cached", "New Registry", "Syncing"
  const [ogQueryTime, setOgQueryTime] = useState<number>(142); // ms

  // Community Reports list
  const [reports, setReports] = useState<
    Array<{ user: string; date: string; text: string; helpful: number }>
  >([
    {
      user: "0x7a…F31",
      date: "2 days ago",
      text: "Smooth swap on Arbitrum, gas was reasonable. Confirmed legit frontend via ENS resolver.",
      helpful: 42,
    },
    {
      user: "vault.eth",
      date: "5 days ago",
      text: "Used the new Universal Router for a multi-hop. Worked as expected.",
      helpful: 17,
    },
  ]);
  const [newReportText, setNewReportText] = useState("");
  const [showReportForm, setShowReportForm] = useState(false);

  // Core registry of site safety data (simulates 0G database)
  const [ogGraphRegistry, setOgGraphRegistry] = useState<Record<string, SiteRecord>>({
    "app.uniswap.org": {
      favicon: "U",
      domain: "app.uniswap.org",
      category: "DEX · Multi-chain",
      score: 95,
      ring: "green",
      threat: { level: "Very Low", pct: 8, color: "#16A34A" },
      summary:
        "Established decentralized exchange. No suspicious signals detected. Trusted by 4.2M wallets.",
      pills: ["Community Trust", "New User Friendly", "Audited"],
      explainer:
        "Uniswap is one of the largest decentralized exchanges on Ethereum, letting you swap tokens directly from your wallet without intermediaries.",
      actionExplainer:
        "The page is offering token swaps. Connecting your wallet allows the site to read balances and request swap signatures — it cannot move funds without your approval.",
      techDetails:
        "Router: 0xE592427A0AEce92De3Edee1F18E0157C05861564\nFrontend: Vercel · IPFS mirror available\nFramework: UniversalRouter v1.2\nNetwork calls: wss://mainnet.infura.io, https://api.uniswap.org",
      checks: [
        { state: "pass", text: "Domain age", sub: "Registered 2018 · 6 years old" },
        { state: "pass", text: "Smart contract verified", sub: "Source matches deployed bytecode" },
        { state: "pass", text: "UI fingerprint match", sub: "Matches official Uniswap interface" },
        { state: "pass", text: "Phishing patterns", sub: "No known phishing markers found" },
        { state: "pass", text: "Deployer reputation", sub: "Multisig — 12 trusted signers" },
        { state: "pass", text: "Community signal", sub: "96% positive across 128 reports" },
      ],
      nodes: 1284,
      updated: "Updated 4 min ago",
      posSentiment: 96,
      negSentiment: 4,
    },
    "uniswap-airdrop-claim.xyz": {
      favicon: "!",
      domain: "uniswap-airdrop-claim.xyz",
      category: "Unknown · Claimed Airdrop",
      score: 14,
      ring: "red",
      threat: { level: "Critical", pct: 92, color: "#E53935" },
      summary:
        "Newly registered domain impersonating Uniswap. Contract is unverified and requests unlimited token access.",
      pills: ["No Community Trust", "High Risk", "Unaudited"],
      explainer:
        "This site claims to offer a Uniswap airdrop but the official Uniswap team has not announced any airdrop. The page mimics Uniswap's branding to appear legitimate.",
      actionExplainer:
        "You are being asked to connect your wallet and sign an approval transaction that grants the site unlimited access to your tokens. This is a common drain pattern.",
      techDetails:
        "Domain registered: 4 hours ago via Namecheap\nContract: 0x9a3c…f8b1 (unverified)\nDeployer: 0x4d2b…e102 (linked to 3 prior drainer contracts)\nFrontend: Vercel · cloned UI bundle",
      checks: [
        { state: "fail", text: "Domain age", sub: "Registered 4 hours ago" },
        { state: "fail", text: "Smart contract verified", sub: "Unverified bytecode" },
        { state: "fail", text: "UI fingerprint match", sub: "Copied from app.uniswap.org" },
        { state: "fail", text: "Phishing patterns", sub: "Matches known ‘claim airdrop’ template" },
        { state: "fail", text: "Deployer reputation", sub: "Linked to 3 prior drainer contracts" },
        { state: "warn", text: "Community signal", sub: "11 reports — 100% negative" },
      ],
      nodes: 42,
      updated: "Just now",
      posSentiment: 0,
      negSentiment: 100,
    },
    "ape-vaults-mint.net": {
      favicon: "A",
      domain: "ape-vaults-mint.net",
      category: "Unknown · NFT Claim",
      score: 22,
      ring: "red",
      threat: { level: "High Risk", pct: 78, color: "#E53935" },
      summary:
        "Newly created page claiming to mint Bored Ape NFTs. Hidden calls request authorization to steal existing NFTs.",
      pills: ["Suspicious Activity", "Collectibles Risk", "Unaudited"],
      explainer:
        "This site claims to offer a free mint of Bored Ape Yacht Club NFTs. The official collection is closed, and this site is unaffiliated.",
      actionExplainer:
        "You are being asked to click 'Mint NFT', but the underlying contract requests approval for your existing NFTs (setApprovalForAll) rather than minting new ones.",
      techDetails:
        "Domain registered: 26 hours ago\nContract: 0x76b2…19ea (unverified)\nTarget Function: setApprovalForAll(0x76b2...)\nMatches pattern: collection-wide operator authorization",
      checks: [
        { state: "fail", text: "Domain age", sub: "Registered 26 hours ago" },
        { state: "fail", text: "Smart contract verified", sub: "Unverified bytecode" },
        { state: "warn", text: "UI fingerprint match", sub: "Imitates Bored Ape Yacht Club theme" },
        {
          state: "fail",
          text: "Phishing patterns",
          sub: "Requests approval for external collections",
        },
        {
          state: "pass",
          text: "Deployer reputation",
          sub: "First deployed contract from this address",
        },
        { state: "warn", text: "Community signal", sub: "4 reports — 100% negative" },
      ],
      nodes: 95,
      updated: "Updated 10 min ago",
      posSentiment: 0,
      negSentiment: 100,
    },
  });

  // Resolve activeMeta with dynamic search results metadata or default/cached registry record
  const getActiveMeta = (): SiteRecord => {
    const registryRecord = ogGraphRegistry[activeUrl];
    if (registryRecord) return registryRecord;

    if (activeUrl && activeUrl.startsWith("search:")) {
      const query = activeUrl.replace("search:", "");
      const isScamQuery = query.includes("airdrop") || query.includes("claim") || query.includes("free") || query.includes("mint");
      const score = isScamQuery ? 14 : 85;
      const ring = score > 80 ? "green" : score > 40 ? "amber" : "red";
      const color = score > 80 ? "#16A34A" : score > 40 ? "#F59E0B" : "#E53935";

      return {
        favicon: "Q",
        domain: `Search: "${query}"`,
        category: "Search Query Security Assessment",
        score: score,
        ring: ring as any,
        threat: {
          level: isScamQuery ? "High Risk" : "Low Risk",
          pct: 100 - score,
          color: color,
        },
        summary: isScamQuery
          ? `Gorgon AI warning: The term "${query}" is highly correlated with Web3 phishing vectors, collection drainers, and fake claim templates.`
          : `Gorgon AI search: Querying 0G Network nodes for protocols related to "${query}". No active threats found for this search term.`,
        pills: ["Search Query", "0G Compute", isScamQuery ? "High Risk Term" : "Standard Term"],
        explainer: `This panel shows a real-time safety assessment of your search query: "${query}".`,
        actionExplainer: isScamQuery
          ? "WARNING: Clicking links from search results for this term demands extreme signature authorization audits."
          : "Standard search results. Always inspect the URL of any protocol before executing signatures.",
        techDetails: `Query: ${query}\nInference: 0G Router API (minimax-m3)\nGraph Nodes Checked: 128`,
        checks: [
          {
            state: isScamQuery ? "fail" : "pass",
            text: "Search Query Vector",
            sub: isScamQuery ? "Matches high-risk phishing signatures" : "No active phishing signature match",
          },
          {
            state: "pass",
            text: "0G Registry Lookup",
            sub: "Search terms indexed successfully",
          },
        ],
        nodes: 128,
        updated: "Just now",
        posSentiment: isScamQuery ? 10 : 90,
        negSentiment: isScamQuery ? 90 : 10,
      };
    }

    return ogGraphRegistry["app.uniswap.org"];
  };

  const activeMeta = getActiveMeta();

  // Detect if input is a natural-language search query vs a URL
  const detectInputMode = (input: string): "search" | "url" | "home" => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed === "" || trimmed === "home" || trimmed === "newtab" || trimmed === "new tab")
      return "home";
    // Has spaces → almost certainly a natural language query
    if (trimmed.includes(" ")) return "search";
    // Has a valid TLD pattern → URL
    if (/^[a-z0-9-]+\.[a-z]{2,}/.test(trimmed)) return "url";
    // Short keyword without spaces → treat as search
    return "search";
  };

  // Handle unified search/navigate input
  const handleSearchOrNavigate = (input: string) => {
    const mode = detectInputMode(input);
    if (mode === "home") {
      setIsHomePage(true);
      setIsSearchMode(false);
      setCurrentQuery("");
      setHomeInput("");
      return;
    }
    if (mode === "search") {
      setIsHomePage(false);
      setIsSearchMode(true);
      setCurrentQuery(input.trim());
      setUrlInput(input.trim());

      const newHistory = addSearchHistory(input.trim());
      setSearchHistory(newHistory);

      setTabs((prevTabs) =>
        prevTabs.map((t) => {
          if (t.id === activeTabId) {
            const nextHistory = t.history.slice(0, t.historyIdx + 1);
            nextHistory.push(`search:${input.trim()}`);
            return {
              ...t,
              title: `Search: ${input.trim()}`,
              url: `search:${input.trim()}`,
              history: nextHistory,
              historyIdx: nextHistory.length - 1,
            };
          }
          return t;
        }),
      );
      return;
    }
    // URL mode — normal navigation
    setIsHomePage(false);
    setIsSearchMode(false);
    setCurrentQuery("");
    navigateTo(input);
  };

  // When switching page on the current active tab
  const navigateTo = (url: string) => {
    let cleanUrl = url.trim().toLowerCase();

    // Auto-normalize presets
    if (cleanUrl.includes("uniswap-airdrop")) cleanUrl = "uniswap-airdrop-claim.xyz";
    else if (cleanUrl.includes("ape-vaults")) cleanUrl = "ape-vaults-mint.net";
    else if (cleanUrl.includes("uniswap") || cleanUrl === "uniswap") cleanUrl = "app.uniswap.org";

    if (!cleanUrl.includes(".") && cleanUrl !== "") {
      cleanUrl = cleanUrl + ".io";
    }

    setUrlInput(cleanUrl);
    setIsWalletOpen(false);

    // Trigger 0G Network loading simulation
    setIsQueryingOg(true);
    const isNew = !ogGraphRegistry[cleanUrl];

    const delay = isNew ? 1500 : 700;
    setOgQueryTime(isNew ? 1120 : 142);
    setOgCacheStatus(isNew ? "New Registry" : "Cached");

    setTimeout(() => {
      if (isNew) {
        // Generate on-the-fly AI security analysis for the typed site
        const score =
          cleanUrl.includes("scam") || cleanUrl.includes("claim") || cleanUrl.includes("free")
            ? 28
            : 78;
        const isMalicious = score < 40;

        const newRecord: SiteRecord = {
          favicon: cleanUrl.charAt(0).toUpperCase(),
          domain: cleanUrl,
          category: isMalicious ? "Suspicious · Unverified Protocol" : "Utility · Newly Indexed",
          score: score,
          ring: score > 80 ? "green" : score > 40 ? "amber" : "red",
          threat: {
            level: score > 80 ? "Low Risk" : score > 40 ? "Medium Risk" : "Critical Risk",
            pct: 100 - score,
            color: score > 80 ? "#16A34A" : score > 40 ? "#F59E0B" : "#E53935",
          },
          summary: isMalicious
            ? `Safety warning: Domain '${cleanUrl}' is unregistered in major Web3 directories. AI audits detected hidden collection access structures.`
            : `Audited safety scan of '${cleanUrl}' showed normal smart-contract execution wrappers and verified contract structures.`,
          pills: isMalicious
            ? ["New Domain", "Unverified Code"]
            : ["Newly Syncing", "Single Audited"],
          explainer: `Aegis AI Explainer: This page represents the frontend interface for ${cleanUrl}. Plain English review shows it connects your address to initiate Web3 operations.`,
          actionExplainer: isMalicious
            ? "WARNING: Interactions on this domain demand signature authorization. Carefully verify contract functions before approving signatures."
            : "This page requests standard contract connections to read balances and execute calls.",
          techDetails: `Contract: 0x${Math.random().toString(16).slice(2, 10)}…${Math.random().toString(16).slice(2, 6)}\nFrontend: IPFS\nNetwork Sync: 0G Network Stored`,
          checks: [
            {
              state: isMalicious ? "fail" : "warn",
              text: "Domain Registration",
              sub: `Registered recently. Safe age not met.`,
            },
            {
              state: isMalicious ? "fail" : "pass",
              text: "Bytecode signature",
              sub: isMalicious
                ? "Found operator role phishing patterns"
                : "Standard ERC contract format matched",
            },
            { state: "warn", text: "0G Sync state", sub: "Fresh node broadcast pending" },
          ],
          nodes: 1,
          updated: "Just now",
          posSentiment: isMalicious ? 10 : 80,
          negSentiment: isMalicious ? 90 : 20,
        };

        setOgGraphRegistry((prev) => ({ ...prev, [cleanUrl]: newRecord }));
        setOgCacheStatus("Syncing");
        setOgNodesCount((c) => c + 1);
        setOgSyncedRecords((r) => r + 1);
      }

      // Update Active Tab State
      setTabs((prevTabs) =>
        prevTabs.map((t) => {
          if (t.id === activeTabId) {
            const nextHistory = t.history.slice(0, t.historyIdx + 1);
            nextHistory.push(cleanUrl);

            let tabTitle = cleanUrl.split(".")[0].toUpperCase();
            if (cleanUrl.includes("uniswap-airdrop")) tabTitle = "UNI Claim";
            else if (cleanUrl.includes("ape-vaults")) tabTitle = "BAYC Mint";
            else if (cleanUrl === "app.uniswap.org") tabTitle = "Uniswap";

            return {
              ...t,
              title: tabTitle,
              url: cleanUrl,
              history: nextHistory,
              historyIdx: nextHistory.length - 1,
            };
          }
          return t;
        }),
      );

      setIsQueryingOg(false);

      // Reset Sandbox events
      setTimeline([
        {
          risk: "low",
          time: "00:02",
          action: "Connect wallet",
          detail: "Requested virtual wallet address — eth_accounts",
        },
      ]);
      setSimActionsCount(1);
      setHiddenCallsCount(0);
      setFlagsCount(0);

      if (cleanUrl === "app.uniswap.org") {
        setActiveTabPanel("overview");
        toast.success(`Navigated to ${cleanUrl} safely.`);
      } else {
        setActiveTabPanel("scan");
        const targetScore = isNew
          ? cleanUrl.includes("scam") || cleanUrl.includes("claim") || cleanUrl.includes("free")
            ? 28
            : 78
          : (ogGraphRegistry[cleanUrl]?.score ?? 78);
        if (targetScore < 40) {
          toast.error(`Warning: High-risk domain blocked from executing auto-transactions.`);
        } else {
          toast.info(`Navigation complete. AI Audit generated.`);
        }
      }
    }, delay);
  };

  const handleBack = () => {
    if (historyIdx > 0) {
      const idx = historyIdx - 1;
      const url = history[idx];
      setUrlInput(url);
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, url, historyIdx: idx } : t)),
      );
    }
  };

  const handleForward = () => {
    if (historyIdx < history.length - 1) {
      const idx = historyIdx + 1;
      const url = history[idx];
      setUrlInput(url);
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, url, historyIdx: idx } : t)),
      );
    }
  };

  const handleRefresh = () => {
    navigateTo(activeUrl);
  };

  // --- Multi-Tab Handlers ---
  const handleAddTab = () => {
    const newId = Math.random().toString();
    const newTab: BrowserTab = {
      id: newId,
      title: "New Tab",
      url: "home",
      history: ["home"],
      historyIdx: 0,
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
    setUrlInput("");
    setSafeMode(false);
    setIsSandboxOpen(false);
    setIsHomePage(true);
    setIsSearchMode(false);
    setHomeInput("");
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return; // Keep at least one tab open

    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);

    if (activeTabId === id) {
      const remainingTab = newTabs[newTabs.length - 1];
      setActiveTabId(remainingTab.id);
      setUrlInput(remainingTab.url);
    }
  };

  const handleSelectTab = (id: string) => {
    setActiveTabId(id);
    const selectedTab = tabs.find((t) => t.id === id) || tabs[0];
    setUrlInput(selectedTab.url);
    setSafeMode(false);
    setIsSandboxOpen(false);
  };

  // Intercept signature requests from mock dApps
  const handleActionTrigger = (tx: any) => {
    if (safeMode || isSandboxOpen) {
      // Sandbox mode: route to sandbox signature popups
      setPendingTx({
        ...tx,
        onApprove: () => {
          const timestamp = `00:${(timeline.length * 7 + 4).toString().padStart(2, "0")}`;
          const newEvent: TimelineEvent = {
            risk: tx.risk.cls === "crit" ? "high" : tx.risk.cls === "med" ? "med" : "low",
            time: timestamp,
            action: tx.title,
            detail: tx.plain,
          };
          setTimeline((prev) => [...prev, newEvent]);
          setSimActionsCount((c) => c + 1);
          if (tx.approveDanger) {
            setHiddenCallsCount((c) => c + 2);
            setFlagsCount((c) => c + 3);
          }
          tx.onApprove();
        },
      });
      setIsSignModalOpen(true);
    } else {
      // Normal Mode: Trigger AI Transaction bytecode Interpreter / Auditor in sidebar first
      setIsAiInterpreting(true);
      setActiveTabPanel("scan");
      setAiInterpretationStep("Querying 0G Network for contract audit...");

      ogChat(
        [
          {
            role: "user",
            content: `Audit this transaction:\nTitle: ${tx.title}\nDetails: ${tx.plain}\nIs this safe?`,
          },
        ],
        {
          model: CHAT_MODEL,
          systemPrompt:
            "You are Gorgon AI, an expert smart contract auditor. Analyze the transaction and respond with a short risk assessment.",
          max_tokens: 150,
        },
      )
        .then(() => {
          setAiInterpretationStep("Evaluation complete. Showing risk debrief.");
          setIsAiInterpreting(false);
          toast.info("AI Transaction Audit Complete");
          setPendingTx({
            ...tx,
            onApprove: () => {
              tx.onApprove();
            },
          });
          setIsSignModalOpen(true);
        })
        .catch((err) => {
          console.error("AI Audit error:", err);
          setAiInterpretationStep("Evaluation fallback. Showing risk debrief.");
          setIsAiInterpreting(false);
          setPendingTx({
            ...tx,
            onApprove: () => {
              tx.onApprove();
            },
          });
          setIsSignModalOpen(true);
        });
    }
  };

  const handleConfirmApprove = (updatedBalances: { eth: number; usdc: number; nfts: string[] }) => {
    setWallet(updatedBalances);
  };

  const resetWallet = () => {
    setWallet({
      eth: 10.0,
      usdc: 5000.0,
      nfts: ["Bored Ape #4210", "Mutant Ape #8892"],
    });
    navigateTo(activeUrl);
  };

  const handleCommunitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReportText.trim()) return;
    const newReport = {
      user: "0x7a…F31",
      date: "Just now",
      text: newReportText,
      helpful: 0,
    };
    setReports([newReport, ...reports]);
    setNewReportText("");
    setShowReportForm(false);

    setOgSyncedRecords((r) => r + 1);
    setOgCacheStatus("Syncing");
    setTimeout(() => setOgCacheStatus("Cached"), 1500);
  };

  // Launching the Isolated Sandbox Workspace overlay
  const handleOpenSandbox = () => {
    setSafeMode(true);
    setIsSandboxOpen(true);
    // Seed default sandbox traces
    setTimeline([
      {
        risk: "low",
        time: "00:02",
        action: "Forking mainnet chain",
        detail: "Creating isolated simulation sandbox fork at block 19284210",
      },
      {
        risk: "low",
        time: "00:03",
        action: "Connect wallet",
        detail: "Requested virtual wallet address — eth_accounts",
      },
    ]);
    setSimActionsCount(1);
    setHiddenCallsCount(0);
    setFlagsCount(0);
  };

  const handleCloseSandbox = () => {
    setSafeMode(false);
    setIsSandboxOpen(false);
  };

  const isBlocked =
    !safeMode && (activeUrl === "uniswap-airdrop-claim.xyz" || activeUrl === "ape-vaults-mint.net");

  return (
    <div className="w-full h-screen bg-[#07060A] text-[#ECECF3] flex flex-col font-sans antialiased overflow-hidden">
      {/* ===== STANDALONE BROWSER FRAME CONTAINER ===== */}
      <div className="w-full h-full bg-[#0E0E17] flex flex-col overflow-hidden relative">
        {/* Desktop window controls and browser tabs */}
        <div className="bg-[#121220] border-b border-[#212133] px-4 py-2.5 flex items-center justify-between gap-4 z-40 select-none">
          {/* OS Windows controls + Gorgon.Net wordmark */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Gorgon.Net logo mark */}
            <button
              onClick={() => {
                setIsHomePage(true);
                setIsSearchMode(false);
                setUrlInput("");
                setHomeInput("");
              }}
              className="flex items-center gap-1.5 group"
              title="Gorgon.Net Home"
            >
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#6C47FF] to-[#9F86FF] flex items-center justify-center shadow-[0_0_8px_rgba(108,71,255,0.4)]">
                <Shield className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-black text-white group-hover:text-[#9F86FF] transition-colors tracking-tight">
                Gorgon<span className="text-[#9F86FF]">.Net</span>
              </span>
            </button>
          </div>

          {/* Browser Tabs - MULTIPLE TABS SUPPORTED */}
          <div className="flex items-center gap-1.5 flex-1 overflow-x-auto scrollbar-none py-1">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  onClick={() => handleSelectTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all border ${
                    isActive
                      ? "bg-[#181829] border-[#2C2C43] text-white shadow-inner"
                      : "bg-[#12121E]/40 border-transparent text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-[#6C47FF]" : "bg-gray-700"}`}
                  ></span>
                  <span className="truncate max-w-[90px]">{tab.title}</span>
                  <button
                    onClick={(e) => handleCloseTab(tab.id, e)}
                    className="text-gray-500 hover:text-white font-bold ml-1 text-[10px]"
                  >
                    ×
                  </button>
                </div>
              );
            })}
            <button
              onClick={handleAddTab}
              className="w-7 h-7 rounded bg-[#1B1B2C] hover:bg-[#2A2A3F] flex items-center justify-center text-gray-400 text-xs font-bold transition-all flex-shrink-0"
              title="Open New Tab"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Browser Secondary Navigation bar */}
        <div className="bg-[#13131F] border-b border-[#222235] px-4 py-3 flex items-center justify-between gap-4 z-35 shadow-md">
          {/* Nav Controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleBack}
              disabled={historyIdx === 0}
              className="w-7 h-7 rounded-lg bg-[#1B1B2C] hover:bg-[#2B2B3E] disabled:opacity-40 flex items-center justify-center text-gray-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleForward}
              disabled={historyIdx === history.length - 1}
              className="w-7 h-7 rounded-lg bg-[#1B1B2C] hover:bg-[#2B2B3E] disabled:opacity-40 flex items-center justify-center text-gray-300 transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRefresh}
              className="w-7 h-7 rounded-lg bg-[#1B1B2C] hover:bg-[#2B2B3E] flex items-center justify-center text-gray-300 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* URL / Search bar - Dual Mode */}
          <div className="flex-1 max-w-[700px] relative flex items-center bg-[#1A1A2B] border border-[#2B2B43] rounded-xl pr-1 focus-within:border-[#6C47FF] transition-all">
            <div className="pl-3 flex items-center justify-center text-gray-400">
              {isSearchMode ? (
                <Sparkles className="w-3.5 h-3.5 text-[#9F86FF] animate-pulse" />
              ) : isHomePage ? (
                <Search className="w-3.5 h-3.5 text-gray-500" />
              ) : activeMeta.score > 80 ? (
                <Lock className="w-3.5 h-3.5 text-green-500" />
              ) : activeMeta.score > 40 ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Ban className="w-3.5 h-3.5 text-red-500" />
              )}
            </div>
            <input
              id="omnibox-input"
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchOrNavigate(urlInput)}
              className="w-full bg-transparent border-0 py-2 pl-2.5 pr-20 text-xs outline-none text-[#ECECF3]"
             placeholder="Search Web3 (e.g. 'best DEX') or enter a URL..."
            />
            {/* Clear input button */}
            {urlInput && (
              <button
                onClick={() => setUrlInput("")}
                className="absolute right-9 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all text-xs font-bold cursor-pointer"
                title="Clear Search"
              >
                ×
              </button>
            )}
            {/* Shortcut hint badge */}
            {!urlInput && (
              <span className="absolute right-9 top-1/2 -translate-y-1/2 text-[8px] font-bold text-gray-500 border border-gray-700/50 px-1.5 py-0.5 rounded-md hidden md:block">
                ⌘K
              </span>
            )}
            {/* Mode indicator badge */}
            {urlInput.includes(" ") && (
              <span className="absolute right-16 top-1/2 -translate-y-1/2 text-[8px] font-bold text-[#9F86FF] bg-[#6C47FF]/10 border border-[#6C47FF]/20 px-1.5 py-0.5 rounded-md">
                AI
              </span>
            )}
            {/* Search/Navigate button */}
            <button
              onClick={() => handleSearchOrNavigate(urlInput)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded hover:bg-[#2B2B3E] flex items-center justify-center text-gray-400 hover:text-white transition-all"
              title="Search or Navigate"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sandbox Toggle Switch & Wallet */}
          <div className="flex items-center gap-3">
            <button
              onClick={connectWallet}
              className="px-3 py-1.5 bg-[#1B1B2C] hover:bg-[#2B2B3E] border border-[#2B2B43] rounded-lg text-[10px] font-bold text-gray-300 transition-colors flex items-center gap-1.5"
            >
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              {realWalletAddress
                ? `${realWalletAddress.slice(0, 6)}...${realWalletAddress.slice(-4)}`
                : "Connect Wallet"}
            </button>

            <div className="w-px h-5 bg-[#2B2B43]"></div>

            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 select-none">
              <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
              Sandbox Isolated Mode
            </span>
            <button
              onClick={() => {
                if (!safeMode) {
                  handleOpenSandbox();
                } else {
                  handleCloseSandbox();
                }
              }}
              className={`w-10 h-6.0 rounded-full p-0.5 transition-colors duration-200 outline-none ${
                safeMode ? "bg-purple-600" : "bg-gray-700"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-md ${
                  safeMode ? "translate-x-4" : "translate-x-0"
                }`}
              ></div>
            </button>
          </div>
        </div>

        {/* ===== DECENTRALIZED 0G GRAPH CACHE BAR ===== */}
        <div className="bg-[#0A0A10] border-b border-[#212133]/40 px-4 py-2 flex items-center justify-between text-[11px] font-medium text-gray-400 z-10 select-none">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-purple-400" />
            {isQueryingOg ? (
              <span className="animate-pulse">Searching 0G Decentralized Knowledge Graph...</span>
            ) : ogCacheStatus === "Syncing" ? (
              <span className="text-yellow-500 animate-pulse">
                Syncing new security registry to 0G storage nodes...
              </span>
            ) : (
              <span>
                0G Cache:{" "}
                <span
                  className={
                    activeUrl.includes("claim") || activeUrl.includes("mint")
                      ? "text-red-400"
                      : "text-green-400"
                  }
                >
                  {activeUrl.includes("claim") || activeUrl.includes("mint")
                    ? "Threat Flagged"
                    : "Verified Safe"}
                </span>{" "}
                (Node #{activeMeta.score > 80 ? "48" : "129"} latency {ogQueryTime}ms)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span>
              Global Registry: <strong className="text-white">{ogSyncedRecords}</strong> sites
            </span>
            <span>
              Graph Nodes: <strong className="text-white">{ogNodesCount}</strong> verified
            </span>
          </div>
        </div>

        {/* ===== BROWSER VIEWPORT & SIDEBAR SPLIT (Normal Live Mode) ===== */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* Left Panel: Web Page Viewport / Home / Search Results */}
          <div className="flex-1 flex flex-col bg-[#05050A] overflow-y-auto p-4 lg:p-6 min-h-[400px]">
            {isHomePage ? (
              /* ── HOME / NEW TAB PAGE ── */
              <div className="flex flex-col items-center justify-center min-h-full py-12 px-4">
                {/* Gorgon.Net logo */}
                <div className="relative mb-8 flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#6C47FF]/20 rounded-full blur-xl scale-150" />
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6C47FF] to-[#9F86FF] flex items-center justify-center shadow-[0_0_40px_rgba(108,71,255,0.4)]">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h1 className="text-3xl font-black text-white tracking-tight">
                      Gorgon<span className="text-[#9F86FF]">.Net</span>
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                      AI-Powered Web3 Search Engine · Secured by 0G Network
                    </p>
                  </div>
                </div>

                {/* Big search input */}
                <div className="w-full max-w-[560px] relative group">
                  <div className="relative flex items-center bg-[#1A1A2B] border border-[#2B2B43] rounded-2xl focus-within:border-[#6C47FF] focus-within:shadow-[0_0_30px_rgba(108,71,255,0.15)] transition-all z-10">
                    <div className="pl-4">
                      {isSearching ? (
                        <div className="w-4 h-4 border-2 border-[#6C47FF] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-[#9F86FF]" />
                      )}
                    </div>
                    <input
                      id="home-search-input"
                      type="text"
                      value={homeInput}
                      onChange={(e) => {
                        setHomeInput(e.target.value);
                        setHistorySelectedIndex(-1);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          if (searchHistory.length > 0 && !homeInput) {
                            setHistorySelectedIndex((prev) =>
                              Math.min(prev + 1, searchHistory.length - 1),
                            );
                          }
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          if (searchHistory.length > 0 && !homeInput) {
                            setHistorySelectedIndex((prev) => Math.max(prev - 1, -1));
                          }
                        } else if (e.key === "Enter") {
                          let finalQuery = homeInput.trim();
                          if (historySelectedIndex >= 0 && searchHistory[historySelectedIndex]) {
                            finalQuery = searchHistory[historySelectedIndex];
                            setHomeInput(finalQuery);
                          }
                          if (finalQuery) {
                            setIsSearching(true);
                            setUrlInput(finalQuery);
                            handleSearchOrNavigate(finalQuery);
                            setTimeout(() => setIsSearching(false), 500); // Reset after navigation triggers
                          }
                        } else if (e.key === "Escape") {
                          setHomeInput("");
                          setHistorySelectedIndex(-1);
                        }
                      }}
                      className="flex-1 bg-transparent border-0 py-4 px-3 text-sm outline-none text-[#ECECF3] placeholder-gray-500"
                      placeholder="Search Web3 protocols, tokens, DeFi... or enter a URL"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        if (homeInput.trim()) {
                          setIsSearching(true);
                          setUrlInput(homeInput.trim());
                          handleSearchOrNavigate(homeInput.trim());
                          setTimeout(() => setIsSearching(false), 500);
                        }
                      }}
                      className="mr-2 px-4 py-2 bg-[#6C47FF] hover:bg-[#5B39E6] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                    >
                      {isSearching ? "Searching..." : "Search"}
                    </button>
                  </div>

                  {/* Search History Dropdown */}
                  {searchHistory.length > 0 && !homeInput && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A2B] border border-[#2B2B43] rounded-xl shadow-2xl overflow-hidden opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible transition-all z-20">
                      <div className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-[#2B2B43]">
                        Recent Searches
                      </div>
                      <div className="max-h-48 overflow-y-auto py-1">
                        {searchHistory.map((h, i) => (
                          <button
                            key={i}
                            className={`w-full text-left px-4 py-2.5 text-xs flex items-center gap-3 transition-colors ${
                              i === historySelectedIndex
                                ? "bg-[#2B2B43] text-white"
                                : "text-gray-300 hover:bg-[#2B2B43]"
                            }`}
                            onMouseDown={(e) => {
                              // Use onMouseDown to prevent blur before click registers
                              e.preventDefault();
                              setHomeInput(h);
                              setIsSearching(true);
                              setUrlInput(h);
                              handleSearchOrNavigate(h);
                              setTimeout(() => setIsSearching(false), 500);
                            }}
                          >
                            <RotateCw
                              className={`w-3.5 h-3.5 ${i === historySelectedIndex ? "text-gray-400" : "text-gray-500"}`}
                            />
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Trending searches */}
                <div className="mt-3 flex flex-wrap items-center gap-2 justify-center">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                    Trending:
                  </span>
                  {[
                    "best DEX for swaps",
                    "ETH staking",
                    "NFT marketplace",
                    "DeFi lending",
                    "airdrop scams",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setHomeInput(q);
                        setUrlInput(q);
                        handleSearchOrNavigate(q);
                      }}
                      className="text-[10.5px] text-gray-300 bg-[#1A1A2B] hover:bg-[#252538] border border-[#2B2B43] hover:border-[#6C47FF]/40 px-2.5 py-1 rounded-full transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {/* Quick links */}
                <div className="mt-10 w-full max-w-[560px]">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 text-center">
                    Popular Protocols
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        favicon: "U",
                        name: "Uniswap",
                        domain: "app.uniswap.org",
                        category: "DEX",
                        score: 95,
                      },
                      {
                        favicon: "A",
                        name: "Aave",
                        domain: "app.aave.com",
                        category: "Lending",
                        score: 94,
                      },
                      {
                        favicon: "L",
                        name: "Lido",
                        domain: "lido.fi",
                        category: "Staking",
                        score: 92,
                      },
                      {
                        favicon: "C",
                        name: "Curve",
                        domain: "curve.fi",
                        category: "DEX",
                        score: 92,
                      },
                      {
                        favicon: "O",
                        name: "OpenSea",
                        domain: "opensea.io",
                        category: "NFTs",
                        score: 91,
                      },
                      {
                        favicon: "1",
                        name: "1inch",
                        domain: "1inch.io",
                        category: "Aggregator",
                        score: 89,
                      },
                    ].map((site) => (
                      <button
                        key={site.domain}
                        onClick={() => {
                          setIsHomePage(false);
                          navigateTo(site.domain);
                        }}
                        className="bg-[#0E0E17] hover:bg-[#181829] border border-[#212133] hover:border-[#6C47FF]/40 rounded-xl p-3 flex flex-col items-center gap-2 transition-all group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[#1A1A2B] border border-[#2B2B43] flex items-center justify-center font-black text-[#9F86FF] text-sm group-hover:border-[#6C47FF]/50 transition-all">
                          {site.favicon}
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-white">{site.name}</p>
                          <p className="text-[9px] text-gray-500">{site.category}</p>
                        </div>
                        <div className="text-[9px] font-bold text-green-400">
                          Score: {site.score}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : isSearchMode ? (
              /* ── AI SEARCH RESULTS PAGE ── */
              <div className="w-full max-w-[720px] mx-auto">
                <SearchResults
                  query={currentQuery}
                  onNavigate={(url) => {
                    setIsHomePage(false);
                    setIsSearchMode(false);
                    setCurrentQuery("");
                    navigateTo(url);
                  }}
                />
              </div>
            ) : isBlocked ? (
              /* ── Block Screen (phishing URL in Normal Live Mode) ── */
              <div className="max-w-[500px] w-full mx-auto my-auto bg-[#180F11] border border-red-900/40 p-8 rounded-2xl text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[150px] h-[150px] bg-red-600/10 rounded-full blur-2xl"></div>
                <ShieldAlert className="w-14 h-14 text-red-500 mx-auto mb-5 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]" />
                <h2 className="text-xl font-black text-red-400 mb-2 uppercase tracking-wide">
                  Blocked: Phishing Warning
                </h2>
                <p className="text-gray-300 text-xs mb-6 leading-relaxed">
                  Gorgon.Net blocked this page for your safety. It requests operator roles
                  (setApprovalForAll) or gas-less signatures (Permit2) to steal user tokens. To
                  explore safely, enter Sandbox Mode.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleOpenSandbox}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-[0_4px_15px_rgba(108,71,255,0.4)] flex items-center justify-center gap-2"
                  >
                    <FlaskConical className="w-4 h-4" /> Open Site in Isolated Sandbox
                  </button>
                  <button
                    onClick={() => {
                      setIsHomePage(true);
                      setIsSearchMode(false);
                      setUrlInput("");
                    }}
                    className="bg-transparent hover:bg-white/5 border border-gray-700 text-gray-300 hover:text-white font-bold text-xs px-4 py-3 rounded-xl transition-all"
                  >
                    Return to Home
                  </button>
                </div>
              </div>
            ) : (
              /* ── Active Mock Web3 dApp Viewport in Normal Mode ── */
              <div className="w-full max-w-[720px] mx-auto">
                <MockDApps
                  currentUrl={activeUrl}
                  onActionTrigger={handleActionTrigger}
                  walletBalance={wallet}
                  safeMode={false}
                />
              </div>
            )}
          </div>

          <aside className={`w-full lg:w-[360px] bg-[#0E0E17] border-t lg:border-t-0 lg:border-l border-[#212133] h-[500px] lg:h-auto overflow-hidden ${
            !activeUrl ? "hidden" : "flex flex-col"
          }`}>
            {/* Sidebar Site Info Section */}
            <div className="p-4 border-b border-[#212133] bg-[#121220]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1A1A2B] border border-[#2B2B43] flex items-center justify-center font-bold text-[#9F86FF] text-lg">
                  {activeMeta.favicon}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-sm text-white block truncate">
                    {activeMeta.domain}
                  </span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full`}
                      style={{
                        background: activeMeta.threat.color,
                        boxShadow: `0 0 6px ${activeMeta.threat.color}`,
                      }}
                    ></span>
                    {activeMeta.category}
                  </span>
                </div>

                {/* Circular Safety Score Ring */}
                <div className="relative w-10 h-10 flex-shrink-0">
                  <svg width="40" height="40" viewBox="0 0 40 40" className="-rotate-90">
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="#222235"
                      strokeWidth="3.5"
                    ></circle>
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke={activeMeta.threat.color}
                      strokeWidth="3.5"
                      strokeDasharray={2 * Math.PI * 16}
                      strokeDashoffset={2 * Math.PI * 16 * (1 - activeMeta.score / 100)}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    ></circle>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-black text-[11px] text-white">
                    {activeMeta.score}
                  </div>
                </div>
              </div>

              {/* Status pills */}
              <div className="flex flex-wrap gap-1 mt-2.5">
                {activeMeta.pills.map((pill: string) => (
                  <span
                    key={pill}
                    className="px-2 py-0.5 rounded-full bg-[#181829] border border-[#2B2B43] text-[9px] font-semibold text-gray-300"
                  >
                    {pill}
                  </span>
                ))}
              </div>

              {/* Plain English AI Site explainer */}
              <div className="bg-[#171727] border border-[#2B2B43]/60 p-2.5 rounded-lg mt-3 text-[11.5px] leading-relaxed text-gray-300">
                <span className="text-[9.5px] font-bold text-[#9F86FF] uppercase tracking-wider block mb-1">
                  AI Plain-English Site Explainer
                </span>
                {activeMeta.explainer}
              </div>

              {/* Sandbox isolation entry trigger button */}
              <button
                onClick={handleOpenSandbox}
                className="w-full mt-3 py-2.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-800/40 hover:border-purple-500 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
                Open In isolated Sandbox
              </button>
            </div>

            {/* Sidebar Tabs */}
            <div className="flex border-b border-[#212133] bg-[#10101C]">
              {[
                { id: "overview", label: "Overview", icon: Shield },
                { id: "scan", label: "AI Scan", icon: FileSearch },
                { id: "discover", label: "Discover", icon: Compass },
                { id: "community", label: "Reports", icon: Users },
                { id: "ai", label: "Ask AI", icon: MessageCircle },
                { id: "0g", label: "0G Net", icon: Database },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabPanel(tab.id as any)}
                  className={`py-2 text-[9.5px] font-bold flex flex-col items-center gap-1 border-b-2 transition-all flex-1 ${
                    activeTabPanel === tab.id
                      ? "border-[#6C47FF] text-[#9F86FF]"
                      : "border-transparent text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Inner Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* T1: Overview tab */}
              {activeTabPanel === "overview" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-[#181829] border border-[#2B2B43] rounded-xl p-3 text-[11px] leading-relaxed text-gray-400 space-y-2">
                    <span className="font-bold text-white block uppercase tracking-wider text-[9px] mb-1">
                      Technical Actions Requested
                    </span>
                    <p>{activeMeta.actionExplainer}</p>
                  </div>

                  <div className="bg-[#181829] border border-[#2B2B43] rounded-xl p-3 text-[11px] space-y-2">
                    <span className="font-bold text-white block uppercase tracking-wider text-[9px]">
                      Metadata (0G Network)
                    </span>
                    <pre className="text-[10px] text-gray-300 font-mono bg-[#11111A] p-2 rounded-lg border border-[#232335] overflow-x-auto">
                      {activeMeta.techDetails}
                    </pre>
                  </div>
                </div>
              )}

              {/* T2: AI Scanner Tab */}
              {activeTabPanel === "scan" && (
                <div className="space-y-4 animate-fade-in">
                  {isAiInterpreting ? (
                    <div className="bg-[#1F1810]/70 border border-[#5A3E1D]/50 p-4 rounded-xl text-center space-y-3">
                      <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto animate-bounce" />
                      <span className="font-bold text-xs text-amber-300 block uppercase tracking-wider">
                        Aegis AI Pre-Sign Interpreter
                      </span>
                      <p className="text-xs text-gray-300">{aiInterpretationStep}</p>
                      <div className="w-full bg-[#131320] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 animate-pulse"
                          style={{ width: "60%" }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#181829] border border-[#2B2B43] rounded-xl p-3.5">
                      <span className="text-[9.5px] font-bold text-gray-400 uppercase tracking-widest block mb-3">
                        AI Contract & Domain Audit
                      </span>
                      <ul className="space-y-3">
                        {activeMeta.checks.map((check: any, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-xs">
                            {check.state === "pass" ? (
                              <div className="w-4 h-4 rounded-full bg-[#0E2916] border border-[#1D5A2E] text-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            ) : check.state === "warn" ? (
                              <div className="w-4 h-4 rounded-full bg-[#291B0F] border border-[#5A3E1D] text-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-[#290F11] border border-[#5A1D20] text-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <X className="w-2.5 h-2.5" />
                              </div>
                            )}
                            <div>
                              <span className="font-semibold block text-white">{check.text}</span>
                              <span className="text-[10px] text-gray-400 block mt-0.5">
                                {check.sub}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* T3: Discover Tab */}
              {activeTabPanel === "discover" && (
                <div className="space-y-4 animate-fade-in">
                  {/* Trending Now */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-[9.5px] font-black text-gray-300 uppercase tracking-widest">
                        Trending Protocols
                      </span>
                    </div>
                    <div className="space-y-2">
                      {[
                        {
                          favicon: "U",
                          name: "Uniswap",
                          domain: "app.uniswap.org",
                          tag: "DEX",
                          score: 95,
                          color: "text-green-400",
                          change: "+12% volume",
                        },
                        {
                          favicon: "A",
                          name: "Aave",
                          domain: "app.aave.com",
                          tag: "Lending",
                          score: 94,
                          color: "text-green-400",
                          change: "$12.8B TVL",
                        },
                        {
                          favicon: "L",
                          name: "Lido",
                          domain: "lido.fi",
                          tag: "Staking",
                          score: 92,
                          color: "text-green-400",
                          change: "32B staked",
                        },
                        {
                          favicon: "B",
                          name: "Blur",
                          domain: "blur.io",
                          tag: "NFT",
                          score: 87,
                          color: "text-green-400",
                          change: "Top NFT vol",
                        },
                        {
                          favicon: "P",
                          name: "PancakeSwap",
                          domain: "pancakeswap.finance",
                          tag: "DEX",
                          score: 86,
                          color: "text-green-400",
                          change: "BSC leader",
                        },
                      ].map((site, idx) => (
                        <button
                          key={site.domain}
                          onClick={() => {
                            setIsHomePage(false);
                            setIsSearchMode(false);
                            navigateTo(site.domain);
                          }}
                          className="w-full bg-[#181829] hover:bg-[#1E1E35] border border-[#2B2B43] hover:border-[#6C47FF]/40 rounded-xl p-2.5 flex items-center gap-2.5 transition-all group text-left"
                        >
                          <span className="text-[10px] font-black text-gray-600 w-4 flex-shrink-0">
                            #{idx + 1}
                          </span>
                          <div className="w-7 h-7 rounded-lg bg-[#1A1A2B] border border-[#2B2B43] flex items-center justify-center font-black text-[#9F86FF] text-xs flex-shrink-0">
                            {site.favicon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white">{site.name}</span>
                              <span className="text-[8px] text-gray-500 bg-[#1A1A2B] border border-[#2B2B43] px-1 py-0.5 rounded">
                                {site.tag}
                              </span>
                            </div>
                            <span className="text-[9.5px] text-gray-500">{site.change}</span>
                          </div>
                          <div className="text-[10px] font-black text-green-400">{site.score}</div>
                          <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-[#9F86FF] transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scam Watch */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-[9.5px] font-black text-gray-300 uppercase tracking-widest">
                        Scam Watch 🚨
                      </span>
                    </div>
                    <div className="space-y-2">
                      {[
                        {
                          domain: "uniswap-airdrop-claim.xyz",
                          type: "Fake Airdrop",
                          ago: "4h ago",
                          reports: 11,
                        },
                        {
                          domain: "ape-vaults-mint.net",
                          type: "NFT Drainer",
                          ago: "26h ago",
                          reports: 4,
                        },
                        {
                          domain: "blur-nft-claim.io",
                          type: "Phishing Clone",
                          ago: "2d ago",
                          reports: 28,
                        },
                      ].map((s) => (
                        <div
                          key={s.domain}
                          className="bg-red-950/20 border border-red-800/30 rounded-xl p-2.5 flex items-start gap-2"
                        >
                          <div className="w-5 h-5 rounded-lg bg-red-900/30 border border-red-800/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Ban className="w-3 h-3 text-red-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-red-300 truncate">
                              {s.domain}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] text-red-400/60">{s.type}</span>
                              <span className="text-[9px] text-gray-600">·</span>
                              <span className="text-[9px] text-gray-600">{s.ago}</span>
                              <span className="text-[9px] text-gray-600">·</span>
                              <span className="text-[9px] text-red-400">{s.reports} reports</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Pick of the Day */}
                  <div className="bg-gradient-to-br from-[#1A1435] to-[#181829] border border-[#6C47FF]/30 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="text-[9.5px] font-black text-[#9F86FF] uppercase tracking-widest">
                        Gorgon AI Pick
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#1A1A2B] border border-[#2B2B43] flex items-center justify-center font-black text-[#9F86FF] text-sm">
                        A
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Aave v3</p>
                        <p className="text-[9px] text-gray-400">Lending · 94/100 trust score</p>
                      </div>
                    </div>
                    <p className="text-[10.5px] text-gray-400 leading-relaxed">
                      Most secure lending protocol for earning yield on idle assets. $12.8B TVL,
                      triple-audited, DAO-governed.
                    </p>
                    <button
                      onClick={() => {
                        setIsHomePage(false);
                        setIsSearchMode(false);
                        navigateTo("app.aave.com");
                      }}
                      className="w-full py-2 bg-[#6C47FF]/20 hover:bg-[#6C47FF]/30 border border-[#6C47FF]/30 text-[#9F86FF] text-[10px] font-bold rounded-lg transition-all"
                    >
                      Open Aave with Trust Verification →
                    </button>
                  </div>

                  {/* Quick search */}
                  <div>
                    <p className="text-[9.5px] font-black text-gray-500 uppercase tracking-widest mb-2">
                      Quick Searches
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "best DEX",
                        "ETH staking",
                        "NFT marketplace",
                        "DeFi lending",
                        "airdrop scams",
                      ].map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            setUrlInput(q);
                            setIsHomePage(false);
                            setIsSearchMode(true);
                            setCurrentQuery(q);
                          }}
                          className="text-[9px] text-gray-300 bg-[#1A1A2B] hover:bg-[#252538] border border-[#2B2B43] px-2 py-1 rounded-full transition-all"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* T4: Community Tab */}
              {activeTabPanel === "community" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-[#181829] border border-[#2B2B43] rounded-xl p-3 space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold text-gray-400">
                      <span>Positive {activeMeta.posSentiment}%</span>
                      <span>Negative {activeMeta.negSentiment}%</span>
                    </div>
                    <div className="h-1.5 rounded-full flex overflow-hidden">
                      <div
                        className="bg-green-500 h-full"
                        style={{ width: `${activeMeta.posSentiment}%` }}
                      ></div>
                      <div
                        className="bg-red-500 h-full"
                        style={{ width: `${activeMeta.negSentiment}%` }}
                      ></div>
                    </div>
                  </div>

                  {!showReportForm ? (
                    <button
                      onClick={() => setShowReportForm(true)}
                      className="w-full py-2 border border-[#2B2B43] hover:border-[#6C47FF] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5" /> Submit Security Warning
                    </button>
                  ) : (
                    <form
                      onSubmit={handleCommunitySubmit}
                      className="bg-[#181829] border border-[#2B2B43] p-3 rounded-xl space-y-3"
                    >
                      <textarea
                        value={newReportText}
                        onChange={(e) => setNewReportText(e.target.value)}
                        placeholder="Write your warning or review..."
                        className="w-full h-16 bg-[#131320] border border-[#222235] rounded-lg p-2 text-xs outline-none text-white focus:border-[#6C47FF] resize-none"
                      ></textarea>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 py-1.5 bg-purple-600 text-white font-bold text-[10.5px] rounded-lg"
                        >
                          Submit
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowReportForm(false)}
                          className="px-2.5 py-1.5 border border-gray-700 text-gray-400 text-[10.5px] rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-3">
                    {reports.map((report, idx) => (
                      <div
                        key={idx}
                        className="bg-[#181829] border border-[#2B2B43] p-3 rounded-xl space-y-1"
                      >
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-bold text-white flex items-center gap-1">
                            <div className="w-3.5 h-3.5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[8px]">
                              0x
                            </div>
                            {report.user}
                          </span>
                          <span className="text-gray-500">{report.date}</span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">{report.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* T5: AI Chat Tab */}
              {activeTabPanel === "ai" && (
                <div className="-m-4 h-[calc(100%+2rem)]" style={{ minHeight: 360 }}>
                  <AiChatPanel
                    currentUrl={activeUrl}
                    currentScore={activeMeta.score}
                    currentSummary={activeMeta.summary}
                    activeModel={activeModel}
                  />
                </div>
              )}

              {/* T6: 0G Network Tab */}
              {activeTabPanel === "0g" && (
                <div className="-m-4 h-[calc(100%+2rem)]" style={{ minHeight: 360 }}>
                  <OgNetworkPanel selectedModel={activeModel} onModelChange={setActiveModel} />
                </div>
              )}
            </div>

            {/* Sidebar Bottom Frame indicators */}
            <div className="p-3 border-t border-[#212133] bg-[#121220] flex items-center justify-between text-[10px] text-gray-500 select-none">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#6C47FF]" />
                <span className="text-[#9F86FF] font-bold">Gorgon.Net</span> · Live Protection
              </span>
              <span>v2.0 · 0G Network</span>
            </div>
          </aside>
        </div>

        {/* ===== 4. NEW WORKSPACE: FULL-SCREEN ISOLATED SANDBOX OVERLAY ===== */}
        {isSandboxOpen && (
          <div className="absolute inset-0 bg-[#07060A] z-45 flex flex-col animate-fade-in">
            {/* Sandbox overlay header */}
            <div className="bg-[#1A0C2F] border-b border-purple-800/50 px-4 py-3 flex items-center justify-between z-50 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(108,71,255,0.4)]">
                  <FlaskConical className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-purple-100 flex items-center gap-2">
                    AEGIS SECURE SANDBOX{" "}
                    <span className="bg-purple-900 text-purple-300 border border-purple-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest">
                      Isolated Workspace
                    </span>
                  </h3>
                  <span className="text-[10px] text-purple-400 block -mt-0.5">
                    Browsing URL:{" "}
                    <span className="underline font-bold text-purple-200">{activeUrl}</span>{" "}
                    (simulating all transaction hooks against virtual chain fork)
                  </span>
                </div>
              </div>

              {/* Close Button / Return to normal browser */}
              <button
                onClick={handleCloseSandbox}
                className="flex items-center gap-1.5 bg-[#2A184D] hover:bg-purple-600 px-4 py-2 border border-purple-800 hover:border-purple-400 text-purple-200 hover:text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98]"
              >
                <X className="w-4 h-4" />
                Exit Sandbox
              </button>
            </div>

            {/* Sandbox main content split */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Left Side: Mock dApp Viewport (Safe Mode Sandbox active) */}
              <div className="flex-1 bg-[#050407] overflow-y-auto p-4 lg:p-6 min-h-[350px] relative border-r border-purple-900/25 flex flex-col justify-center">
                <div className="absolute top-4 left-4 text-[10px] text-purple-400 font-bold uppercase tracking-widest bg-purple-950/40 border border-purple-800/40 px-2.5 py-1 rounded-lg">
                  Isolated Viewport
                </div>
                <div className="w-full max-w-[700px] mx-auto ring-2 ring-purple-600/50 shadow-[0_0_30px_rgba(108,71,255,0.15)] rounded-xl overflow-hidden">
                  <MockDApps
                    currentUrl={activeUrl}
                    onActionTrigger={handleActionTrigger}
                    walletBalance={wallet}
                    safeMode={true}
                  />
                </div>
              </div>

              {/* Right Side: Sandbox Secure Tracing Panel */}
              <aside className="w-full lg:w-[360px] bg-[#0E0B14] flex flex-col h-[400px] lg:h-auto overflow-hidden">
                <div className="p-4 border-b border-purple-950/40 bg-[#140F20]">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">
                      Sandbox Audit Counters
                    </span>
                    <button
                      onClick={() => setIsDebriefOpen(true)}
                      className="text-[10px] text-[#A88CFF] hover:underline font-bold"
                    >
                      Debrief Report
                    </button>
                  </div>

                  {/* Sim indicators */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#181125] border border-purple-900/40 rounded-xl p-2 text-center">
                      <span className="text-lg font-black text-white">{simActionsCount}</span>
                      <span className="text-[9px] text-purple-300 block uppercase mt-0.5">
                        Actions
                      </span>
                    </div>
                    <div className="bg-[#181125] border border-purple-900/40 rounded-xl p-2 text-center">
                      <span className="text-lg font-black text-amber-500">{hiddenCallsCount}</span>
                      <span className="text-[9px] text-purple-300 block uppercase mt-0.5">
                        Hidden Calls
                      </span>
                    </div>
                    <div className="bg-[#181125] border border-purple-900/40 rounded-xl p-2 text-center">
                      <span className="text-lg font-black text-red-500">{flagsCount}</span>
                      <span className="text-[9px] text-purple-300 block uppercase mt-0.5">
                        Flags
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sandbox Event Timelines */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="bg-[#181125] border border-purple-900/30 rounded-xl p-3.5">
                    <span className="text-[9.5px] font-bold text-purple-300 uppercase tracking-widest block mb-3">
                      Sandbox trace log
                    </span>
                    <div className="relative border-l border-purple-900/40 ml-2 pl-4 space-y-4">
                      {timeline.map((event, idx) => (
                        <div key={idx} className="relative text-xs">
                          <div
                            className={`absolute w-2 h-2 rounded-full -left-[20px] top-1 border border-[#0E0B14] ${
                              event.risk === "high"
                                ? "bg-red-500"
                                : event.risk === "med"
                                  ? "bg-amber-500"
                                  : "bg-green-500"
                            }`}
                          ></div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{event.action}</span>
                            <span className="text-[9.5px] text-gray-500 font-mono">
                              {event.time}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                            {event.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Virtual Account state */}
                  <div className="bg-[#181125] border border-purple-900/30 rounded-xl p-3.5 space-y-3">
                    <span className="text-[9.5px] font-bold text-purple-300 uppercase tracking-widest block">
                      Virtual Wallet Balance Changes
                    </span>

                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="bg-[#120D1D] border border-purple-950 p-2 rounded-lg">
                        <span className="text-[9px] text-gray-400 block mb-0.5">Virtual ETH</span>
                        <span className="font-bold text-white">{wallet.eth.toFixed(3)} ETH</span>
                      </div>
                      <div className="bg-[#120D1D] border border-purple-950 p-2 rounded-lg">
                        <span className="text-[9px] text-gray-400 block mb-0.5">Virtual USDC</span>
                        <span className="font-bold text-white">
                          ${wallet.usdc.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {wallet.nfts.length > 0 ? (
                      <div className="bg-[#120D1D] p-2 rounded-lg border border-purple-950">
                        <span className="text-[9px] text-gray-400 block mb-1">
                          Virtual NFTs ({wallet.nfts.length})
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {wallet.nfts.map((nft) => (
                            <span
                              key={nft}
                              className="bg-purple-950/60 border border-purple-800/40 text-[#A88CFF] px-1.5 py-0.5 rounded text-[9px] font-semibold"
                            >
                              {nft}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-950/20 border border-red-900/30 p-2.5 rounded-lg text-center text-[10px] text-red-400">
                        ⚠️ Collectibles have been drained in sandbox!
                      </div>
                    )}
                  </div>
                </div>

                {/* Return button footer */}
                <div className="p-4 border-t border-purple-950/40 bg-[#140F20]">
                  <button
                    onClick={handleCloseSandbox}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98]"
                  >
                    Close Sandbox & Exit Isolation
                  </button>
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>

      {/* ===== Built-in SECURE SIGNATURE MODAL ===== */}
      <SimulatedWalletDialog
        isOpen={isSignModalOpen}
        tx={pendingTx}
        onClose={() => {
          setIsSignModalOpen(false);
          setPendingTx(null);
        }}
        walletBalance={wallet}
        onConfirmApprove={handleConfirmApprove}
      />

      {/* ===== SANDBOX DEBRIEF REPORT MODAL ===== */}
      {isDebriefOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#12121A] border border-[#2B2B3D] text-white w-full max-w-[480px] rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans max-h-[80vh]">
            <div className="flex items-center justify-between border-b border-[#2A2B3A] p-4 bg-[#181824]">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-purple-300">
                <FlaskConical className="w-4 h-4" /> Isolated Sandbox Debrief Report
              </h3>
              <button
                onClick={() => setIsDebriefOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#2A2B3A]/30 hover:bg-[#2A2B3A]/60 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {activeUrl === "app.uniswap.org" ? (
                <div className="bg-[#0E2916] border border-[#1D5A2E] rounded-xl p-4 flex gap-3 text-green-200">
                  <ShieldCheck className="w-5.5 h-5.5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block uppercase">
                      Sandbox Analysis: Clean Action
                    </span>
                    <p className="mt-1 leading-relaxed">
                      Standard swap execution verified. No transaction re-routes, code injections,
                      or operator authorization abuses detected. The smart contract router is
                      verified.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#290F11] border border-[#5A1D20] rounded-xl p-4 flex gap-3 text-red-200">
                  <ShieldAlert className="w-5.5 h-5.5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block uppercase">
                      Sandbox Analysis: Attack Blocked
                    </span>
                    <p className="mt-1 leading-relaxed">
                      Phishing drainer attempt intercepted! The simulated transactions attempted
                      collection authorizations (`setApprovalForAll`) hidden behind swap/claim
                      prompts.
                    </p>
                  </div>
                </div>
              )}

              {/* Node statistics sync indicators */}
              <div className="bg-[#191928] border border-[#2B2B43] p-3 rounded-xl flex items-center justify-between">
                <span className="font-bold text-purple-300">0G Node Security Sync</span>
                <span className="text-[10px] text-gray-400">Node Sync Complete ✓</span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#181829] border border-[#2B2B43] p-3 rounded-xl">
                  <span className="text-xl font-black text-white">{simActionsCount}</span>
                  <span className="text-[9px] text-gray-400 block uppercase mt-0.5">Actions</span>
                </div>
                <div className="bg-[#181829] border border-[#2B2B43] p-3 rounded-xl">
                  <span className="text-xl font-black text-amber-500">{hiddenCallsCount}</span>
                  <span className="text-[9px] text-gray-400 block uppercase mt-0.5">
                    Hidden Calls
                  </span>
                </div>
                <div className="bg-[#181829] border border-[#2B2B43] p-3 rounded-xl">
                  <span className="text-xl font-black text-red-500">{flagsCount}</span>
                  <span className="text-[9px] text-gray-400 block uppercase mt-0.5">Flags</span>
                </div>
              </div>

              {/* Timeline list */}
              <div>
                <span className="text-[10px] font-bold text-[#9F86FF] uppercase tracking-wide block mb-3">
                  Execution Traces
                </span>
                <div className="relative border-l border-[#2B2B43] ml-2 pl-4 space-y-3">
                  {timeline.map((event, idx) => (
                    <div key={idx} className="relative text-xs">
                      <div
                        className={`absolute w-2 h-2 rounded-full -left-[20px] top-1 border border-[#11111C] ${
                          event.risk === "high"
                            ? "bg-red-500"
                            : event.risk === "med"
                              ? "bg-amber-500"
                              : "bg-green-500"
                        }`}
                      ></div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{event.action}</span>
                        <span className="text-[9.5px] text-gray-500 font-mono">{event.time}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                        {event.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal footer actions */}
            <div className="border-t border-[#2A2B3A] p-4 bg-[#14141F] flex flex-col gap-2">
              <button
                onClick={() => {
                  setSafeMode(false);
                  setIsSandboxOpen(false);
                  setIsDebriefOpen(false);
                }}
                disabled={activeUrl.includes("claim") || activeUrl.includes("mint")}
                className={`w-full py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  !(activeUrl.includes("claim") || activeUrl.includes("mint"))
                    ? "bg-[#6C47FF] hover:bg-[#5B39E6] text-white"
                    : "bg-gray-800 text-gray-500 cursor-not-allowed"
                }`}
              >
                Disable Safe Mode & Go Live
              </button>
              {(activeUrl.includes("claim") || activeUrl.includes("mint")) && (
                <span className="text-[10px] text-red-400 text-center block font-medium">
                  ⚠️ Going live is locked. Site contains high risk drain templates.
                </span>
              )}
              <button
                onClick={() => setIsDebriefOpen(false)}
                className="w-full py-2.5 border border-gray-700 text-gray-400 hover:text-white font-bold text-xs rounded-xl transition-all"
              >
                Continue Simulating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

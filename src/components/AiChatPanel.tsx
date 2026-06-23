import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  User,
  ChevronRight,
  Zap,
  WifiOff,
  ExternalLink,
} from "lucide-react";
import { CHAT_MODEL, type OgMessage } from "../lib/og-client";
import { loadSession, saveSession } from "../lib/session";
import { StreamingText } from "./StreamingText";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  timestamp: string;
  provider?: string;
  isFallback?: boolean;
  modelId?: string;
}

interface AiChatPanelProps {
  currentUrl: string;
  currentScore: number;
  currentSummary: string;
}

// ── Static fallback responses (used when API key is not set) ─────────────────
const FALLBACK_RESPONSES: Record<string, string> = {
  safe: "Based on the site's trust score, here's my assessment:\n\n• **Domain age** — Scam sites register days before launching\n• **Contract verification** — Is bytecode published and audited?\n• **Approval patterns** — Does it request `setApprovalForAll`?\n\nAlways verify you're on the exact official URL before connecting.",
  sign: "Before signing any transaction, check:\n\n1. **Function** — What is the contract actually calling?\n2. **Approvals** — Is it requesting unlimited token access?\n3. **Recipient** — Are funds going where you expect?\n\nDanger patterns: `setApprovalForAll`, `permit()` with unknown spender, `transferFrom` to unrecognized address.",
  airdrop: "⚠️ **Most airdrop sites are scams.** Legitimate airdrops:\n\n✅ Announced on official Twitter/Discord\n✅ Use the main protocol domain\n✅ Only prove wallet ownership — NOT unlimited approvals\n\n❌ Never urgently demands action\n❌ Never requests `setApprovalForAll`",
  drainer: "A **wallet drainer** disguises itself as a legitimate dApp. When you 'mint' or 'claim', the contract contains `setApprovalForAll` — granting control of all your NFTs. Within seconds, a bot sweeps your wallet.\n\nGorgon's pre-sign audit detects these patterns before you confirm.",
  gas: "**Gas** is the fee to process transactions on Ethereum. Tips:\n\n• Transact during off-peak hours (weekends, early UTC)\n• Use Layer 2 (Arbitrum, Optimism, Base) — 10-100x cheaper\n• Check gasnow.org for current prices",
  uniswap: "**Uniswap** is the largest DEX — Trust Score: **95/100**\n\n• Uses the audited Universal Router contract\n• $2T+ volume processed with no major exploits\n• Always verify you're on `app.uniswap.org` exactly",
  default: "I'm **Gorgon AI**, your Web3 security assistant.\n\nI can help with:\n• 🔒 Is this site safe to connect?\n• 📋 What does this transaction actually do?\n• ⚠️ Scam and phishing detection\n• 💡 DeFi concepts explained\n\n*Configure your 0G API key in `.env` to enable real AI responses from the 0G Compute Network.*",
};

function matchFallback(input: string): string {
  const q = input.toLowerCase();
  if (q.includes("airdrop") || q.includes("claim") || q.includes("free")) return FALLBACK_RESPONSES.airdrop;
  if (q.includes("drain")) return FALLBACK_RESPONSES.drainer;
  if (q.includes("gas") || q.includes("fee")) return FALLBACK_RESPONSES.gas;
  if (q.includes("sign") || q.includes("approval") || q.includes("approve")) return FALLBACK_RESPONSES.sign;
  if (q.includes("safe") || q.includes("trust") || q.includes("legit")) return FALLBACK_RESPONSES.safe;
  if (q.includes("uniswap")) return FALLBACK_RESPONSES.uniswap;
  return FALLBACK_RESPONSES.default;
}

function formatTime(): string {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

const SUGGESTED_QUESTIONS = [
  "Is this site safe to connect?",
  "What is a wallet drainer?",
  "Explain gas fees",
  "What is setApprovalForAll?",
  "Tell me about Uniswap",
  "How do I spot a scam?",
];

export function AiChatPanel({ currentUrl, currentScore, currentSummary }: AiChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: "ai",
      text: `Hey! I'm **Gorgon AI** — your Web3 security assistant, powered by the **0G Compute Network**.\n\nCurrently monitoring: **${currentUrl}** (Trust Score: ${currentScore}/100)\n\n${currentScore > 80 ? "✅ This site looks safe. Ask me anything!" : currentScore > 40 ? "⚠️ Some risk signals — ask me what I found." : "⛔ HIGH RISK site detected! Do not connect your wallet."}\n\nAsk me anything about Web3 security, DeFi, or transactions.`,
      timestamp: formatTime(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [apiStatus, setApiStatus] = useState<"unknown" | "connected" | "fallback">("unknown");
  const endRef = useRef<HTMLDivElement>(null);

  // Model Selection
  const [activeModel, setActiveModel] = useState<string>(loadSession().selectedModel || CHAT_MODEL);
  
  // Conversation history for the 0G API (maintains context)
  const ogHistory = useRef<OgMessage[]>([]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Reset on URL change
  useEffect(() => {
    ogHistory.current = [];
    setMessages([
      {
        role: "ai",
        text: `Switched to **${currentUrl}** (Trust Score: ${currentScore}/100)\n\n${currentScore > 80 ? "✅ Looks safe! Ask me anything." : currentScore > 40 ? "⚠️ Some risk signals detected." : "⛔ HIGH RISK: DO NOT connect your wallet here."}`,
        timestamp: formatTime(),
      },
    ]);
    setApiStatus("unknown");
  }, [currentUrl]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", text, timestamp: formatTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Add to 0G conversation history
    ogHistory.current.push({ role: "user", content: text });

    const aiMsgId = crypto.randomUUID();
    
    // Check if API key is missing entirely before trying to stream
    const session = loadSession();
    if (!session.apiKeyConfigured) {
      setTimeout(() => {
        const fallbackText = matchFallback(text);
        setApiStatus("fallback");
        setMessages(prev => [
          ...prev,
          {
            id: aiMsgId,
            role: "ai",
            text: fallbackText,
            timestamp: formatTime(),
            isFallback: true,
          },
        ]);
        setIsTyping(false);
      }, 500);
      return;
    }

    try {
      // Create an empty AI message to stream into
      setMessages(prev => [
        ...prev,
        {
          id: aiMsgId,
          role: "ai",
          text: "",
          timestamp: formatTime(),
          provider: "0G Network",
          modelId: activeModel,
        },
      ]);

      const systemPrompt = `You are Gorgon AI, an expert Web3 security assistant embedded in the Gorgon.Net browser.
Currently analyzing: ${currentUrl} (Trust Score: ${currentScore}/100). Keep answers brief and helpful.`;

      const res = await fetch("/api/og/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "system", content: systemPrompt }, ...ogHistory.current],
          model: activeModel,
          stream: true,
          max_tokens: 400
        }),
      });

      if (!res.ok) throw new Error(`API returned ${res.status}`);
      if (!res.body) throw new Error("No response body");

      setApiStatus("connected");
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(line => line.trim() !== "");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(dataStr);
              const content = parsed.choices[0]?.delta?.content || "";
              if (content) {
                fullResponse += content;
                setMessages(prev => prev.map(m => 
                  m.id === aiMsgId ? { ...m, text: fullResponse } : m
                ));
              }
            } catch (e) {
              // Ignore parse errors on partial chunks
            }
          }
        }
      }

      ogHistory.current.push({ role: "assistant", content: fullResponse });
      setIsTyping(false);

    } catch (err) {
      console.error(err);
      setIsTyping(false);
      const fallbackText = matchFallback(text);
      setApiStatus("fallback");
      setMessages(prev => prev.map(m => 
        m.id === aiMsgId ? { ...m, text: `${fallbackText}\n\n*[0G API error — showing cached response]*`, isFallback: true } : m
      ));
    }
  };

  const clearChat = () => {
    ogHistory.current = [];
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "ai",
        text: `Chat cleared. Monitoring: **${currentUrl}**. How can I help?`,
        timestamp: formatTime(),
      },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full">

      {/* Status bar */}
      <div className={`px-3 py-1.5 flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider border-b border-[#212133] ${
        apiStatus === "connected" ? "bg-green-950/30 text-green-400" :
        apiStatus === "fallback" ? "bg-amber-950/30 text-amber-400" :
        "bg-[#10101C] text-gray-500"
      }`}>
        {apiStatus === "connected" ? (
          <>
            <Zap className="w-2.5 h-2.5" />
            <span>0G Compute Network · Live AI</span>
          </>
        ) : apiStatus === "fallback" ? (
          <>
            <WifiOff className="w-2.5 h-2.5" />
            <span>Offline Mode · Add API key to enable live AI</span>
            <a href="https://pc.0g.ai" target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-0.5 text-amber-300 hover:text-amber-100">
              Get key <ExternalLink className="w-2 h-2" />
            </a>
          </>
        ) : (
          <>
            <Sparkles className="w-2.5 h-2.5 animate-pulse" />
            <span>Gorgon AI · 0G Compute Network</span>
          </>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">

        {/* Suggested questions (only at start) */}
        {messages.length === 1 && (
          <div className="space-y-1.5">
            <p className="text-[9.5px] font-bold text-gray-500 uppercase tracking-widest">Suggested</p>
            {SUGGESTED_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="w-full text-left text-[10.5px] text-gray-300 bg-[#181829] hover:bg-[#1E1E35] border border-[#2B2B43] hover:border-[#6C47FF]/50 rounded-lg px-3 py-2 transition-all flex items-center gap-2"
              >
                <ChevronRight className="w-3 h-3 text-[#6C47FF] flex-shrink-0" />
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              msg.role === "ai"
                ? "bg-[#6C47FF]/20 border border-[#6C47FF]/30"
                : "bg-[#1A1A2B] border border-[#2B2B43]"
            }`}>
              {msg.role === "ai"
                ? <Sparkles className="w-3 h-3 text-[#9F86FF]" />
                : <User className="w-3 h-3 text-gray-400" />
              }
            </div>

            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
              msg.role === "ai"
                ? "bg-[#181829] border border-[#2B2B43] text-gray-300"
                : "bg-[#6C47FF]/20 border border-[#6C47FF]/30 text-gray-200"
            }`}>
              {msg.role === "ai" && isTyping && idx === messages.length - 1 && msg.text === "" ? (
                <StreamingText text="..." speed={1} />
              ) : (
                <ReactMarkdown
                  className="prose prose-invert max-w-none text-[11px] prose-p:leading-relaxed prose-headings:text-white prose-a:text-[#9F86FF] prose-strong:text-white prose-strong:font-bold prose-code:text-[#9F86FF] prose-code:bg-[#6C47FF]/10 prose-code:px-1 prose-code:rounded prose-pre:bg-[#10101C] prose-pre:border prose-pre:border-[#2B2B43] prose-ul:list-disc prose-ul:pl-4 prose-ol:list-decimal prose-ol:pl-4"
                >
                  {msg.text}
                </ReactMarkdown>
              )}
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className="text-[9px] text-gray-600">{msg.timestamp}</span>
                {msg.role === "ai" && !msg.isFallback && (
                  <span className="text-[8px] text-green-600 font-semibold">⚡ {msg.modelId || activeModel}</span>
                )}
                {msg.isFallback && (
                  <span className="text-[8px] text-amber-600 font-semibold">📦 Cached</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-[#6C47FF]/20 border border-[#6C47FF]/30 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3 h-3 text-[#9F86FF]" />
            </div>
            <div className="bg-[#181829] border border-[#2B2B43] rounded-xl px-3 py-2 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#9F86FF] animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[#9F86FF] animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[#9F86FF] animate-bounce" style={{ animationDelay: "300ms" }} />
              <span className="ml-2 text-[9px] text-gray-500">0G Router processing...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[#212133] bg-[#10101C]">
        <div className="flex items-end gap-2 bg-[#1A1A2B] border border-[#2B2B43] rounded-xl p-2 focus-within:border-[#6C47FF]/60 transition-all">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Gorgon AI anything about Web3 security..."
            rows={2}
            className="flex-1 bg-transparent text-[11px] text-white placeholder-gray-500 outline-none resize-none leading-relaxed"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className="w-7 h-7 rounded-lg bg-[#6C47FF] hover:bg-[#5B39E6] disabled:bg-[#2B2B43] disabled:text-gray-600 flex items-center justify-center flex-shrink-0 transition-all"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 px-1">
          <button onClick={clearChat} className="text-[9px] text-gray-500 hover:text-white transition-colors uppercase tracking-wider font-bold">
            Clear Chat
          </button>
          <p className="text-[9px] text-gray-600 text-right">
            Powered by 0G Compute Network · {activeModel}
          </p>
        </div>
      </div>
    </div>
  );
}

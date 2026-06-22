import React, { useState } from "react";
import { AlertOctagon, AlertTriangle, ArrowRight, Check, Code, Eye, Info, Shield, ShieldCheck, X } from "lucide-react";

interface SimulatedWalletDialogProps {
  isOpen: boolean;
  tx: {
    title: string;
    plain: string;
    action: string;
    token: string;
    spender: string;
    limit: string;
    fee: string;
    risk: { label: string; cls: string };
    approveDanger: boolean;
    raw: string;
    onApprove: () => void;
  } | null;
  onClose: () => void;
  walletBalance: {
    eth: number;
    usdc: number;
    nfts: string[];
  };
  onConfirmApprove: (updatedBalances: { eth: number; usdc: number; nfts: string[] }) => void;
}

export function SimulatedWalletDialog({
  isOpen,
  tx,
  onClose,
  walletBalance,
  onConfirmApprove,
}: SimulatedWalletDialogProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "raw">("overview");

  if (!isOpen || !tx) return null;

  // Calculate simulated repercussions
  const getRepercussions = () => {
    const after = { ...walletBalance, nfts: [...walletBalance.nfts] };
    let warning = "";
    let severity: "low" | "medium" | "critical" = "low";

    if (tx.action.includes("setApprovalForAll")) {
      // Drains all NFTs in collection
      after.nfts = [];
      warning = "CRITICAL: Approving this transaction grants complete permissions to transfer ALL Bored Ape Yacht Club NFTs out of your wallet. A malicious contract will immediately empty them.";
      severity = "critical";
    } else if (tx.action.includes("exactInputSingle") || tx.action.includes("swap") || tx.title.includes("Swap")) {
      // Simulated Swap: Deduct 1 ETH (or amount in title) and add USDC (or token in title)
      const ethAmount = parseFloat(tx.limit) || 1;
      after.eth = Math.max(0, walletBalance.eth - ethAmount);
      after.usdc = walletBalance.usdc + ethAmount * 3420;
      warning = "Notice: Standard token exchange. 1.00 ETH will be traded for USDC. The recipient contract is the officially deployed Uniswap Router.";
      severity = "low";
    } else if (tx.risk.cls === "crit" || tx.approveDanger) {
      // Default drainer catch-all
      after.eth = 0;
      after.usdc = 0;
      after.nfts = [];
      warning = "CRITICAL WARNING: This interaction matches signature patterns used to wipe wallet contents. All ETH, USDC, and digital collectibles could be drained.";
      severity = "critical";
    } else {
      warning = "Notice: This transaction interacts with an external contract. Confirm you trust the website you are browsing.";
      severity = "medium";
    }

    return { after, warning, severity };
  };

  const { after, warning, severity } = getRepercussions();

  const handleApprove = () => {
    tx.onApprove();
    onConfirmApprove(after);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#12121A] border border-[#2B2B3D] text-white w-full max-w-[460px] rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2A2B3A] p-4 bg-[#181824]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#6C47FF] flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm block">Aegis Guard</span>
              <span className="text-[10px] text-gray-400 block -mt-0.5">Simulation Sandboxed</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#2A2B3A]/30 hover:bg-[#2A2B3A]/60 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Warning Banner */}
        <div
          className={`flex items-start gap-3 p-4 border-b ${
            severity === "critical"
              ? "bg-[#290F11]/80 border-[#5A1D20] text-red-200"
              : severity === "medium"
              ? "bg-[#291B0F]/80 border-[#5A3E1D] text-amber-200"
              : "bg-[#0F2916]/80 border-[#1D5A2E] text-green-200"
          }`}
        >
          {severity === "critical" ? (
            <AlertOctagon className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          ) : severity === "medium" ? (
            <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
          ) : (
            <ShieldCheck className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <span className="font-bold text-xs uppercase tracking-wider block">
              {severity === "critical"
                ? "CRITICAL ATTACK DETECTED"
                : severity === "medium"
                ? "SECURITY NOTICE"
                : "VERDICT: SAFE ACTION"}
            </span>
            <p className="text-xs mt-1 leading-relaxed">{warning}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#2A2B3A] bg-[#14141F]">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === "overview"
                ? "border-[#6C47FF] text-[#9F86FF]"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Repercussions
          </button>
          <button
            onClick={() => setActiveTab("raw")}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === "raw"
                ? "border-[#6C47FF] text-[#9F86FF]"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Code className="w-3.5 h-3.5" /> Raw Data
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "overview" ? (
            <>
              {/* Request Info card */}
              <div className="bg-[#181824] border border-[#2B2B3D] rounded-xl p-3.5">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                  Requested Signature
                </span>
                <span className="text-sm font-bold text-white block">{tx.title}</span>
                
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-[#2A2B3A] text-xs">
                  <div>
                    <span className="text-gray-400 block mb-0.5">Contract Action</span>
                    <span className="font-semibold text-white font-mono break-all">{tx.action}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Contract Spender</span>
                    <span className="font-semibold text-white font-mono">{tx.spender}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Target Assets</span>
                    <span className="font-semibold text-white">{tx.token}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Estimated Fee</span>
                    <span className="font-semibold text-white">{tx.fee}</span>
                  </div>
                </div>
              </div>

              {/* Wallet Repercussions simulation */}
              <div>
                <span className="text-[10px] text-[#9F86FF] font-bold uppercase tracking-wider block mb-2">
                  Simulated Balance Changes
                </span>
                
                <div className="bg-[#13131F] border border-[#2B2B3D] rounded-xl overflow-hidden divide-y divide-[#2A2B3A]">
                  {/* ETH balance changes */}
                  <div className="p-3 flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-400 flex items-center gap-1">
                      💎 Virtual ETH
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{walletBalance.eth.toFixed(3)}</span>
                      <ArrowRight className="w-3 h-3 text-gray-500" />
                      <span
                        className={`font-bold ${
                          after.eth < walletBalance.eth
                            ? "text-red-400"
                            : after.eth > walletBalance.eth
                            ? "text-green-400"
                            : "text-white"
                        }`}
                      >
                        {after.eth.toFixed(3)} ETH
                      </span>
                    </div>
                  </div>

                  {/* USDC balance changes */}
                  <div className="p-3 flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-400 flex items-center gap-1">
                      💵 Virtual USDC
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{walletBalance.usdc.toLocaleString()}</span>
                      <ArrowRight className="w-3 h-3 text-gray-500" />
                      <span
                        className={`font-bold ${
                          after.usdc < walletBalance.usdc
                            ? "text-red-400"
                            : after.usdc > walletBalance.usdc
                            ? "text-green-400"
                            : "text-white"
                        }`}
                      >
                        {after.usdc.toLocaleString()} USDC
                      </span>
                    </div>
                  </div>

                  {/* NFT balance changes */}
                  <div className="p-3 flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-400 flex items-center gap-1">
                        🖼 Virtual NFTs
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">{walletBalance.nfts.length}</span>
                        <ArrowRight className="w-3 h-3 text-gray-500" />
                        <span
                          className={`font-bold ${
                            after.nfts.length < walletBalance.nfts.length
                              ? "text-red-400"
                              : "text-white"
                          }`}
                        >
                          {after.nfts.length} Collectibles
                        </span>
                      </div>
                    </div>
                    {walletBalance.nfts.length > 0 && (
                      <div className="bg-[#1C1C28]/80 rounded p-2 text-[10px] text-gray-400 space-y-1">
                        {walletBalance.nfts.map((nft) => {
                          const survives = after.nfts.includes(nft);
                          return (
                            <div key={nft} className="flex justify-between items-center">
                              <span>{nft}</span>
                              <span
                                className={`font-semibold ${
                                  survives ? "text-green-500" : "text-red-500"
                                }`}
                              >
                                {survives ? "Retained" : "LOST / TRANSFERRED"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-[#0A0A0F] border border-[#2B2B3D] rounded-xl p-3 font-mono text-[11px] text-gray-300 overflow-x-auto whitespace-pre leading-relaxed select-all">
              {tx.raw}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-[#2A2B3A] p-4 bg-[#14141F] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-xs font-bold rounded-xl border border-[#2A2B3A] bg-[#12121A] text-gray-300 hover:bg-[#2A2B3A] hover:text-white transition-all active:scale-[0.98]"
          >
            Reject Request
          </button>
          
          <button
            onClick={handleApprove}
            className={`flex-1 py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
              tx.approveDanger
                ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_4px_15px_rgba(220,38,38,0.3)]"
                : "bg-green-600 hover:bg-green-500 text-white shadow-[0_4px_15px_rgba(22,163,74,0.3)]"
            }`}
          >
            <Check className="w-4 h-4" />
            {tx.approveDanger ? "Approve Dangerously" : "Confirm Simulated"}
          </button>
        </div>
      </div>
    </div>
  );
}

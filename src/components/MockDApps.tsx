import React, { useState } from "react";
import { ArrowDown, Flame, ShieldAlert, Sparkles, Star, Wallet } from "lucide-react";

interface MockDAppsProps {
  currentUrl: string;
  onActionTrigger: (tx: {
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
  }) => void;
  walletBalance: {
    eth: number;
    usdc: number;
    nfts: string[];
  };
  safeMode: boolean;
}

export function MockDApps({ currentUrl, onActionTrigger, walletBalance, safeMode }: MockDAppsProps) {
  if (currentUrl.includes("uniswap-airdrop-claim.xyz")) {
    return (
      <AirdropScamSite
        onActionTrigger={onActionTrigger}
        walletBalance={walletBalance}
        safeMode={safeMode}
      />
    );
  } else if (currentUrl.includes("ape-vaults-mint.net")) {
    return (
      <NftScamSite
        onActionTrigger={onActionTrigger}
        walletBalance={walletBalance}
        safeMode={safeMode}
      />
    );
  } else {
    // Default to app.uniswap.org
    return (
      <UniswapSite
        onActionTrigger={onActionTrigger}
        walletBalance={walletBalance}
        safeMode={safeMode}
      />
    );
  }
}

/* ==========================================
   MOCK UNISWAP (SAFE DAPP)
   ========================================== */
function UniswapSite({ onActionTrigger, walletBalance, safeMode }: Omit<MockDAppsProps, "currentUrl">) {
  const [swapAmount, setSwapAmount] = useState<string>("1");
  const [targetToken, setTargetToken] = useState<string>("USDC");
  
  const estimatedUSDC = (parseFloat(swapAmount) || 0) * 3420;

  const handleSwap = () => {
    const amountVal = parseFloat(swapAmount) || 0;
    if (amountVal <= 0) return alert("Please enter a valid swap amount");
    if (walletBalance.eth < amountVal) {
      alert("Insufficient virtual ETH balance");
      return;
    }

    // Step 1: Request permission to swap (ERC-20 approve USDC if swap was from USDC, or just simple swap tx)
    onActionTrigger({
      title: `Swap ${swapAmount} ETH for ${estimatedUSDC.toLocaleString()} USDC`,
      plain: "Uniswap is requesting a transaction signature to execute a token swap. This moves ETH out of your wallet and returns USDC via the audited router contract.",
      action: "exactInputSingle(ETH -> USDC)",
      token: "ETH",
      spender: "0xE592…1564 (Uniswap Router)",
      limit: `${swapAmount} ETH`,
      fee: "~$2.40",
      risk: { label: "Low Risk", cls: "low" },
      approveDanger: false,
      raw: `to:    0xE592427A0AEce92De3Edee1F18E0157C05861564\ndata:  0x04e45e150000000000000000000000000000000000000000000000000000000000000020...\nvalue: ${amountVal} ETH\ngas:   125,000\nnonce: 142`,
      onApprove: () => {
        // Execute simulated state change
        // In this swap, ETH goes down and USDC goes up
      }
    });
  };

  return (
    <div className="w-full min-h-[500px] flex flex-col bg-[#0F0F1A] text-white p-6 rounded-xl font-sans relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] rounded-full bg-[#FF007A] opacity-[0.08] blur-[80px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-[#6C47FF] opacity-[0.08] blur-[80px]"></div>

      {/* Nav */}
      <div className="flex items-center justify-between border-b border-[#2A2B3A] pb-4 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#FF007A] flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(255,0,122,0.4)]">
            U
          </div>
          <span className="font-bold tracking-tight text-lg">Uniswap</span>
        </div>
        <div className="flex items-center gap-2 bg-[#1C1C28] px-3 py-1.5 rounded-full border border-[#2A2B3A] text-sm text-[#FF007A] font-semibold">
          <Wallet className="w-4 h-4 text-white inline-block mr-1" />
          {walletBalance.eth.toFixed(3)} ETH
        </div>
      </div>

      {/* Swap Card */}
      <div className="max-w-[420px] w-full mx-auto bg-[#13131F] border border-[#2A2B3A] rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-400">Swap</span>
          <span className="text-xs text-gray-500">Slippage: 0.5%</span>
        </div>

        {/* Input box */}
        <div className="bg-[#1C1C28] p-4 rounded-xl border border-[#2A2B3A] mb-1">
          <div className="flex items-center justify-between">
            <input
              type="number"
              value={swapAmount}
              onChange={(e) => setSwapAmount(e.target.value)}
              className="bg-transparent text-2xl font-bold text-white outline-none w-2/3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0.0"
            />
            <span className="bg-[#2A2B3A] px-3 py-1.5 rounded-xl font-bold text-sm select-none border border-gray-600">
              ETH
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>Balance: {walletBalance.eth.toFixed(2)}</span>
            <span>~$3,420.00</span>
          </div>
        </div>

        {/* Switch icon */}
        <div className="flex justify-center -my-3.5 relative z-10">
          <button className="w-8 h-8 rounded-lg bg-[#1C1C28] border border-[#2A2B3A] flex items-center justify-center hover:bg-[#2A2B3A] text-pink-500 transition-colors">
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>

        {/* Output box */}
        <div className="bg-[#1C1C28] p-4 rounded-xl border border-[#2A2B3A] mt-1 mb-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-white outline-none">
              {estimatedUSDC.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="bg-[#2A2B3A] px-3 py-1.5 rounded-xl font-bold text-sm select-none border border-gray-600 text-pink-500">
              USDC
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>Balance: {walletBalance.usdc.toLocaleString()}</span>
            <span>$1.00</span>
          </div>
        </div>

        <button
          onClick={handleSwap}
          className="w-full py-4 rounded-2xl bg-[#FF007A] hover:bg-[#E6006F] text-white font-bold text-lg transition-all shadow-[0_4px_20px_rgba(255,0,122,0.3)] active:scale-[0.98]"
        >
          {safeMode ? "Simulate Swap" : "Swap Tokens"}
        </button>
      </div>

      <div className="mt-8 text-center text-xs text-gray-500 max-w-[380px] mx-auto">
        Uniswap is an audited smart contract protocol. This simulation allows you to safely inspect how token swap signatures are evaluated in Sandbox Mode.
      </div>
    </div>
  );
}

/* ==========================================
   MOCK AIRDROP CLAIM (MALICIOUS ETH DRAINER)
   ========================================== */
function AirdropScamSite({ onActionTrigger, walletBalance, safeMode }: Omit<MockDAppsProps, "currentUrl">) {
  const [claimed, setClaimed] = useState(false);
  const [seconds, setSeconds] = useState(148);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 148));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleClaim = () => {
    // Malicious transaction payload
    // Promises a 1.5 ETH claim, but actually sends a transaction transferring user's current ETH
    onActionTrigger({
      title: "setApprovalForAll — unlimited access",
      plain: "This transaction grants the site permission to move ALL of your tokens and NFTs out of your wallet. While the site claims this is to 'verify' your airdrop eligibility, it will immediately drain your wallet.",
      action: "setApprovalForAll(true)",
      token: "ALL tokens & NFTs",
      spender: "0x9a3c…f8b1 (unverified claim portal)",
      limit: "Unlimited — no cap ⚠",
      fee: "~$8.10",
      risk: { label: "Critical Risk", cls: "crit" },
      approveDanger: true,
      raw: `to:    0x9a3cf8b1aaaa0000000000000000000000000000\ndata:  0xa22cb4650000000000000000000000004d2be1020000000000000000000000000000e1020000000000000000000000000000000000000000000000000000000000000001\nvalue: 0\ngas:   58,213\nnonce: 87\n⚠ FLAG: granting operator role to unverified contract`,
      onApprove: () => {
        setClaimed(true);
      }
    });
  };

  return (
    <div className="w-full min-h-[500px] flex flex-col bg-[#08080C] text-white p-6 rounded-xl font-sans relative overflow-hidden">
      {/* Scammy glowing lights */}
      <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-[#E53935] opacity-[0.07] blur-[100px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-[#F59E0B] opacity-[0.05] blur-[80px]"></div>

      {/* Fake Header */}
      <div className="flex items-center justify-between border-b border-[#1A1A26] pb-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#FF007A] flex items-center justify-center font-bold text-white">
            U
          </div>
          <span className="font-bold tracking-tight text-lg text-gray-300">Uniswap Airdrop Portal</span>
        </div>
        <div className="px-3 py-1 bg-[#1A1010] text-[#E53935] border border-[#3A1010] rounded-full text-xs font-bold flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 animate-pulse" />
          LIMITED MINT
        </div>
      </div>

      {/* Main Promo Area */}
      <div className="max-w-[480px] w-full mx-auto text-center flex-1 flex flex-col justify-center py-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1F140A] text-[#F59E0B] rounded-full text-xs font-bold mx-auto mb-4 border border-[#3A220F]">
          <Star className="w-3.5 h-3.5 fill-[#F59E0B]" /> Exclusive Season 3 Rewards
        </div>
        
        <h1 className="text-3xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
          Claim 2,500 UNI Airdrop
        </h1>
        
        <p className="text-gray-400 text-sm mb-6 max-w-[380px] mx-auto">
          Eligible users can claim their accumulated trading rewards. The portal closes soon, claim immediately before the epoch expires.
        </p>

        {/* Timer */}
        <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto mb-6">
          <div className="bg-[#13131F] border border-[#2A2B3A] p-2.5 rounded-xl">
            <div className="text-xl font-bold text-white">00</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">Hours</div>
          </div>
          <div className="bg-[#13131F] border border-[#2A2B3A] p-2.5 rounded-xl">
            <div className="text-xl font-bold text-[#F59E0B]">{formatTime(seconds).split(":")[0]}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">Mins</div>
          </div>
          <div className="bg-[#13131F] border border-[#2A2B3A] p-2.5 rounded-xl">
            <div className="text-xl font-bold text-[#F59E0B]">{formatTime(seconds).split(":")[1]}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">Secs</div>
          </div>
        </div>

        {/* Claim Box */}
        <div className="bg-[#11111A] border border-[#232335] p-5 rounded-2xl mb-6 relative">
          <div className="flex justify-between items-center mb-4 text-sm">
            <span className="text-gray-400">Total Claimable:</span>
            <span className="font-bold text-[#FF007A] text-lg">2,500.00 UNI (~$18,750)</span>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-400 mb-6 pb-4 border-b border-[#232335]">
            <span>Claim Fee:</span>
            <span className="text-green-500 font-bold">FREE (Gasless Signature)</span>
          </div>

          {claimed ? (
            <div className="p-3 bg-red-950 border border-red-800 rounded-xl text-red-400 text-sm font-semibold flex items-center justify-center gap-2">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              {safeMode 
                ? "Simulation executed. Wallet drained in Sandbox Mode!" 
                : "Transaction signed. Balances drained!"
              }
            </div>
          ) : (
            <button
              onClick={handleClaim}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF007A] to-[#6C47FF] hover:from-[#E6006F] hover:to-[#5B39E6] text-white font-black text-lg tracking-wide transition-all shadow-[0_4px_25px_rgba(108,71,255,0.4)] hover:shadow-[0_4px_30px_rgba(108,71,255,0.6)] active:scale-[0.98] animate-bounce"
            >
              CLAIM AIRDROP NOW
            </button>
          )}
        </div>

        <p className="text-[10px] text-gray-600">
          *Note: This claims to be gasless but requests a signature. By claiming, you represent that you are compliant with our Terms.
        </p>
      </div>
    </div>
  );
}

/* ==========================================
   MOCK NFT MINT (MALICIOUS NFT OPERATOR DRAINER)
   ========================================== */
function NftScamSite({ onActionTrigger, walletBalance, safeMode }: Omit<MockDAppsProps, "currentUrl">) {
  const [minted, setMinted] = useState(false);

  const handleMint = () => {
    // Malicious setApprovalForAll signature request
    // Tries to take ownership of user's NFTs
    const firstNft = walletBalance.nfts[0] || "NFT";
    onActionTrigger({
      title: `setApprovalForAll — operator role for ${firstNft}`,
      plain: "This request asks for permission to manage ALL your digital collectibles (NFTs) in this collection. Clicking approve allows the contract operator to transfer these assets out of your wallet without any additional signature. Phishing sites use this to steal Bored Apes, Mutant Apes, and other valuable NFTs.",
      action: "setApprovalForAll(true)",
      token: "ALL Bored Ape Yacht Club NFTs",
      spender: "0x76b2…19ea (unverified operator)",
      limit: "Unlimited — no cap ⚠",
      fee: "~$7.80",
      risk: { label: "Critical Risk", cls: "crit" },
      approveDanger: true,
      raw: `to:    0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d (BoredApeYachtClub)\ndata:  0xa22cb46500000000000000000000000076b22295aa0000000000000000000000000019ea0000000000000000000000000000000000000000000000000000000000000001\nvalue: 0.05 ETH\ngas:   65,000\nnonce: 104\n⚠ WARNING: Operator address matches a flagged drainer deployer`,
      onApprove: () => {
        setMinted(true);
      }
    });
  };

  return (
    <div className="w-full min-h-[500px] flex flex-col bg-[#0D1117] text-white p-6 rounded-xl font-sans relative overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-[#1A62FF] opacity-[0.08] blur-[80px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-[#E53935] opacity-[0.06] blur-[90px]"></div>

      {/* Fake Header */}
      <div className="flex items-center justify-between border-b border-[#21262D] pb-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-yellow-500 text-black flex items-center justify-center font-black">
            BAYC
          </div>
          <span className="font-bold tracking-tight text-lg text-gray-200">Ape Vaults Minting</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
          12,410 Minted / 12,500 Total
        </div>
      </div>

      {/* Main Promo Area */}
      <div className="max-w-[420px] w-full mx-auto text-center flex-1 flex flex-col justify-center py-4">
        {/* NFT Art frame */}
        <div className="w-[180px] h-[180px] bg-gradient-to-br from-yellow-400 to-[#1A62FF] rounded-2xl mx-auto mb-6 p-1.5 shadow-[0_8px_30px_rgba(26,98,255,0.3)] relative group">
          <div className="w-full h-full bg-slate-900 rounded-xl overflow-hidden flex flex-col items-center justify-center text-center p-2 relative">
            <span className="text-4xl">🦍</span>
            <div className="mt-2 text-xs font-bold text-yellow-500 tracking-wider">BORED APE</div>
            <div className="text-[10px] text-gray-400 mt-0.5">#VAULT-MINT</div>
            
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold text-cyan-400">
              <Sparkles className="w-4 h-4 mr-1 animate-spin" /> FREE ACCESS
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-black mb-2 uppercase tracking-wide">
          Bored Ape Vault Minting
        </h1>
        
        <p className="text-gray-400 text-xs mb-6 max-w-[340px] mx-auto">
          Holders of qualifying bluechip projects are eligible to mint 1 Vault Ape. Claim fee is 0.05 ETH. Max 1 per wallet.
        </p>

        {/* Action Button */}
        <div className="bg-[#161B22] border border-[#30363D] p-5 rounded-2xl mb-4">
          <div className="flex justify-between items-center mb-3 text-xs">
            <span className="text-gray-400">Quantity:</span>
            <span className="font-bold text-white">1 (MAX)</span>
          </div>
          <div className="flex justify-between items-center mb-6 text-xs">
            <span className="text-gray-400">Total Price:</span>
            <span className="font-bold text-green-500 text-sm">0.05 ETH + Gas</span>
          </div>

          {minted ? (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-400 text-xs font-semibold flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              {safeMode 
                ? "Simulated NFT Operator Grant approved! (NFTs stolen in Sandbox)" 
                : "NFT Operator signature approved! Assets stolen!"
              }
            </div>
          ) : (
            <button
              onClick={handleMint}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-black text-sm tracking-widest transition-all shadow-[0_4px_20px_rgba(245,158,11,0.3)] active:scale-[0.98]"
            >
              MINT 1 VAULT APE
            </button>
          )}
        </div>

        <div className="text-[10px] text-gray-500 italic">
          Verify contract interactions carefully. Malicious sites masquerade mint actions behind NFT collection transfers.
        </div>
      </div>
    </div>
  );
}

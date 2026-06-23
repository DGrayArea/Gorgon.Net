# Gorgon.Net 🛡️ — AI Web3 Browser Secured by 0G

Gorgon.Net is an AI-powered Web3 Search Engine and Browser designed to protect users from malicious decentralized applications, phishing, and smart contract exploits. By deeply integrating the **0G Compute Network**, Gorgon AI acts as a protective layer between your wallet and the wild west of Web3.

![Gorgon.Net Overview](/public/favicon.svg)

## 🏆 Bounty Submission Focus: 0G Integration

This project was built to showcase the power of the **0G Compute Network (Router API)**. The application connects to 0G's decentralized inference endpoints to perform the following core tasks:

1. **Pre-Sign Smart Contract Auditing**: When a user attempts to sign a transaction (e.g., connecting a wallet or minting an NFT), Gorgon intercepts the request. The bytecode and transaction parameters are sent to `deepseek-v4-flash` via the 0G Network to instantly audit the contract for drainer patterns (like hidden `setApprovalForAll` requests) *before* the user signs.
2. **AI Web3 Search Summaries**: Search queries execute a blazing fast inference call to `minimax-m3` on the 0G network, synthesizing live, structured Web3 knowledge without relying on centralized intermediaries.
3. **Decentralized Chat Assistant**: A persistent AI companion that maintains Web3 security context using 0G's low-latency streaming endpoints.

## 🚀 Features

- **Real-Time Threat Detection**: Contextual security rings (Red, Amber, Green) driven by 0G AI analysis.
- **Unified Omnibox**: A single input for URL navigation, AI queries, and natural language search.
- **Isolated Sandboxing**: A built-in feature to open unverified URLs in an isolated "safe mode" to prevent wallet hooking.
- **Decentralized Analytics**: Real-time visualization of 0G Graph Nodes and network latency.
- **Session Persistence**: Localized history, tracking, and customized AI models selection.

## 🛠️ Technology Stack

- **Frontend**: Next.js App Router, React 19, TypeScript
- **Styling**: Tailwind CSS v4 (@tailwindcss/postcss)
- **AI Network**: 0G Compute Network (Router API)
- **Icons**: Lucide React
- **Notifications**: Sonner

## ⚡ Quickstart

To run Gorgon.Net locally and test the 0G Network integrations:

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/gorgon-net.git
cd gorgon-net
npm install
```

### 2. Configure 0G Compute Network
You will need a 0G Router API key to enable live AI audits and search summaries.
1. Get a key from the [0G Developer Console](https://pc.0g.ai)
2. Create a `.env` file in the root directory
3. Add your key:
```env
VITE_0G_API_KEY=sk-your-0g-api-key-here
```

### 3. Run the Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to experience the safe Web3 browser.

## 🎥 Testing the Flow (Demo Video Requirement)

As part of the bounty submission, a **Demo Video** is required. You can record a walkthrough demonstrating the following core paths:

1. **Search**: Type `free mint` or `airdrop` in the Omnibox. See how Gorgon AI detects a high-risk query and uses the 0G network to summarize the risks.
2. **Navigate**: Click on a known safe dApp (e.g., Uniswap) to see a Green trust score.
3. **Audit**: Attempt to interact with a high-risk sandbox site. Watch the **Pre-Sign AI Audit** intercept the signature request, analyze the bytecode via 0G compute, and block the drainer attempt.
4. **Chat**: Open the "Ask AI" tab to interact with the streaming 0G chatbot for Web3 advice.
5. **Model Switcher**: Open the 0G Network tab and switch inference models dynamically.

## 🛣️ Future Roadmap

**Gorgon Mobile (React Native)**: Web3 security is paramount on mobile devices where users frequently connect wallets on the go. The next evolution of Gorgon.Net is a native iOS and Android mobile browser built with React Native. This will bring our 0G-powered Pre-Sign Audits and decentralized threat detection directly to the mobile ecosystem, allowing users to browse dApps safely on their phones with the exact same AI guardrails.

## 📄 License
MIT License

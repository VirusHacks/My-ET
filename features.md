# AI-Native Intelligence: Agents, Models, & Tools 🧠

This document provides a deep technical breakdown of the **agentic framework**, the **model orchestration**, and the **tool integrations** that power the My ET News OS.

---

## 🛠️ 1. The Core Model Stack
We utilize a **Hybrid-Model Architecture** to balance reasoning depth, multimodal capability, and vernacular fidelity.

- **Primary Orchestrator (Reasoning)**: `gpt-4o-mini`. Handles the high-stakes logic for **Bull/Bear Splitter**, **Story Arc**, and **Chain-of-Thought** analysis.
- **Multimodal Specialist (Vision)**: `gemini-1.5-pro`. Powers the **Truth Engine** by analyzing WhatsApp screenshots, X (Twitter) screenshots, and OCR of financial documents for fact-checking.
- **Vernacular High-Fidelity Adapter (Audio)**: `sarvam-ai-tts`. Provides the "cultural layer" for **6+ Indian languages**, ensuring financial terms aren't just translated—but explained with local context.

---

## 🤖 2. The Agentic Framework
Our features aren't just static prompts; they are **Specialized Agents** with specific roles and tools.

### A. The "Adversarial" Bull/Bear Agent
- **Logic:** Follows a **Dual-Agent Dialogue** pattern.
  - **Agent 1 (Optimist):** Forced to find 3 growth drivers.
  - **Agent 2 (Pessimist):** Forced to find 3 systemic risks.
- **Orchestration:** A final **Synthesizer Agent** takes both analytical payloads and matches them against the **User Persona** (e.g., *Founder vs. Investor*) to provide a personalized verdict.

### B. The "Temporal" Story Arc Agent
- **Logic:** Uses **Recursive Extraction** to map an article's narrative into past, present, and future.
- **Tools:** Uses **Tavily Search** to cross-reference historical archives and predict "Next-to-Watch" triggers based on previous market patterns.

---

## 🎨 3. The AI Studio: Agentic Toolset
Every article acts as a base for nine specialized AI agents that "operate" on the information to create actionable intelligence.

| Tool | Agent Capability | Deliverable |
|---|---|---|
| **Executive Brief** | **Sector Analyst Agent** | A compressed 30-second brief tailored to your persona (Founder, Student, etc.). |
| **Bull vs Bear** | **Adversarial Agents** | 3 bullish growth signals and 3 bearish risk factors with an Orchestrator verdict. |
| **Story Arc** | **Temporal Reasoning Agent** | An interactive timeline linking the story's history to future "Next-to-Watch" triggers. |
| **Context Engine** | **Glossary Agent** | Real-time extraction of 5-8 key technical terms with inline HoverCard definitions. |
| **3D Flashcards** | **Pedaogogy Agent** | Tactile flip-cards for mastering complex financial concepts (UPSC/MBA ready). |
| **Contrarian View** | **Red-Team Agent** | A "Devil's Advocate" analysis that attacks the mainstream narrative to find hidden risks. |
| **Podcast Script** | **Creative Dialogue Agent** | A 2-person vernacular-ready script with culturally adapted financial analogies. |
| **Video Brief** | **Visual Scenarist Agent** | A vertical video script with narration cues and visual B-roll framing. |
| **Impact Score** | **Market Prediction Agent** | A numerical impact score validated by **Live 1-Day Stock Sparklines**. |

---

## 🛡️ 4. The Truth Engine (Misinformation Detection)
**The Problem:** Financial "fake news" on social media leads to massive wealth destruction.
- **Agent Role:** **Verified Fact-Checker Agent**.
- **The Workflow:**
  1. **Ingestion:** User uploads a screenshot or claim text.
  2. **Analysis:** **Gemini 1.5 Pro Vision** extracts the claim and sentiment.
  3. **Verification:** The agent uses **Tavily** to perform an "Authority Search" across ET verified archives and SEBI/RBI filings.
  4. **Verdict:** Outputs a "Fact vs. Fiction" score (0-100) with clickable citations.

---

## 🛰️ 5. AI-Based Custom News Dashboard
**The Problem:** The standard home page is dead; users need an intelligent "Command Center."
- **The "Daily Digest" Agent:** Every morning, this agent scans the **Market Pulse** and **Watchlist** to create a 3-bullet "Strategic Briefing" before the user even opens an article.
- **Market Pulse Ticker (Tool Integration):**
  - **The Tool:** **Yahoo Finance Real-Time API**.
  - **The Logic:** Fetches `regularMarketPrice` and `regularMarketChangePercent` for Nifty 50, Sensex, and individual watchlist stocks.
  - **The UI:** Dynamic SVG sparklines generated via **Recharts**, color-coded by performance.

---

## 🛠️ 6. Agentic Tools & Logic Breakdown
Our agents are "tool-enabled" (Function Calling), allowing them to interact with live data and external verification layers.

### 📈 ytfinance (Yahoo Finance API)
Used by the Dashboard and Impact Agents to bridge the gap between AI text and market reality.
- **Capabilities:**
  - **Live Quotes:** Real-time retrieval of `regularMarketPrice` and `regularMarketChange`.
  - **Historical Charts:** Fetching 1-day 5-minute interval data points for intraday movements.
  - **Dynamic Sparklines:** Mapping arrays of pricing data into SVG-based Recharts for visual performance overviews.
- **Used In:** Market Pulse Ticker, Affected Stock Cards (Impact Tool), Watchlist Performance.

### 🔍 Fact Check (Tavily Search)
The primary search-as-a-service tool for the Truth Engine and Story Arc agents to ensure high-authority verification.
- **Capabilities:**
  - **Contextual Search:** Finding news articles matching specific claims with high relevance scores.
  - **Archive Retrieval:** Cross-referencing current news against ET's historical reporting database.
  - **Source Scoring:** Filtering results by domain authority (e.g., SEBI, RBI, Ministry of Finance) to prevent circular misinformation.
- **Used In:** Truth Engine (Fact Checker), News Navigator (Article Synthesis), Story Arc Timeline.

### 🎙️ Sarvam AI (Regional Intelligence)
Acts as the vernacular processing layer for the Multimodal agents.
- **Capabilities:**
  - **Cultural Translation:** Moving beyond word-for-word translation to explain "Finance metaphors" in regional dialects.
  - **High-Fidelity TTS:** Generating premium, neutral-accent audio for 6+ Indian languages.
- **Used In:** Podcast Generator, Vernacular News Reader.

### 💾 NeonDB & SHA-256 Cache
The specialized tool for persistent memory and extreme latency optimization.
- **Capabilities:**
  - **Persona Storage:** Storing user watchlist and sector profiles for agentic personalization.
  - **Deterministic Caching:** Using SHA-256 hashes of `tool_id + query` to skip LLM execution for duplicate requests.
- **Used In:** Entire AI Studio Suite (Latency reduction).

---

## 🛠️ 7. Tool Integration Matrix

| Tool | Capability | Primary Agent Use |
|---|---|---|
| **Yahoo Finance** | Live Pricing & 1D Sparklines | Market Pulse, Impact Score |
| **Tavily Search** | Deep Web/News Verification | Truth Engine, Story Arc |
| **NeonDB + Drizzle** | Vector/Relational Persistence | Persona Storage, Profile Memory |
| **SHA-256 Cache** | Zero-Latency Result Retrieval | Entire Studio Panel |
| **Radix UI** | Hover & Modal Interactivity | Context Engine, Audio Studio |
| **Sarvam AI** | Regional TTS & Context | Podcast Daily |

---
*My ET: Moving from "Reading News" to "Operating on Intelligence."*

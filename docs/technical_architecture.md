# Technical Architecture: The ET-GenAI Stack

## 1. System Overview
The ET-GenAI platform is built as a **Multi-Agent News Operating System.** It bridges the gap between static web content and active, personalized intelligence through a combination of Next.js, specialized AI tools, and a secure memory layer.

---

## 2. The Tech Stack
### Frontend & Orchestration
- **Framework**: Next.js (App Router) + Tailwind CSS + Shadcn UI.
- **Agentic Orchestration**: Vercel AI SDK or LangGraph (Python/JS).
- **Authentication**: Clerk / Next-Auth for user identity and persona binding.

### AI Model Layer
- **Reasoning Engine (Deep Analysis)**: DeepSeek-R1 or o1-mini. Used for high-stakes financial logic (Bull/Bear, Misinfo Engine, Strategy Memos).
- **Fast Execution (Summarization/Chat)**: Gemini 1.5 Flash. Used for real-time news parsing, basic summarization, and initial chat responses.
- **Multimodal (Vision/Image)**: Gemini 1.5 Pro Vision. Used for analyzing WhatsApp screenshots in the Truth Engine.

---

## 3. Agentic Orchestration Layer (The Brain)
To move beyond simple automation, we employ **Stateful, Cyclic Agents.**
- **Orchestration**: We use **LangGraph** (or a custom state-machine) to manage agent interactions. This allows agents to "loop back," verify facts, and refine their own analysis before the human sees it.
- **Chain-of-Thought Workflows**: For high-stakes tasks (e.g., Bull/Bear), the agent doesn't just output text. It follows a **Logically Verifiable Sequence**:
    1.  **Extract**: Identify key financial claims.
    2.  **Verify**: Cross-reference with ET Archives (via pgvector).
    3.  **Debate**: Internal bull/bear agents argue the case.
    4.  **Synthesize**: Final formatting based on the user's **Mem0** persona.

---

## 4. Storage & Memory (The Context Layer)
### Data Persistence
- **Database**: Neon (Serverless PostgreSQL) for user profiles, saved articles, and sector-specific data.
- **Vector DB**: `pgvector` on Neon for ET archive RAG (Retrieval-Augmented Generation) and Story Arc tracking.

### User Memory
- **Long-Term Context (Mem0)**: Tracks high-level user preferences, professional personas, and historical interests to refine future briefings.
- **Session Context (Redis)**: Caches real-time news feeds and the current "conversation thread" for the active session.

---

## 4. Specialized Tool Integrations
### News Ingestion & Search
- **ET Archive Access**: Custom API/RSS parser connected to ET's live feeds.
- **Deep Web Search (Tavily)**: Used for the "News Navigator" (Custom Article Builder) to find complementary data outside the ET archive.
- **Scraping (Apify)**: (Optional) For deep-scraping niche regulatory portals or specific competitor filings if not found in search.

### Translation & Synthesis
- **Vernacular Translation (Sarvam AI)**: High-context regional language support with "Cultural Injection" for financial terms.
- **Form Generation**: Custom Prompt Skills stored in Neon, allowing users to save their own "Analytical Workflows."

---

## 5. Security & Privacy
- **Model Context Protocol (MCP)**: Provides a secure local bridge. Instead of uploading your bank CSV to a server, an MCP server runs locally to read your portfolio, sends only the *anonymized summary* to the agents for news matching.

---

## 6. Logic Flow: The "Bull/Bear Splitter"
1. **Trigger**: User clicks "Bull/Bear Splitter" on an article.
2. **Retrieval**: System fetches the clean article text and the user's persona (from Mem0/Neon).
3. **Agentic Loop**:
    - **Agent A (Pessimistic Analyst)**: Scans text for risk factors (Reasoning Model).
    - **Agent B (Optimistic Analyst)**: Scans text for growth potential (Reasoning Model).
4. **Synthesis**: **Orchestrator Agent** takes both analytical payloads, matches them against the user's specific sector, and formats the final UI response.
5. **Delivery**: The synthesized analysis is streamed to the frontend via Vercel AI SDK.

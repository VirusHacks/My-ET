# Agentic Innovation: Next-Gen Financial Intelligence

## Core Vision
To move from "summarization" to **"autonomous reasoning."** The Agentic Layer is the primary interface between the vast ET archives and the user's specific context, acting as a tireless 24/7 financial research team.

---

## 1. The Pre-emptive Strategic Analyst (Proactive Intelligence)
*   **The Mission**: To identify market-moving signals *before* the user opens the app.
*   **Workflow**: 
    1.  A background worker (Cron-job) triggers an **Ingestion Agent**.
    2.  The agent filters live ET RSS feeds against the user's **Mem0/MCP Watchlist.**
    3.  If a critical signal (funding, regulation, earnings) is detected, a **Reasoning Agent (DeepSeek-R1)** drafts a "Strategic Action Memo."
    4.  **Result**: The user receives a proactive notification with a 30-second brief on exactly what happened and what action they should take.

---

## 2. The Adversarial Debate Protocol (Bias Mitigation)
*   **The Mission**: To eliminate the "Confirmation Bias" that plagues standard financial news.
*   **Workflow**: 
    1.  Upon a user request for news analysis, the system spawns **Agent Bull** (Growth-focused) and **Agent Bear** (Risk-focused).
    2.  The agents perform a multi-turn debate, citing ET sources and external data (via **Tavily**).
    3.  A **Synthesizer Agent** reviews the debate and formats it into a "Group Chat" UI where the user can intervene.
    4.  **Result**: A 360-degree, logically verified view of the news, preventing one-sided reporting.

---

## 3. The "Butterfly Effect" Agent (Scenario Modeling)
*   **The Mission**: To predict the cascading impact of macro-events on the user's micro-niche.
*   **Workflow**: 
    1.  When an article describes a macro shift (e.g., Oil Price Hike), the **Modeling Agent** performs a "Chain-of-Impact" analysis.
    2.  It uses **Tavily** to research cross-sector dependencies (Logistics -> Raw Materials -> Pricing).
    3.  It then maps these dependencies against the user's **Professional Persona** (from Mem0).
    4.  **Result**: Personalized insights like, *"Oil is up—this directly increases raw material costs for your paints manufacturing business by 4%."*

---

## 4. The "Institutional Memory" Agent (Pattern Matcher)
*   **The Mission**: To identify historical patterns and "Truth-test" executive promises.
*   **Workflow**: 
    1.  When a user reads a headline about a CEO/Company, the **Archival Agent** scans ET's 20-year history using **pgvector RAG.**
    2.  It looks for previous mentions of the same keywords/promises.
    3.  It cross-references those promises with the *actual market outcomes* that followed.
    4.  **Result**: Contextual overlays like, *"Wait—this CEO made a similar promise in 2021. Back then, the share price dropped 5% in the following quarter. Here's why."*

---

## 5. Technical Implementation: Agent Orchestration
To make these agents "bang on," we use **LangGraph** (or similar stateful workflow engines):
- **Cycles allowed**: Agents can verify their own claims before presenting them to the user.
- **State Management**: Each agent "remembers" the previous step, allowing for multi-step reasoning (e.g., Search -> Deduce -> Verify -> Refine).
- **Tool Integration**: Agents have access to **Tavily** (Search), **Sarvam** (Translate), and the **ET Archive** (RAG) natively as "Skills."

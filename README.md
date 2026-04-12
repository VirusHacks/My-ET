# My ET: Turn the News Into a Podcast

**Transforming any article, topic, or idea into a fully produced podcast episode — instantly.**

[![Framework: Next.js 16](https://img.shields.io/badge/Framework-Next.js%2016-black?logo=nextdotjs)](https://nextjs.org/)
[![AI Engine: Gemini 2.5 Flash](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-blue?logo=google)](https://deepmind.google/technologies/gemini/)
[![Voice: ElevenLabs](https://img.shields.io/badge/Voice-ElevenLabs-black)](https://elevenlabs.io/)
[![Search: Tavily](https://img.shields.io/badge/Search-Tavily-6366f1)](https://tavily.com/)
[![Database: Neon Postgres](https://img.shields.io/badge/Database-Neon%20Postgres-00e599?logo=postgresql)](https://neon.tech/)

---

## The Problem

People want to stay informed, but reading long articles is exhausting. Turning any topic into a real podcast takes hours of scripting, recording, and editing. And when misinformation spreads faster than the truth, most people have no easy way to verify what they are sharing.

## The Vision

My ET transforms passive content consumption into an active podcast creation studio. Type a topic, paste an article, or search for something you care about — and get a fully scripted, voiced, and verified podcast episode in seconds.

---

## Core Features

### Podcast Studio
One click turns any article or topic into a produced podcast episode.
- Choose your format: 2-person conversational, solo narration, interview-style Q&A, or short daily brief
- Gemini 1.5 Pro generates natural, format-specific scripts — not summaries read aloud
- ElevenLabs assigns distinct voices to each speaker for a genuine conversational feel
- Works on any content: news articles, blog posts, your own notes, or a topic you type in

### Smart Content Search
- Search any topic and get AI-curated source material ready to convert
- Pulls from live news and reference content simultaneously
- Intent-aware layouts for topic deep-dives, comparisons, and quick fact-checks

### Truth Engine
- Upload a screenshot, article, or claim before you record
- Gemini 1.5 Pro analyzes it visually and textually
- Tavily cross-references against authoritative sources
- Returns a clear true, false, or misleading verdict with citations

### Multilingual Audio
- One-click script generation in 10+ languages
- GPT-4o-mini handles semantic accuracy, language-specific models handle cultural nuance
- Not literal translation — contextual adaptation that feels native to the listener

### AI Studio
Nine tools available on every piece of content:
- Podcast Script, Solo Brief, Interview Format, Episode Arc
- Context Cards, Contrarian Angle, Multilingual Script
- Video Brief and Fact Score

---

## Technical Architecture

### Grounded Script Generation
To prevent AI hallucinations in scripts, every piece of content is grounded in real fetched source material via Tavily. Gemini shapes the language — it never invents the facts.

### Multi-Agent Pipeline
- Router Agent classifies user intent — search, script generation, or fact-check
- Content Agents fetch and synthesize from multiple sources in parallel
- Script Agent generates format-specific output with distinct prompting strategies per format
- Voice Agent directs ElevenLabs with pacing and speaker cues

### Zero-Latency Caching
- SHA-256 hashing caches generations in Neon Postgres via content-hash keys
- Repeat queries drop from 8 seconds to under 40ms

---

## Quick Start

1. Clone the repo
2. Setup environment: Rename `webapp/.env.example` to `webapp/.env` and add your API keys (Gemini, ElevenLabs, Tavily, Clerk)
3. Install and run:

```bash
cd webapp
pnpm install
pnpm run dev
```

---

*Built for anyone with a story worth hearing.*

# CLAUDE.md — SynMuse Project Instructions

## What This Project Is

SynMuse is a synthetic consumer panel platform for fashion brands. A brand describes a target consumer → the system scrapes real consumer discourse (Reddit, fashion articles) → builds a data-grounded persona with a ChromaDB vector collection → and uses that collection as context for every chat interaction. Each persona is essentially a data-backed LLM that responds based on real consumer psychographics and opinions, not generic character prompts.

This is a coursework MVP for a 2-minute Dragon's Den pitch on **March 9**. It needs to work reliably for a live demo. It does NOT need to handle concurrent users or deploy to cloud.

## Demo Strategy

- **6–9 pre-built personas** with pre-scraped data (womenswear + menswear, ready before demo)
- **1 live persona creation** during demo to show the pipeline end-to-end
- **Pre-cached responses** for 2–3 product concepts as fallback if API is slow
- Demo runs locally via screen share. Frontend localhost:5173, backend localhost:8000.

## Tech Stack

- **Backend:** Python 3.11+, FastAPI, PRAW (Reddit), ChromaDB, Anthropic SDK
- **Frontend:** Vite + React + Tailwind CSS
- **LLM:** Claude Sonnet 4.5 for persona generation + chat, Claude Haiku 4.5 for batch NLP extraction
- **Embeddings:** OpenAI text-embedding-3-small
- **Vector Store:** ChromaDB with persistent local storage — **one collection per persona**
- **Articles:** Hybrid approach — pre-scraped excerpts from Vogue/Elle/GQ/Highsnobiety as baseline safety net, plus live web search for article snippets during persona creation as the demo wow-factor. Even search result snippets (2-3 sentences) are enough for embedding and source citation.

## API Keys Required

You need exactly 3 sets of credentials:

### 1. Anthropic API Key (Claude — all language generation)
- **What it does:** Powers persona profile generation (Sonnet), batch NLP extraction (Haiku), all chat responses (Sonnet)
- **Get it:** console.anthropic.com → Settings → API Keys → Create Key
- **Cost:** ~$10-20 for full dev + demo cycle. Billed per token, separate from Pro subscription.
- **Models:**
  - `claude-sonnet-4-5-20250929` — persona generation, chat responses, panel summaries
  - `claude-haiku-4-5-20251001` — batch NLP extraction (chunk tagging), source routing

### 2. OpenAI API Key (embeddings ONLY — not for generation)
- **What it does:** Converts text chunks into vectors for ChromaDB. Nothing else.
- **Get it:** platform.openai.com → API Keys → Create Key. Add $5 credits.
- **Cost:** Under $1 for entire corpus. text-embedding-3-small is $0.02/million tokens.
- **Model:** `text-embedding-3-small`
- **Why OpenAI?** Anthropic doesn't offer an embeddings API. This is standard practice.

### 3. Reddit API via PRAW (free, no payment)
- **What it does:** Scrapes posts and comments from fashion subreddits.
- **Get it:** reddit.com/prefs/apps → "create another app" → type "script" → redirect URI `http://localhost:8080`
- **Gives you:** client_id + client_secret. Takes 2 minutes.

## Environment Variables

Create `.env` in project root:
```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
REDDIT_USER_AGENT=synmuse-research/1.0
CHROMA_PERSIST_DIR=./data/chroma_db
```

## Project Structure

```
synmuse/
├── CLAUDE.md
├── .env
├── backend/
│   ├── main.py                    # FastAPI app — all endpoints
│   ├── requirements.txt
│   ├── config.py                  # Env vars, constants, model names
│   ├── scraper/
│   │   ├── reddit_scraper.py      # PRAW-based Reddit scraper
│   │   ├── article_loader.py      # Loads pre-scraped articles + live web search for snippets
│   │   └── source_router.py       # Given persona description → which sources to scrape/filter
│   ├── processing/
│   │   ├── extractor.py           # NLP extraction via Claude Haiku
│   │   └── chunker.py             # Splits text into embeddable chunks with metadata
│   ├── vectorstore/
│   │   ├── embedder.py            # OpenAI embedding calls
│   │   ├── collection_manager.py  # Create/load/query per-persona ChromaDB collections
│   │   └── retriever.py           # RAG retrieval: query → relevant chunks
│   ├── personas/
│   │   ├── creator.py             # Full persona creation pipeline
│   │   ├── profile_generator.py   # LLM call to generate persona profile
│   │   └── chat.py                # Individual + panel chat generation
│   └── demo/
│       ├── seed_personas.py       # Pre-build all demo personas
│       ├── cache_responses.py     # Pre-generate demo responses
│       └── cached_responses/      # JSON cache files
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── PersonaChat.jsx
│       │   ├── PanelChat.jsx
│       │   └── CreatePersona.jsx
│       └── components/
│           ├── Sidebar.jsx
│           ├── ChatMessage.jsx
│           ├── PersonaChip.jsx
│           ├── PersonaMini.jsx
│           ├── PanelMember.jsx
│           └── IntentBar.jsx
├── data/
│   ├── raw/                       # Raw scraped JSON per source
│   ├── articles/                  # Pre-scraped fashion article excerpts
│   ├── chroma_db/                 # ChromaDB persistent storage
│   └── persona_profiles/          # Generated persona profile JSONs
└── scripts/
    ├── scrape_reddit.py           # Standalone Reddit scraping
    ├── scrape_articles.py         # One-time article pre-scraping (baseline corpus)
    └── build_demo.py              # Full demo build script
```

## How to Run

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev

# Build demo data (run once, before demo day)
python scripts/build_demo.py
```

---

## Core Architecture

### The Persona = A ChromaDB Collection

Each persona gets its own ChromaDB collection named `persona_{slug}`. The collection contains:

- **Embedded chunks** from scraped sources (Reddit posts/comments, article excerpts)
- **Metadata per chunk:** `source`, `source_url`, `date`, `score`, `category` (fit/fabric/colour/price/brand/trend/complaint/praise), `raw_text`
- **Persona profile document:** One special document with metadata `type: "profile"` containing the full generated persona profile

When a chat question comes in:
1. Retrieve top-15 relevant chunks from the persona's collection
2. Load the persona profile document
3. Construct prompt: profile + chunks + question → Claude Sonnet
4. Return structured response (text, intent, concern, sources)

### Source Routing

`source_router.py` — a Claude Haiku call that maps persona description → sources:

```python
# Input: "A 26-year-old trend-forward woman in London who shops at COS"
# Output:
{
    "subreddits": ["femalefashionadvice", "fashionwomens35"],
    "article_tags": ["womenswear", "high-street", "trend", "minimalist"],
    "keywords": ["COS", "Zara", "linen", "minimalist"]
}
```

Available subreddits (pre-scraped):
- **Womenswear:** r/femalefashionadvice, r/fashionwomens35
- **Menswear:** r/malefashionadvice, r/rawdenim, r/streetwear
- **General:** r/fashionreps, r/Depop

Article tags filter from `data/articles/`.

### Persona Creation Pipeline

`creator.py` orchestrates:

```
1. User description (natural language)
   ↓
2. source_router → subreddits + article tags + keywords
   ↓
3. reddit_scraper (live) OR filter pre-scraped corpus → raw posts
   article_loader → pre-scraped excerpts + live web search snippets
   ↓
4. chunker → ~200 token chunks with metadata
   ↓
5. extractor → Claude Haiku tags each chunk (category, sentiment)
   ↓
6. embedder → OpenAI embeddings
   ↓
7. collection_manager → create ChromaDB collection, insert chunks
   ↓
8. profile_generator → Claude Sonnet: user description + top chunks → persona profile JSON
   ↓
9. Save profile in ChromaDB + as JSON file
   ↓
10. Return profile to frontend
```

**Pre-built personas:** Run offline. ~5 min per persona.
**Live demo creation:** Filter from pre-scraped corpus (skip scraping). ~30–60 seconds.

### Chat Generation

#### Individual Chat
```python
async def generate_individual_response(persona_slug, question, chat_history):
    profile = collection_manager.get_profile(persona_slug)
    chunks = retriever.query(persona_slug, question, n_results=15)
    prompt = build_persona_prompt(profile, chunks, question, chat_history)
    response = await anthropic.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=800,
        system=prompt,
        messages=[{"role": "user", "content": question}]
    )
    return parse_persona_response(response)
```

#### Panel Chat
```python
async def generate_panel_responses(persona_slugs, question):
    # All personas respond concurrently
    tasks = [generate_individual_response(slug, question, []) for slug in persona_slugs]
    responses = await asyncio.gather(*tasks)
    summary = await generate_summary(question, responses)
    return PanelResponse(question=question, responses=responses, summary=summary)
```

### Prompt Structure

```
SYSTEM:
You are {name}, a {age}-year-old {style_identity} based in {location}.

PROFILE:
{full_persona_profile_json}

REAL CONSUMER DISCOURSE (from Reddit and fashion publications):
{top_15_retrieved_chunks_with_source_attribution}

INSTRUCTIONS:
- Respond as this specific consumer. First person.
- Ground opinions in the real discourse above. Reference specific brands, products, prices.
- Be specific and opinionated. Real consumers have strong views.
- Include concrete details: fabric weights, competing products, price comparisons.

RESPONSE FORMAT (valid JSON):
{
  "response_text": "150-250 word response as this consumer",
  "purchase_intent": <1-10>,
  "key_concern": "2-4 word concern summary",
  "referenced_sources": [{"source": "r/...", "text": "excerpt...", "score": 847}]
}
```

---

## API Endpoints

### POST /api/personas/create
Input: `{ "description": "...", "live_scrape": false }`
Output: `{ "slug": "...", "name": "...", "profile": {...}, "corpus_stats": {...} }`

### GET /api/personas
List all personas with basic info.

### GET /api/personas/{slug}
Full persona profile + corpus stats.

### POST /api/chat/individual
Input: `{ "persona_slug": "sophie", "question": "...", "chat_history": [] }`
Output: `{ "persona": "...", "response_text": "...", "purchase_intent": 4, "key_concern": "...", "referenced_sources": [...] }`

### POST /api/chat/panel
Input: `{ "persona_slugs": ["sophie", "priya", ...], "question": "..." }`
Output: `{ "responses": [...], "summary": { "consensus": "...", "avg_intent": 4.5, "top_concerns": [...], "recommendation": "..." } }`

### GET /api/health
`{ "status": "ok", "personas_loaded": 9, "total_chunks": 24500 }`

---

## Development Priorities (7-day sprint: Mon Mar 2 → Sun Mar 8, demo Mar 9)

### P1: Data Pipeline (Mon–Tue, Mar 2–3)
1. Set up all 3 API keys (Reddit, Anthropic, OpenAI) and verify connectivity
2. Reddit scraper — 2K+ posts per subreddit, start Monday evening, run overnight
3. Article pipeline — pre-scrape 50-100 excerpts from Vogue/Elle/GQ/Highsnobiety as baseline. Build web search function (using requests + search API) to fetch live article snippets during persona creation. Even search result snippets are enough for embedding.
4. Chunker + source router

### P2: Persona Engine (Wed–Thu, Mar 4–5)
1. Extractor (Haiku tagging), embedder, collection manager
2. Profile generator (Sonnet)
3. Full creation pipeline end-to-end
4. **Test:** Create one persona in terminal, verify collection works

### P3: Chat Engine (Fri, Mar 6)
1. Retriever, individual chat, panel chat
2. **Test:** 5 product concepts, verify data-grounded responses

### P4: API + Frontend (Sat–Sun, Mar 7–8)
1. FastAPI endpoints with error handling + cached fallback
2. React frontend matching `synmuse_prototype.html` exactly
3. Build with mock data first → swap in API calls

### P5: Demo Prep (Sun evening, Mar 8)
1. Pre-build all personas, pre-cache responses
2. Test live creation flow (~30–60 sec)
3. Full rehearsal

## Code Style

- Python: type hints, docstrings, f-strings, async where beneficial
- React: functional components, hooks, Tailwind
- Files under 200 lines. No over-engineering. Ships in 7 days.

## Frontend Reference

`synmuse_prototype.html` is the definitive visual spec:
- Dark theme (#0A0A0A / #181818 / #F0F0F0)
- Chakra Petch font throughout
- 7 pages: Login, Home, Sophie Chat, Jordan Chat, Linen Panel, Denim Panel, Create Persona
- All components styled with exact data shapes matching API responses

## Critical Quality Bar

- Responses reference SPECIFIC brands, products, prices from scraped data
- Personas genuinely disagree based on their data profiles
- Source citations show real Reddit posts / article excerpts
- Live creation shows the data pipeline working
- Panel summaries provide actionable recommendations

## Things NOT to Build

- User auth, cloud deployment, real-time continuous scraping
- TikTok scraping (mention in pitch as "production roadmap" only)
- Mobile responsive, dark mode toggle, WebSocket streaming
- Fine-tuning, admin panel, multi-tenancy

# STEPS.md — SynMuse Parallel Build Plan

> **Purpose:** This file splits all work between Partner 1 (P1 — Backend/Data) and Partner 2 (P2 — Frontend/Integration) such that NO task depends on a task the other partner must complete first. Each step is a single merge request (MR). After completing a step, the Claude Code agent marks it `[DONE]` with a timestamp and pushes to main via PR so the other partner can pull and see changes.
>
> **How to use:** Tell your Claude Code agent: "Read STEPS.md and CLAUDE.md. I am Partner [1/2]. Start on the next `[TODO]` step assigned to me."
>
> **Branch naming:** `p1/step-XX-description` or `p2/step-XX-description`
>
> **Rules:**
> - Never modify files owned by the other partner's current in-progress step
> - Always pull main before starting a new step
> - Mark steps `[DONE]` with timestamp when merging
> - If you finish early and the other partner's work isn't merged yet, move to your next step — they are designed to be independent

---

## Phase 1: Foundation (Mon Mar 3)

Both partners work in parallel from the start. P1 builds the data pipeline. P2 builds the frontend shell. They share nothing except the repo structure and API contract defined in CLAUDE.md.

---

### Step 01 · P1 · `[TODO]` · Repo scaffold + backend skeleton
**Branch:** `p1/step-01-backend-scaffold`
**What to build:**
- Create full directory structure from CLAUDE.md
- `backend/requirements.txt` with all dependencies (fastapi, uvicorn, praw, chromadb, anthropic, openai, python-dotenv, httpx)
- `backend/config.py` — load env vars, define model name constants, ChromaDB paths
- `backend/main.py` — FastAPI app with CORS enabled, stub endpoints returning mock JSON for ALL routes:
  - `GET /api/health` → `{"status": "ok", "personas_loaded": 0}`
  - `GET /api/personas` → returns hardcoded list of 3 persona summaries
  - `GET /api/personas/{slug}` → returns hardcoded Sophie profile JSON
  - `POST /api/personas/create` → returns hardcoded profile JSON
  - `POST /api/chat/individual` → returns hardcoded Sophie response JSON
  - `POST /api/chat/panel` → returns hardcoded 4-persona response JSON
- `.env.example` with all required keys listed (no actual values)
- Verify: `uvicorn main:app --reload` starts, all stub endpoints return valid JSON

**Output:** Backend runs at localhost:8000 with complete mock API. Frontend partner can build against these stubs immediately.

**Files created/modified:** Everything under `backend/`, `.env.example`, `requirements.txt`

---

### Step 02 · P2 · `[TODO]` · Frontend scaffold + design system
**Branch:** `p2/step-02-frontend-scaffold`
**What to build:**
- `frontend/` with Vite + React + Tailwind setup
- Install dependencies: `react-router-dom`, `lucide-react`
- `tailwind.config.js` — extend with SynMuse design tokens from prototype:
  ```
  colors: { black: '#0A0A0A', 'black-soft': '#111111', surface: '#181818',
            'surface-hover': '#222222', 'surface-active': '#2A2A2A',
            border: '#2A2A2A', 'border-hover': '#3A3A3A',
            'text-primary': '#F0F0F0', 'text-secondary': '#999999',
            'text-muted': '#666666' }
  fontFamily: { sans: ['Chakra Petch', 'system-ui', 'sans-serif'] }
  ```
- Google Fonts import for Chakra Petch in `index.html`
- `src/App.jsx` — React Router with routes: `/`, `/persona/:slug`, `/panel/:slug`, `/create`
- `src/components/Sidebar.jsx` — fully styled, hardcoded nav items, working links
- `src/pages/Home.jsx` — static layout matching prototype exactly (hardcoded persona cards, panel cards, create cards)
- Verify: `npm run dev` starts, Home page renders matching prototype visually

**Output:** Frontend runs at localhost:5173 with working routing and Home page. All data is hardcoded — no API calls yet.

**Files created/modified:** Everything under `frontend/`

**Reference:** `synmuse_prototype.html` — replicate design exactly

---

### Step 03 · P1 · `[TODO]` · Reddit scraper
**Branch:** `p1/step-03-reddit-scraper`
**Depends on:** Step 01 merged
**What to build:**
- `backend/scraper/reddit_scraper.py`:
  - Function `scrape_subreddit(subreddit_name, limit=1000, sort="top", time_filter="year")` → list of dicts
  - Each dict: `{"id", "title", "body", "score", "num_comments", "created_utc", "subreddit", "url", "is_comment", "parent_id"}`
  - Scrape both posts AND top-level comments (comments often have the best opinions)
  - Rate limiting: 1 request per second
  - Save raw output as JSON: `data/raw/{subreddit}_{timestamp}.json`
- `scripts/scrape_reddit.py`:
  - Scrapes all target subreddits: `femalefashionadvice`, `malefashionadvice`, `rawdenim`, `streetwear`, `fashionreps`, `Depop`
  - Runs as standalone script: `python scripts/scrape_reddit.py`
  - Logs progress: "Scraped 1,234 items from r/femalefashionadvice"
- Verify: Run script, confirm JSON files appear in `data/raw/` with real data
- **Start the scrape Monday evening — let it run overnight**

**Output:** Raw scraped JSON files in `data/raw/`. No other files touched.

**Files created/modified:** `backend/scraper/reddit_scraper.py`, `scripts/scrape_reddit.py`, `data/raw/*.json`

---

### Step 04 · P2 · `[IN REVIEW]` · PersonaChat page + ChatMessage component
**Branch:** `p2/step-04-persona-chat`
**Depends on:** Step 02 merged
**What to build:**
- `src/components/ChatMessage.jsx` — renders both user bubbles and persona response blocks:
  - User: right-aligned white bubble with timestamp
  - Persona: left-aligned with avatar, name, demo line, response text, intent bar, concern tag, source citations
- `src/components/IntentBar.jsx` — the small filled bar showing purchase intent 1-10
- `src/pages/PersonaChat.jsx`:
  - Split layout: chat left, detail panel right
  - Chat header with persona avatar, name, status
  - Scrollable message list
  - Input bar with send button
  - Right panel: persona name, profile fields (income, shopping behaviour, personality, style identity), data sources section with source items
  - All data hardcoded — matching Sophie and Jordan conversations from prototype exactly
- Verify: Navigate to `/persona/sophie` and `/persona/jordan`, both render correctly matching prototype

**Output:** Two working persona chat pages with full visual fidelity. No API calls.

**Files created/modified:** `src/components/ChatMessage.jsx`, `src/components/IntentBar.jsx`, `src/pages/PersonaChat.jsx`

---

## Phase 2: Data Processing (Tue–Wed Mar 4–5)

P1 builds the processing and embedding pipeline. P2 builds remaining frontend pages. Still fully independent — P2 works against hardcoded data.

---

### Step 05 · P1 · `[TODO]` · Chunker + source router + article loader
**Branch:** `p1/step-05-processing-pipeline`
**Depends on:** Step 03 merged (needs raw data in `data/raw/`)
**What to build:**
- `backend/processing/chunker.py`:
  - Function `chunk_documents(raw_items, chunk_size=200)` → list of chunks
  - Each chunk: `{"text", "source", "source_url", "date", "score", "chunk_index"}`
  - Split on sentence boundaries, not mid-word
  - Skip items with <20 characters (noise)
- `backend/scraper/source_router.py`:
  - Function `route_sources(persona_description: str) -> dict`
  - Calls Claude Haiku with persona description
  - Returns `{"subreddits": [...], "article_tags": [...], "keywords": [...]}`
  - Constrained to available pre-scraped subreddits
- `backend/scraper/article_loader.py`:
  - Function `load_articles(tags: list[str], keywords: list[str]) -> list[dict]`
  - Loads from `data/articles/*.json` (pre-scraped baseline)
  - Function `search_articles(query: str) -> list[dict]` — live web search via httpx, returns snippets
  - Each article: `{"title", "publication", "date", "text", "url", "tags"}`
- `scripts/scrape_articles.py`:
  - One-time scraper: fetch article excerpts from Vogue, Elle, GQ, Highsnobiety
  - Save as JSON in `data/articles/`
  - Target: 50-100 article excerpts
- Verify: Run chunker on raw Reddit data, confirm chunks look correct. Run source router with test description.

**Output:** Processing pipeline ready. Article baseline corpus in `data/articles/`.

**Files created/modified:** `backend/processing/chunker.py`, `backend/scraper/source_router.py`, `backend/scraper/article_loader.py`, `scripts/scrape_articles.py`, `data/articles/*.json`

---

### Step 06 · P2 · `[IN REVIEW]` · PanelChat page + PersonaChip component
**Branch:** `p2/step-06-panel-chat`
**Depends on:** Step 04 merged
**What to build:**
- `src/components/PersonaChip.jsx` — chip in persona bar with avatar, name, age, selected state, hover tooltip (fixed position, JS-calculated coordinates matching prototype)
- `src/components/PanelMember.jsx` — member card in left sidebar with avatar, name, demo, remove button
- `src/pages/PanelChat.jsx`:
  - Panel builder layout: persona bar (horizontal scrollable), left panel (selected members), right chat area
  - Persona bar with all 9 persona chips, scrollable overflow
  - Panel members sidebar showing selected personas
  - Chat area with panel name header, message list (reuses ChatMessage component), input bar
  - Hardcoded data: Linen panel (Sophie/Priya/Emma/Diane) AND Denim panel (Jordan/Raj/Tom/Marcus)
  - Route: `/panel/linen` and `/panel/denim`
- Verify: Both panel pages render, persona chips scroll, tooltips work

**Output:** Both panel pages working. No API calls.

**Files created/modified:** `src/components/PersonaChip.jsx`, `src/components/PanelMember.jsx`, `src/pages/PanelChat.jsx`

---

### Step 07 · P1 · `[TODO]` · Extractor + embedder + ChromaDB collection manager
**Branch:** `p1/step-07-vectorstore`
**Depends on:** Step 05 merged
**What to build:**
- `backend/processing/extractor.py`:
  - Function `extract_metadata(chunks: list[dict]) -> list[dict]`
  - Calls Claude Haiku in batches of 20 chunks
  - Adds to each chunk: `category` (fit/fabric/colour/price/brand/trend/complaint/praise), `sentiment` (positive/negative/neutral)
  - Prompt: "For each text chunk, return category and sentiment as JSON"
- `backend/vectorstore/embedder.py`:
  - Function `embed_chunks(chunks: list[dict]) -> list[dict]`
  - Calls OpenAI text-embedding-3-small in batches of 100
  - Adds `embedding` field to each chunk
- `backend/vectorstore/collection_manager.py`:
  - Function `create_collection(persona_slug: str) -> chromadb.Collection`
  - Function `add_chunks(persona_slug: str, chunks: list[dict])` — insert chunks with embeddings + metadata
  - Function `get_profile(persona_slug: str) -> dict` — retrieve the special profile document
  - Function `save_profile(persona_slug: str, profile: dict)` — save profile as document with `type: "profile"` metadata
  - Function `list_personas() -> list[str]` — list all collection names
  - Function `get_collection_stats(persona_slug: str) -> dict` — chunk count, source breakdown
  - ChromaDB persistent client at `CHROMA_PERSIST_DIR`
- `backend/vectorstore/retriever.py`:
  - Function `query(persona_slug: str, question: str, n_results: int = 15) -> list[dict]`
  - Embeds question via OpenAI, queries ChromaDB collection, returns ranked chunks with metadata
- Verify: Create a test collection, insert 50 chunks, query it, confirm results are relevant

**Output:** Full vectorstore pipeline working end-to-end in isolation.

**Files created/modified:** `backend/processing/extractor.py`, `backend/vectorstore/embedder.py`, `backend/vectorstore/collection_manager.py`, `backend/vectorstore/retriever.py`

---

### Step 08 · P2 · `[IN REVIEW]` · CreatePersona page + Home updates
**Branch:** `p2/step-08-create-persona`
**Depends on:** Step 06 merged
**What to build:**
- `src/pages/CreatePersona.jsx`:
  - Step 1: textarea for natural language description, "Generate persona" button
  - Step 2 (shown after button click): persona preview card with name input, generated description, attribute grid (age/location, income, key brands, style identity, shopping triggers, pain points), action buttons (regenerate, edit, save)
  - Loading state between Step 1 and Step 2 (animated dots, "Building persona from consumer discourse...")
  - All hardcoded for now — button click reveals static preview after 2-second fake delay
- `src/components/PersonaMini.jsx` — persona card for home grid (name + demo line, clickable)
- Update `src/pages/Home.jsx`:
  - Use PersonaMini component for persona column
  - Panel cards in panels column (clickable, navigate to panel pages)
  - Create cards in create column
  - All navigation working: persona cards → `/persona/:slug`, panel cards → `/panel/:slug`, create → `/create`
- Verify: Full navigation flow works: Home → any persona → back, Home → any panel → back, Home → Create → generate → preview

**Output:** All 4 page types fully built with hardcoded data and complete navigation.

**Files created/modified:** `src/pages/CreatePersona.jsx`, `src/components/PersonaMini.jsx`, `src/pages/Home.jsx`

---

## Phase 3: Persona + Chat Engine (Thu–Fri Mar 6–7)

P1 builds persona creation and chat generation. P2 wires the frontend to the real API. P2 can start wiring against the stub API from Step 01, which returns the exact JSON shapes the real API will produce.

---

### Step 09 · P1 · `[TODO]` · Persona creation pipeline
**Branch:** `p1/step-09-persona-creator`
**Depends on:** Step 07 merged
**What to build:**
- `backend/personas/profile_generator.py`:
  - Function `generate_profile(description: str, top_chunks: list[dict]) -> dict`
  - Calls Claude Sonnet with user description + most-upvoted chunks
  - Returns full persona profile JSON: `{slug, name, age, location, income, shopping_behaviour, personality, style_identity, key_brands, pain_points, triggers}`
- `backend/personas/creator.py`:
  - Function `create_persona(description: str, live_scrape: bool = False) -> dict`
  - Full pipeline: source_router → scraper/filter → chunker → extractor → embedder → collection_manager → profile_generator
  - If `live_scrape=False`: filter from pre-scraped corpus in `data/raw/`
  - If `live_scrape=True`: scrape fresh via reddit_scraper + article search
  - Returns persona profile + corpus stats
- `scripts/build_demo.py`:
  - Creates all demo personas by calling `create_persona()` for each:
    - Sophie (26, trend-forward, womenswear)
    - Priya (31, value seeker, womenswear)
    - Emma (34, luxury adjacent, womenswear)
    - Diane (52, elevated classic, womenswear)
    - Jordan (24, archive collector, menswear)
    - Raj (29, smart-casual, menswear)
    - Tom (37, workwear heritage, menswear)
    - Marcus (22, streetwear, menswear)
    - Aisha (19, gen z, womenswear)
  - Saves profiles to `data/persona_profiles/*.json`
- Verify: Run `build_demo.py` for 1-2 personas, confirm ChromaDB collections exist with chunks, profiles look realistic

**Output:** Persona creation pipeline working. Demo personas can be pre-built.

**Files created/modified:** `backend/personas/profile_generator.py`, `backend/personas/creator.py`, `scripts/build_demo.py`

---

### Step 10 · P2 · `[TODO]` · Wire frontend to stub API
**Branch:** `p2/step-10-api-wiring`
**Depends on:** Step 08 merged, Step 01 merged (stub API running)
**What to build:**
- `src/api.js` — API client module:
  - `fetchPersonas()` → GET /api/personas
  - `fetchPersona(slug)` → GET /api/personas/{slug}
  - `createPersona(description, liveScrape)` → POST /api/personas/create
  - `sendChat(personaSlug, question, history)` → POST /api/chat/individual
  - `sendPanelChat(personaSlugs, question)` → POST /api/chat/panel
  - Base URL configurable (default: `http://localhost:8000`)
- Update `Home.jsx`: fetch persona list from API on mount, render dynamically
- Update `PersonaChat.jsx`:
  - Fetch persona profile from API on mount
  - Send button calls `sendChat()`, appends response to message list
  - Loading state while waiting for response (processing dots animation)
- Update `PanelChat.jsx`:
  - Send button calls `sendPanelChat()`, appends all responses
  - Loading state with "Generating panel responses..." indicator
- Update `CreatePersona.jsx`:
  - Generate button calls `createPersona()`, shows real response in preview
  - Loading state during creation
- Verify: Frontend works against Step 01 stub API — all pages load, send/create actions return mock data

**Output:** Frontend fully wired to API. When P1 replaces stubs with real logic, frontend works automatically.

**Files created/modified:** `src/api.js`, `src/pages/Home.jsx`, `src/pages/PersonaChat.jsx`, `src/pages/PanelChat.jsx`, `src/pages/CreatePersona.jsx`

---

### Step 11 · P1 · `[TODO]` · Chat engine + real API endpoints
**Branch:** `p1/step-11-chat-engine`
**Depends on:** Step 09 merged
**What to build:**
- `backend/personas/chat.py`:
  - Function `generate_individual_response(persona_slug, question, chat_history)` → PersonaResponse
  - Function `generate_panel_responses(persona_slugs, question)` → PanelResponse (concurrent)
  - Function `generate_summary(question, responses)` → summary dict
  - Uses prompt structure from CLAUDE.md
  - Returns structured JSON: `{response_text, purchase_intent, key_concern, referenced_sources}`
- Update `backend/main.py` — replace ALL stub endpoints with real logic:
  - `GET /api/personas` → reads from ChromaDB collection list + persona_profiles/
  - `GET /api/personas/{slug}` → loads profile from ChromaDB + corpus stats
  - `POST /api/personas/create` → calls `creator.create_persona()`
  - `POST /api/chat/individual` → calls `chat.generate_individual_response()`
  - `POST /api/chat/panel` → calls `chat.generate_panel_responses()`
  - Error handling: try/except on all LLM calls, return cached response on failure
- `backend/demo/cache_responses.py`:
  - Pre-generates responses for 2-3 product concepts per persona
  - Saves as JSON in `backend/demo/cached_responses/`
  - Fallback logic in main.py: if LLM call fails or times out (>15s), serve cached response
- Verify: curl all endpoints with real data, confirm responses are grounded in scraped data

**Output:** Backend fully functional. All endpoints return real LLM-generated, data-grounded responses.

**Files created/modified:** `backend/personas/chat.py`, `backend/main.py`, `backend/demo/cache_responses.py`, `backend/demo/cached_responses/*.json`

---

## Phase 4: Polish + Demo Prep (Sat–Sun Mar 8–9)

Both partners converge. P1 builds all demo personas and caches responses. P2 does visual polish and handles any integration bugs.

---

### Step 12 · P1 · `[TODO]` · Build all demo personas + cache responses
**Branch:** `p1/step-12-demo-data`
**Depends on:** Step 11 merged
**What to build:**
- Run `scripts/build_demo.py` — create all 9 demo personas
- Run `backend/demo/cache_responses.py` — pre-generate responses for:
  - Linen blazer concept (sage green, £89) for Sophie, Priya, Emma, Diane
  - Charcoal denim concept (12oz, £75) for Jordan, Raj, Tom, Marcus
  - One additional concept per panel as backup
- Verify all ChromaDB collections exist and contain >500 chunks each
- Verify all cached responses are realistic and data-grounded
- Test live persona creation: describe a new consumer, confirm pipeline completes in <60 seconds
- Commit `data/chroma_db/` and `data/persona_profiles/` and `backend/demo/cached_responses/` to repo

**Output:** All demo data ready. Backend is fully demo-proof.

**Files created/modified:** `data/chroma_db/*`, `data/persona_profiles/*.json`, `backend/demo/cached_responses/*.json`

---

### Step 13 · P2 · `[TODO]` · Visual polish + error states + loading states
**Branch:** `p2/step-13-polish`
**Depends on:** Step 10 merged
**What to build:**
- Add error state UI: if API call fails, show "Something went wrong — retrying..." with retry button
- Add loading skeletons for Home page persona/panel cards while fetching
- Add smooth scroll-to-bottom when new chat messages appear
- Add typing indicator in chat (processing dots) while waiting for persona response
- Verify all pages match `synmuse_prototype.html` exactly:
  - Dark theme colours correct
  - Chakra Petch font rendering everywhere
  - Persona chip tooltips positioned correctly
  - Intent bars rendering at correct percentages
  - Source citations styled correctly in detail panel
  - Chat bubbles, borders, spacing all match
- Fix any visual discrepancies between prototype and React implementation
- Test at 1440px and 1920px viewport widths

**Output:** Frontend is pixel-perfect and handles all edge cases gracefully.

**Files created/modified:** Various frontend files — components and pages only

---

### Step 14 · BOTH · `[TODO]` · Integration test + demo rehearsal
**Branch:** `main` (no branch — direct collaboration)
**Depends on:** Steps 11, 12, 13 all merged
**What to do:**
- Both partners run full stack locally: backend on 8000, frontend on 5173
- Test Demo Moment 1: Open linen panel → ask question → 4 womenswear responses with source citations
- Test Demo Moment 2: Open denim panel → ask question → 4 menswear responses with disagreement
- Test Demo Moment 3: Create persona live → description → pipeline runs → profile appears
- Test navigation: Home → persona chat → back → panel → back → create
- Test fallback: kill API briefly, confirm cached responses serve
- Fix any integration issues found
- Run full demo script twice end-to-end
- **If everything works:** done. Go to sleep.
- **If something breaks:** P1 fixes backend, P2 fixes frontend. No cross-dependency.

**Output:** Demo-ready application.

---

## Status Legend

| Status | Meaning |
|--------|---------|
| `[TODO]` | Not started |
| `[IN PROGRESS]` | Currently being worked on — include partner name |
| `[IN REVIEW]` | PR open, awaiting merge |
| `[DONE]` | Merged to main — include timestamp |
| `[BLOCKED]` | Cannot proceed — include reason |

---

## Quick Reference: Who Owns What

| Area | Owner | Files |
|------|-------|-------|
| Reddit scraper | P1 | `backend/scraper/reddit_scraper.py` |
| Article loader | P1 | `backend/scraper/article_loader.py` |
| Source router | P1 | `backend/scraper/source_router.py` |
| Chunker | P1 | `backend/processing/chunker.py` |
| Extractor | P1 | `backend/processing/extractor.py` |
| Embedder | P1 | `backend/vectorstore/embedder.py` |
| Collection manager | P1 | `backend/vectorstore/collection_manager.py` |
| Retriever | P1 | `backend/vectorstore/retriever.py` |
| Profile generator | P1 | `backend/personas/profile_generator.py` |
| Persona creator | P1 | `backend/personas/creator.py` |
| Chat engine | P1 | `backend/personas/chat.py` |
| FastAPI endpoints | P1 | `backend/main.py` |
| Demo scripts | P1 | `scripts/*`, `backend/demo/*` |
| Config | P1 | `backend/config.py` |
| React app shell | P2 | `src/App.jsx`, `src/index.css` |
| Sidebar | P2 | `src/components/Sidebar.jsx` |
| Home page | P2 | `src/pages/Home.jsx` |
| PersonaChat page | P2 | `src/pages/PersonaChat.jsx` |
| PanelChat page | P2 | `src/pages/PanelChat.jsx` |
| CreatePersona page | P2 | `src/pages/CreatePersona.jsx` |
| All components | P2 | `src/components/*` |
| API client | P2 | `src/api.js` |
| Tailwind config | P2 | `tailwind.config.js` |

---

## The Interface Contract

P1 and P2 are decoupled by the **API contract** defined in CLAUDE.md. P1 starts by deploying stub endpoints (Step 01) that return the exact JSON shapes the real API will produce. P2 builds the entire frontend against these stubs. When P1 replaces stubs with real logic (Step 11), the frontend works without any changes.

**If either partner falls behind:** The other can continue. P2 never waits for P1's real backend — stubs are available from Day 1. P1 never waits for P2's frontend — all backend work is testable via curl/terminal.

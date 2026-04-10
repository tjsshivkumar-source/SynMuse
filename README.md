# SynMuse
AI-powered fashion consumer simulation platform. Describe your design concept, and SynMuse lets you chat with synthetic consumer personas grounded in real fashion discourse to validate ideas before committing to production.

**DEMO VIDEO:** [link](https://youtu.be/XZkWSzPBJFU)

**PITCH DECK:** <img width="1027" height="524" alt="Screenshot 2026-04-10 at 5 13 42 PM" src="https://github.com/user-attachments/assets/51629aff-f0f4-44d4-a3e3-47b316d7c3c4" />

## What it does
1. **Persona Builder** creates synthetic consumer profiles grounded in real fashion discourse (Reddit + fashion publications) via OpenAI embeddings stored in ChromaDB
2. **Simulation Engine** routes your design question through semantic retrieval to the relevant persona, responding with intent score, concerns, and cited sources
3. **Validation Report** compiles responses into structured output with intent scoring and actionable recommendations

## Tech Stack
- Python / Flask — backend API
- Claude API (Anthropic SDK) — persona response generation
- OpenAI Embeddings — semantic representation of fashion discourse
- ChromaDB — vector database for persona retrieval
- Next.js / React — frontend interface

## Run Locally

```bash
npm install
pip install -r requirements.txt
```

Create `.env.local` in the project root:

ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key

Start the dev server:

```bash
npm run dev
python app.py
```

Open http://localhost:3000.

## Built at
Imperial College London — AI Ventures, 2026

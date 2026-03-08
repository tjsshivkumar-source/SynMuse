"""FastAPI app — all endpoints for SynMuse."""

import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.config import PERSONA_PROFILES_DIR
from backend.vectorstore.collection_manager import (
    list_personas as cm_list_personas,
    get_profile,
    get_collection_stats,
    save_profile,
    delete_collection,
)
from backend.personas.creator import create_persona as run_create_persona
from backend.personas.chat import generate_individual_response, generate_panel_responses

app = FastAPI(title="SynMuse API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request models ──────────────────────────────────────────────

class CreatePersonaRequest(BaseModel):
    description: str
    live_scrape: bool = False


class IndividualChatRequest(BaseModel):
    persona_slug: str
    question: str
    chat_history: list = []


class PanelChatRequest(BaseModel):
    persona_slugs: list[str]
    question: str


class UpdatePersonaRequest(BaseModel):
    name: str | None = None


# ── Fallback stub data (used when no real personas are built) ───

STUB_PERSONAS = [
    {"slug": "sophie", "name": "Sophie", "age": 26, "location": "London", "income": "£45K", "style_descriptor": "Early adopter"},
    {"slug": "priya", "name": "Priya", "age": 31, "location": "Manchester", "income": "£38K", "style_descriptor": "Research-driven"},
    {"slug": "marcus", "name": "Marcus", "age": 22, "location": "Birmingham", "income": "Student", "style_descriptor": "Depop regular"},
    {"slug": "emma", "name": "Emma", "age": 34, "location": "Edinburgh", "income": "£65K", "style_descriptor": "Capsule wardrobe"},
    {"slug": "aisha", "name": "Aisha", "age": 19, "location": "South London", "income": "Gap year", "style_descriptor": "Impulse buyer"},
    {"slug": "diane", "name": "Diane", "age": 52, "location": "Surrey", "income": "£58K", "style_descriptor": "Brand loyal"},
    {"slug": "jordan", "name": "Jordan", "age": 24, "location": "East London", "income": "£30K", "style_descriptor": "Archive collector"},
    {"slug": "raj", "name": "Raj", "age": 29, "location": "Leeds", "income": "£42K", "style_descriptor": "Smart-casual office"},
    {"slug": "tom", "name": "Tom", "age": 37, "location": "Bristol", "income": "£55K", "style_descriptor": "Workwear heritage"},
]

STUB_PROFILES = {
    "sophie": {
        "slug": "sophie", "name": "Sophie", "age": 26, "location": "London",
        "income": "£45,000", "style_descriptor": "Trend-forward early adopter",
        "profile": {
            "shopping_behaviour": "Early adopter. Follows TikTok trends. Shops Zara, COS, & Other Stories. Returns ~30% of online purchases.",
            "personality": "Enthusiastic but critical. Excited by newness but has been burned by poor quality. Vocal about value for money.",
            "style_identity": "Minimalist-leaning with trend accents. Quiet luxury aspirant on a high-street budget.",
        },
        "data_sources": {
            "summary": "Grounded in 2,847 discourse fragments from 3 sources",
            "sources": [
                {"source": "r/femalefashionadvice", "text": "COS linen blazer was a total disappointment — the fabric was so thin you could see through it. At £79 I expected better.", "score": 847, "date": "6 months ago"},
                {"source": "r/femalefashionadvice", "text": "Is anyone else over sage green? Every brand has done it to death. Give me tobacco, olive, or even a warm grey.", "score": 623, "date": "3 months ago"},
                {"source": "r/femalefashionadvice", "text": "Just got the Arket relaxed blazer in tobacco and it's genuinely perfect. Great weight, patch pockets, works with everything.", "score": 412, "date": "2 months ago"},
            ],
        },
    },
    "jordan": {
        "slug": "jordan", "name": "Jordan", "age": 24, "location": "East London",
        "income": "£30,000", "style_descriptor": "Archive collector",
        "profile": {
            "shopping_behaviour": "Buys secondhand first. Grailed, Depop, vintage stores in Brick Lane. Will save for months for a grail piece.",
            "personality": "Deeply knowledgeable, opinionated. Respects craft and provenance. Dismissive of brands that cut corners.",
            "style_identity": "Japanese workwear meets London vintage. Heavy fabrics, muted palettes, patina-friendly pieces.",
        },
        "data_sources": {
            "summary": "Grounded in 3,412 discourse fragments from 4 sources",
            "sources": [
                {"source": "r/rawdenim", "text": "14oz is the sweet spot for year-round wear. Anything lighter feels like chinos, anything heavier is a commitment.", "score": 1203, "date": "4 months ago"},
                {"source": "r/malefashionadvice", "text": "Grey selvedge is criminally underrated. Way more versatile than indigo for daily wear.", "score": 891, "date": "2 months ago"},
                {"source": "r/rawdenim", "text": "Just because a brand uses Japanese fabric doesn't mean the construction is good.", "score": 567, "date": "5 months ago"},
            ],
        },
    },
}

STUB_INDIVIDUAL_RESPONSE = {
    "persona": "sophie",
    "response_text": "Sage green linen blazer at £89 — honestly, my first reaction is \"haven't I seen this everywhere already?\" COS did their oversized linen blazer in a similar sage last spring and it went to sale within six weeks. The silhouette is safe, which is fine, but at that price you're competing directly with Arket and & Other Stories who are doing the same thing with better fabric weight. If you're going to do linen at this price, the colour needs to be unexpected — a tobacco or a washed terracotta would feel more current right now. I'd probably scroll past this one.",
    "purchase_intent": 4,
    "key_concern": "Colour saturation",
    "referenced_sources": [
        {"source": "r/femalefashionadvice", "text": "COS linen blazer was a total disappointment — the fabric was so thin you could see through it.", "score": 847},
        {"source": "r/femalefashionadvice", "text": "Is anyone else over sage green? Every brand has done it to death.", "score": 623},
    ],
}

STUB_PANEL_RESPONSE = {
    "question": "What do you think about a relaxed-fit linen blazer in sage green, priced at £89?",
    "responses": [
        {"persona": "sophie", "name": "Sophie", "age": 26, "style_descriptor": "Trend-forward", "response_text": "Sage green linen at £89 — I've literally seen this exact product on every mid-range brand's lookbook this season.", "purchase_intent": 4, "key_concern": "Market saturation"},
        {"persona": "priya", "name": "Priya", "age": 31, "style_descriptor": "Value seeker", "response_text": "£89 is the sweet spot where I start asking questions. If the fabric is genuinely linen and not a linen-mix, that's a selling point.", "purchase_intent": 6, "key_concern": "Fabric quality at price point"},
        {"persona": "emma", "name": "Emma", "age": 34, "style_descriptor": "Luxury adjacent", "response_text": "At £89, this sits in an awkward middle ground for me. Too expensive for impulse, not enough for investment.", "purchase_intent": 3, "key_concern": "Undifferentiated positioning"},
        {"persona": "diane", "name": "Diane", "age": 52, "style_descriptor": "Elevated classic", "response_text": "Relaxed fit in sage green could work beautifully if the proportions are right.", "purchase_intent": 5, "key_concern": "Narrow age targeting"},
    ],
    "summary": {
        "consensus": "Panel is lukewarm. Product seen as undifferentiated in a crowded market.",
        "avg_intent": 4.5,
        "top_concerns": ["Market saturation", "Fabric quality at price point", "Undifferentiated positioning"],
        "recommendation": "Consider a less saturated colour and emphasise fabric quality to differentiate.",
    },
}

STUB_CREATED_PERSONA = {
    "slug": "mia", "name": "Mia", "age": 28, "location": "East London",
    "income": "£32–38K", "style_descriptor": "Quiet luxury on a budget",
    "profile": {
        "shopping_behaviour": "Shops strategically: invests in footwear while keeping basics affordable.",
        "personality": "Budget-conscious creative professional with a sharp eye for quality.",
        "style_identity": "Quiet luxury on a budget. Scandi-minimalist with vintage accents.",
    },
    "data_sources": {"summary": "Grounded in 1,923 discourse fragments", "sources": []},
    "corpus_stats": {"total_chunks": 1923, "sources_used": 3},
    "preview_description": "A budget-conscious creative professional navigating the tension between quiet luxury aspirations and high-street reality.",
    "preview_attributes": {
        "age_location": "28 · East London", "income": "£32–38K",
        "key_brands": "COS, Weekday, Arket, vintage, Depop",
        "style_identity": "Quiet luxury on a budget · Scandi-minimalist with vintage accents",
        "shopping_triggers": "TikTok virality, end-of-season sales, unique footwear, vintage finds",
        "pain_points": "Quality inconsistency at mid-range, sustainability guilt, fast fashion temptation",
    },
}


# ── Helper: load persona data from ChromaDB or disk profiles ────

def _load_persona_list() -> list[dict]:
    """Load persona list from ChromaDB collections + disk profiles."""
    personas = []
    seen_slugs = set()

    # From ChromaDB
    for slug in cm_list_personas():
        profile = get_profile(slug)
        if profile:
            personas.append({
                "slug": slug,
                "name": profile.get("name", slug),
                "age": profile.get("age", ""),
                "location": profile.get("location", ""),
                "income": profile.get("income", ""),
                "style_descriptor": profile.get("style_descriptor", ""),
            })
            seen_slugs.add(slug)

    # From disk profiles (backup)
    if PERSONA_PROFILES_DIR.exists():
        for f in PERSONA_PROFILES_DIR.glob("*.json"):
            try:
                p = json.loads(f.read_text())
                slug = p.get("slug", f.stem)
                if slug not in seen_slugs:
                    personas.append({
                        "slug": slug,
                        "name": p.get("name", slug),
                        "age": p.get("age", ""),
                        "location": p.get("location", ""),
                        "income": p.get("income", ""),
                        "style_descriptor": p.get("style_descriptor", ""),
                    })
                    seen_slugs.add(slug)
            except Exception:
                continue

    return personas


def _load_full_profile(slug: str) -> dict | None:
    """Load full persona profile from ChromaDB or disk."""
    # Try ChromaDB first
    profile = get_profile(slug)
    if profile:
        stats = get_collection_stats(slug)
        sources_summary = f"Grounded in {stats['total_chunks']} discourse fragments from {len(stats.get('sources', {}))} sources"
        profile["data_sources"] = profile.get("data_sources", {"summary": sources_summary, "sources": []})
        if not profile["data_sources"].get("summary"):
            profile["data_sources"]["summary"] = sources_summary
        return profile

    # Try disk
    if PERSONA_PROFILES_DIR.exists():
        path = PERSONA_PROFILES_DIR / f"{slug}.json"
        if path.exists():
            return json.loads(path.read_text())

    return None


# ── Endpoints ───────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    persona_slugs = cm_list_personas()
    total_chunks = 0
    for slug in persona_slugs:
        stats = get_collection_stats(slug)
        total_chunks += stats.get("total_chunks", 0)
    return {"status": "ok", "personas_loaded": len(persona_slugs), "total_chunks": total_chunks}


@app.get("/api/personas")
async def list_personas_endpoint():
    personas = _load_persona_list()
    return personas if personas else STUB_PERSONAS


@app.get("/api/personas/{slug}")
async def get_persona(slug: str):
    profile = _load_full_profile(slug)
    if profile:
        return profile
    return STUB_PROFILES.get(slug, STUB_PROFILES.get("sophie", STUB_CREATED_PERSONA))


@app.patch("/api/personas/{slug}")
async def update_persona(slug: str, req: UpdatePersonaRequest):
    profile = _load_full_profile(slug)
    if not profile:
        return {"error": "Persona not found"}

    if req.name is not None:
        profile["name"] = req.name

    # Save to ChromaDB
    save_profile(slug, profile)

    # Save to disk
    PERSONA_PROFILES_DIR.mkdir(parents=True, exist_ok=True)
    profile_path = PERSONA_PROFILES_DIR / f"{slug}.json"
    profile_path.write_text(json.dumps(profile, indent=2, ensure_ascii=False))

    return profile


@app.delete("/api/personas/{slug}")
async def delete_persona_endpoint(slug: str):
    """Delete a persona: remove ChromaDB collection + disk profile."""
    deleted_chroma = delete_collection(slug)

    deleted_disk = False
    if PERSONA_PROFILES_DIR.exists():
        profile_path = PERSONA_PROFILES_DIR / f"{slug}.json"
        if profile_path.exists():
            profile_path.unlink()
            deleted_disk = True

    if not deleted_chroma and not deleted_disk:
        return {"error": "Persona not found", "slug": slug}

    return {"status": "deleted", "slug": slug}


@app.post("/api/personas/create")
async def create_persona_endpoint(req: CreatePersonaRequest):
    try:
        result = await run_create_persona(req.description, req.live_scrape)
        return result
    except Exception as e:
        print(f"Create persona error: {e}")
        return STUB_CREATED_PERSONA


@app.post("/api/chat/individual")
async def chat_individual(req: IndividualChatRequest):
    # Check if persona has real data
    profile = get_profile(req.persona_slug)
    if profile:
        try:
            result = await generate_individual_response(
                req.persona_slug, req.question, req.chat_history
            )
            return result
        except Exception as e:
            print(f"Chat error: {e}")

    return STUB_INDIVIDUAL_RESPONSE


@app.post("/api/chat/panel")
async def chat_panel(req: PanelChatRequest):
    # Check if any persona has real data
    has_real = any(get_profile(slug) for slug in req.persona_slugs)
    if has_real:
        try:
            result = await generate_panel_responses(req.persona_slugs, req.question)
            return result
        except Exception as e:
            print(f"Panel chat error: {e}")

    return STUB_PANEL_RESPONSE

"""FastAPI app — all endpoints for SynMuse (stub data for dev)."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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


# ── Stub data ───────────────────────────────────────────────────

PERSONAS = [
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

PROFILES = {
    "sophie": {
        "slug": "sophie",
        "name": "Sophie",
        "age": 26,
        "location": "London",
        "income": "£45,000",
        "style_descriptor": "Trend-forward early adopter",
        "profile": {
            "shopping_behaviour": "Early adopter. Follows TikTok trends. Shops Zara, COS, & Other Stories. Returns ~30% of online purchases.",
            "personality": "Enthusiastic but critical. Excited by newness but has been burned by poor quality. Vocal about value for money.",
            "style_identity": "Minimalist-leaning with trend accents. Quiet luxury aspirant on a high-street budget.",
        },
        "data_sources": {
            "summary": "Grounded in 2,847 discourse fragments from 3 sources",
            "sources": [
                {
                    "source": "r/femalefashionadvice",
                    "text": "COS linen blazer was a total disappointment — the fabric was so thin you could see through it. At £79 I expected better.",
                    "score": 847,
                    "date": "6 months ago",
                },
                {
                    "source": "r/femalefashionadvice",
                    "text": "Is anyone else over sage green? Every brand has done it to death. Give me tobacco, olive, or even a warm grey.",
                    "score": 623,
                    "date": "3 months ago",
                },
                {
                    "source": "r/femalefashionadvice",
                    "text": "Just got the Arket relaxed blazer in tobacco and it's genuinely perfect. Great weight, patch pockets, works with everything.",
                    "score": 412,
                    "date": "2 months ago",
                },
            ],
        },
    },
    "jordan": {
        "slug": "jordan",
        "name": "Jordan",
        "age": 24,
        "location": "East London",
        "income": "£30,000",
        "style_descriptor": "Archive collector",
        "profile": {
            "shopping_behaviour": "Buys secondhand first. Grailed, Depop, vintage stores in Brick Lane. Will save for months for a grail piece. Knows fabric weights by feel.",
            "personality": "Deeply knowledgeable, opinionated. Respects craft and provenance. Dismissive of brands that cut corners. Active on Reddit denim communities.",
            "style_identity": "Japanese workwear meets London vintage. Heavy fabrics, muted palettes, patina-friendly pieces. Anti-trend but not anti-fashion.",
        },
        "data_sources": {
            "summary": "Grounded in 3,412 discourse fragments from 4 sources",
            "sources": [
                {
                    "source": "r/rawdenim",
                    "text": "14oz is the sweet spot for year-round wear. Anything lighter feels like chinos, anything heavier is a commitment.",
                    "score": 1203,
                    "date": "4 months ago",
                },
                {
                    "source": "r/malefashionadvice",
                    "text": "Grey selvedge is criminally underrated. Way more versatile than indigo for daily wear, pairs with everything.",
                    "score": 891,
                    "date": "2 months ago",
                },
                {
                    "source": "r/rawdenim",
                    "text": "Just because a brand uses Japanese fabric doesn't mean the construction is good. Check the stitching, the rivets, the chain stitch hem.",
                    "score": 567,
                    "date": "5 months ago",
                },
            ],
        },
    },
}

MOCK_INDIVIDUAL_RESPONSE = {
    "persona": "sophie",
    "response_text": (
        "Sage green linen blazer at £89 — honestly, my first reaction is "
        "\"haven't I seen this everywhere already?\" COS did their oversized "
        "linen blazer in a similar sage last spring and it went to sale within "
        "six weeks. The silhouette is safe, which is fine, but at that price "
        "you're competing directly with Arket and & Other Stories who are doing "
        "the same thing with better fabric weight. If you're going to do linen "
        "at this price, the colour needs to be unexpected — a tobacco or a "
        "washed terracotta would feel more current right now. I'd probably "
        "scroll past this one."
    ),
    "purchase_intent": 4,
    "key_concern": "Colour saturation",
    "referenced_sources": [
        {
            "source": "r/femalefashionadvice",
            "text": "COS linen blazer was a total disappointment — the fabric was so thin you could see through it.",
            "score": 847,
        },
        {
            "source": "r/femalefashionadvice",
            "text": "Is anyone else over sage green? Every brand has done it to death.",
            "score": 623,
        },
    ],
}

MOCK_PANEL_RESPONSE = {
    "question": "What do you think about a relaxed-fit linen blazer in sage green, priced at £89, targeting women 25–32 as a COS/Arket competitor?",
    "responses": [
        {
            "persona": "sophie",
            "name": "Sophie",
            "age": 26,
            "style_descriptor": "Trend-forward",
            "response_text": (
                "Sage green linen at £89 — I've literally seen this exact product on every "
                "mid-range brand's lookbook this season. COS did it, Arket did it, & Other "
                "Stories did it. Unless the cut or detailing is genuinely different, this "
                "disappears on the rail. The silhouette is fine but \"relaxed linen blazer\" "
                "isn't a concept anymore, it's a commodity. I'd need to see something "
                "unexpected to stop scrolling."
            ),
            "purchase_intent": 4,
            "key_concern": "Market saturation",
        },
        {
            "persona": "priya",
            "name": "Priya",
            "age": 31,
            "style_descriptor": "Value seeker",
            "response_text": (
                "I actually like the concept — a linen blazer is exactly what I need for "
                "the office when it gets warmer. But £89 for linen makes me cautious. I've "
                "bought linen at that price before and the quality was terrible — too sheer, "
                "wrinkled horribly, lost its shape after two washes. If this is a linen-cotton "
                "blend with decent construction, I'm interested. If it's pure linen at that "
                "price I'd assume it's thin. I'd need to see fabric composition and reviews "
                "before purchasing."
            ),
            "purchase_intent": 6,
            "key_concern": "Fabric quality at price point",
        },
        {
            "persona": "emma",
            "name": "Emma",
            "age": 34,
            "style_descriptor": "Luxury adjacent",
            "response_text": (
                "At £89, this sits in an awkward middle ground for me. It's too expensive to "
                "be an impulse buy from Zara, but not expensive enough to compete with the "
                "Arket or Totême pieces I'd actually keep for five years. The colour is played "
                "out in this segment. If you're positioning against COS, you need either "
                "significantly better fabric or a genuine design detail they don't offer. A "
                "half-lined construction with a contrast interior would make me look twice."
            ),
            "purchase_intent": 3,
            "key_concern": "Undifferentiated positioning",
        },
        {
            "persona": "diane",
            "name": "Diane",
            "age": 52,
            "style_descriptor": "Elevated classic",
            "response_text": (
                "Relaxed fit in sage green could work beautifully if the proportions are right. "
                "My concern with \"relaxed\" at this price point is that it means shapeless — "
                "I want ease of movement, not a box. The colour is fine for my wardrobe, it "
                "goes with navy trousers and cream. At £89 from a brand I don't know, I'd "
                "need to try it in person. But the targeting at \"25–32\" would put me off "
                "immediately. I'm 52, I'd buy this blazer, and your marketing will make me "
                "feel excluded."
            ),
            "purchase_intent": 5,
            "key_concern": "Narrow age targeting",
        },
    ],
    "summary": {
        "consensus": "Panel is lukewarm. The product concept is seen as undifferentiated in a crowded market. Colour choice (sage green) is widely considered overplayed. Price point creates quality expectations that must be met. Age-targeted marketing risks alienating viable older customers.",
        "avg_intent": 4.5,
        "top_concerns": [
            "Market saturation",
            "Fabric quality at price point",
            "Undifferentiated positioning",
            "Narrow age targeting",
        ],
        "recommendation": "Consider a less saturated colour (tobacco, terracotta) and emphasise fabric quality and construction details to differentiate from COS/Arket. Broaden marketing beyond the 25–32 demographic.",
    },
}

MOCK_CREATED_PERSONA = {
    "slug": "mia",
    "name": "Mia",
    "age": 28,
    "location": "East London",
    "income": "£32–38K",
    "style_descriptor": "Quiet luxury on a budget",
    "profile": {
        "shopping_behaviour": "Shops strategically: invests in footwear as statement pieces while keeping basics functional and affordable. Gets most fashion inspiration from TikTok and Pinterest.",
        "personality": "Budget-conscious creative professional navigating the tension between quiet luxury aspirations and high-street reality. Sharp eye for quality within her price range.",
        "style_identity": "Quiet luxury on a budget. Scandi-minimalist with vintage accents. Can spot the difference between COS and Totême at twenty paces but will always buy the COS version.",
    },
    "data_sources": {
        "summary": "Grounded in 1,923 discourse fragments",
        "sources": [],
    },
    "corpus_stats": {
        "total_chunks": 1923,
        "sources_used": 3,
    },
    "preview_description": (
        "A budget-conscious creative professional navigating the tension between quiet "
        "luxury aspirations and high-street reality. She's deeply online — her taste is "
        "shaped by TikTok micro-trends and Pinterest mood boards — but she's developed a "
        "sharp eye for quality within her price range. Shops strategically: invests in "
        "footwear as statement pieces while keeping basics functional and affordable. "
        "Sustainability is a genuine value but not a dealbreaker when something good is on "
        "sale. She's the person who can spot the difference between COS and Totême at twenty "
        "paces but will always buy the COS version."
    ),
    "preview_attributes": {
        "age_location": "28 · East London",
        "income": "£32–38K",
        "key_brands": "COS, Weekday, Arket, vintage, Depop",
        "style_identity": "Quiet luxury on a budget · Scandi-minimalist with vintage accents",
        "shopping_triggers": "TikTok virality, end-of-season sales, unique footwear, vintage finds",
        "pain_points": "Quality inconsistency at mid-range, sustainability guilt, fast fashion temptation",
    },
}


# ── Endpoints ───────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok", "personas_loaded": 9, "total_chunks": 24500}


@app.get("/api/personas")
async def list_personas():
    return PERSONAS


@app.get("/api/personas/{slug}")
async def get_persona(slug: str):
    return PROFILES.get(slug, PROFILES["sophie"])


@app.post("/api/personas/create")
async def create_persona(req: CreatePersonaRequest):
    return MOCK_CREATED_PERSONA


@app.post("/api/chat/individual")
async def chat_individual(req: IndividualChatRequest):
    return MOCK_INDIVIDUAL_RESPONSE


@app.post("/api/chat/panel")
async def chat_panel(req: PanelChatRequest):
    return MOCK_PANEL_RESPONSE

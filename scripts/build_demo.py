"""
Full demo build script — pre-builds all 9 personas from scraped data.

Usage:
    python scripts/build_demo.py              # build all 9
    python scripts/build_demo.py sophie jordan # build specific ones
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.personas.creator import create_persona

# Demo persona descriptions — these drive the source routing + profile generation
DEMO_PERSONAS = {
    "sophie": "A 26-year-old trend-forward early adopter in London earning £45,000. Follows TikTok trends, shops Zara, COS, & Other Stories. Returns about 30% of online purchases. Enthusiastic but critical — excited by newness but burned by poor quality. Minimalist-leaning with trend accents, quiet luxury aspirant on a high-street budget.",
    "priya": "A 31-year-old research-driven value seeker in Manchester earning £38,000. Compares across brands, never pays full price. Core quality over trend. Checks reviews obsessively before purchasing. Shops M&S, Next, end-of-season sales at COS and Arket.",
    "marcus": "A 22-year-old student in Birmingham who is a Depop regular. Into streetwear — Supreme, Palace, Nike. Follows drops, resells. Budget is flexible if the hype is right. Lives on TikTok and Instagram for fashion discovery.",
    "emma": "A 34-year-old capsule wardrobe curator in Edinburgh earning £65,000. Invests in fewer, better pieces. Aspiring to luxury, lives at Arket and COS price point. Scandi-minimalist aesthetic. Values fabric quality and timeless silhouettes.",
    "aisha": "A 19-year-old Gen Z student in South London on a gap year. TikTok-first discovery. Sustainability aspirant on a student budget. Shops Shein but conflicted about it. Impulse buyer driven by social media trends.",
    "diane": "A 52-year-old brand loyal woman in Surrey earning £58,000. Sticks to what she knows — M&S, John Lewis, occasional splurge on heritage British brands. Values quality and consistency. Elevated classic style.",
    "jordan": "A 24-year-old archive collector in East London earning £30,000. Buys secondhand first — Grailed, Depop, vintage stores in Brick Lane. Deep knowledge of fabric and construction. Japanese workwear meets London vintage. Anti-fast fashion. Active on raw denim communities.",
    "raj": "A 29-year-old smart-casual office worker in Leeds earning £42,000. Buys coordinated sets. Shops M&S, Next, occasional Ted Baker. Practicality over statement. Needs clothes that work for office and weekend.",
    "tom": "A 37-year-old workwear heritage enthusiast in Bristol earning £55,000. Heavy fabrics, Barbour, Filson, Red Wing. Heritage over fashion. Buys once, keeps forever. Values patina and durability.",
}


async def build_persona(slug: str, description: str) -> dict | None:
    """Build a single persona and return the result."""
    display_name = slug.capitalize()
    print(f"\n{'='*60}")
    print(f"Building persona: {display_name} (slug={slug})")
    print(f"{'='*60}")
    try:
        result = await create_persona(description, forced_name=display_name, forced_slug=slug)
        print(f"SUCCESS: {display_name} — {result.get('corpus_stats', {}).get('total_chunks', 0)} chunks")
        return result
    except Exception as e:
        print(f"FAILED: {display_name} — {e}")
        return None


async def main(names: list[str] | None = None):
    targets = names or list(DEMO_PERSONAS.keys())
    print(f"=== SynMuse Demo Builder ===")
    print(f"Building {len(targets)} personas: {', '.join(targets)}")

    results = {}
    for name in targets:
        desc = DEMO_PERSONAS.get(name)
        if not desc:
            print(f"WARNING: No description for '{name}', skipping")
            continue
        result = await build_persona(name, desc)
        if result:
            results[name] = result

    print(f"\n{'='*60}")
    print(f"=== Build Complete ===")
    print(f"Successfully built: {len(results)}/{len(targets)}")
    for name, r in results.items():
        stats = r.get("corpus_stats", {})
        print(f"  {name}: {stats.get('total_chunks', 0)} chunks, slug='{r.get('slug', '?')}'")


if __name__ == "__main__":
    names = sys.argv[1:] if len(sys.argv) > 1 else None
    asyncio.run(main(names))

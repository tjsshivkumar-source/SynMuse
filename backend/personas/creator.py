"""Full persona creation pipeline — orchestrates the end-to-end flow."""

import json

from backend.config import RAW_DIR, PERSONA_PROFILES_DIR
from backend.scraper.source_router import route_sources
from backend.scraper.article_loader import load_articles
from backend.processing.chunker import chunk_documents
from backend.processing.extractor import extract_metadata
from backend.vectorstore.embedder import embed_chunks
from backend.vectorstore.collection_manager import (
    add_chunks,
    save_profile,
    get_collection_stats,
)
from backend.personas.profile_generator import generate_profile


def _load_raw_data(subreddits: list[str]) -> list[dict]:
    """Load all raw scraped data for the given subreddits."""
    items: list[dict] = []
    if not RAW_DIR.exists():
        return items

    for f in sorted(RAW_DIR.glob("*.json")):
        # Match subreddit name from filename (e.g. femalefashionadvice_20260306_142954.json)
        fname = f.stem.lower()
        for sub in subreddits:
            if fname.startswith(sub.lower()):
                try:
                    data = json.loads(f.read_text())
                    if isinstance(data, list):
                        items.extend(data)
                except (json.JSONDecodeError, Exception):
                    continue
                break

    return items


def _filter_by_keywords(items: list[dict], keywords: list[str]) -> list[dict]:
    """Filter items to those containing any of the keywords."""
    if not keywords:
        return items
    kw_lower = [k.lower() for k in keywords]
    filtered = []
    for item in items:
        text = f"{item.get('title', '')} {item.get('body', '')}".lower()
        if any(k in text for k in kw_lower):
            filtered.append(item)
    # If filter is too aggressive, return all items
    return filtered if len(filtered) >= 50 else items


def _articles_to_raw_items(articles: list[dict]) -> list[dict]:
    """Convert article dicts to the same format as scraped Reddit items."""
    items = []
    for a in articles:
        items.append({
            "id": a.get("url", ""),
            "title": a.get("title", ""),
            "body": a.get("text", ""),
            "score": 100,  # Give articles a moderate base score
            "num_comments": 0,
            "created_utc": 0,
            "subreddit": a.get("publication", "article"),
            "url": a.get("url", ""),
            "author": a.get("publication", ""),
            "is_comment": False,
            "parent_id": None,
        })
    return items


async def create_persona(description: str, live_scrape: bool = False, forced_name: str | None = None, forced_slug: str | None = None) -> dict:
    """
    Full persona creation pipeline.

    1. Route sources (Haiku)
    2. Load/filter pre-scraped data + articles
    3. Chunk documents
    4. Extract metadata (Haiku tagging)
    5. Embed chunks (OpenAI)
    6. Store in ChromaDB
    7. Generate profile (Sonnet)
    8. Save profile
    9. Return result

    Args:
        description: Natural language persona description
        live_scrape: If True, scrape fresh data (not used for demo — filter from corpus)

    Returns:
        Full persona profile + corpus stats
    """
    print(f"[Creator] Starting persona creation...")
    print(f"[Creator] Description: {description[:100]}...")

    # 1. Route sources
    print("[Creator] Step 1: Routing sources...")
    routing = route_sources(description)
    print(f"[Creator] Routed to subreddits: {routing['subreddits']}, tags: {routing.get('article_tags', [])}")

    # 2. Load raw data (live_scrape not used for demo — always filter from corpus)
    print(f"[Creator] Step 2: Loading raw data... (live_scrape={live_scrape})")
    raw_items = _load_raw_data(routing["subreddits"])
    print(f"[Creator] Loaded {len(raw_items)} raw items from scraped data")

    # Load articles
    articles = load_articles(
        tags=routing.get("article_tags"),
        keywords=routing.get("keywords"),
    )
    raw_items.extend(_articles_to_raw_items(articles))
    print(f"[Creator] Added {len(articles)} article excerpts, total: {len(raw_items)} items")

    # Filter by keywords for relevance
    raw_items = _filter_by_keywords(raw_items, routing.get("keywords", []))
    print(f"[Creator] After keyword filtering: {len(raw_items)} items")

    # 3. Chunk
    print("[Creator] Step 3: Chunking documents...")
    chunks = chunk_documents(raw_items)
    print(f"[Creator] Created {len(chunks)} chunks")

    # 4. Extract metadata
    print("[Creator] Step 4: Extracting metadata (Haiku)...")
    chunks = extract_metadata(chunks)

    # 5. Embed
    print("[Creator] Step 5: Embedding chunks (OpenAI)...")
    chunks = embed_chunks(chunks)

    # 6. Generate profile (use top chunks by score for context)
    print("[Creator] Step 6: Generating profile (Sonnet)...")
    top_chunks = sorted(chunks, key=lambda c: c.get("score", 0), reverse=True)[:30]
    profile = generate_profile(description, top_chunks)
    # Override name/slug if forced (for demo personas with known names)
    if forced_name:
        profile["name"] = forced_name
    if forced_slug:
        profile["slug"] = forced_slug
    else:
        profile["slug"] = profile.get("name", "persona").lower().replace(" ", "_")
    slug = profile["slug"]

    # 7. Store in ChromaDB
    print(f"[Creator] Step 7: Storing {len(chunks)} chunks in ChromaDB collection '{slug}'...")
    added = add_chunks(slug, chunks)
    print(f"[Creator] Added {added} chunks to collection")

    # 8. Save profile
    save_profile(slug, profile)

    # Save profile JSON to disk too
    PERSONA_PROFILES_DIR.mkdir(parents=True, exist_ok=True)
    profile_path = PERSONA_PROFILES_DIR / f"{slug}.json"
    profile_path.write_text(json.dumps(profile, indent=2, ensure_ascii=False))
    print(f"[Creator] Saved profile to {profile_path}")

    # 9. Build response
    stats = get_collection_stats(slug)
    result = {
        **profile,
        "data_sources": {
            "summary": f"Grounded in {stats['total_chunks']} discourse fragments from {len(stats.get('sources', {}))} sources",
            "sources": [],
        },
        "corpus_stats": stats,
    }

    print(f"[Creator] Done! Persona '{profile.get('name', slug)}' created with {stats['total_chunks']} chunks")
    return result

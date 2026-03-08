"""Loads pre-scraped articles + live web search for snippets."""

import json
import re
from typing import Any

import httpx

from backend.config import ARTICLES_DIR

# Pre-built fashion article excerpts (baseline corpus)
BASELINE_ARTICLES = [
    {
        "title": "The Rise of Quiet Luxury",
        "publication": "Vogue",
        "date": "2025-09-15",
        "text": "The quiet luxury movement has shifted from runway curiosity to high-street reality. Brands like COS, Arket, and Uniqlo U are capitalising on consumers who want the look of Loro Piana without the price tag. The key differentiator is fabric quality — shoppers are increasingly educated about materials, checking composition labels before purchase. Cotton-cashmere blends, heavyweight jersey, and properly finished seams are the new status symbols for a generation that grew up on fast fashion and wants out.",
        "url": "https://www.vogue.co.uk/article/quiet-luxury-high-street",
        "tags": ["womenswear", "luxury", "trend", "minimalist", "high-street"],
    },
    {
        "title": "Why Gen Z Is Driving the Secondhand Revolution",
        "publication": "Elle",
        "date": "2025-11-02",
        "text": "Depop's latest data shows 73% of its active users are under 26, and they're not just buying — they're curating. The average Gen Z consumer on the platform follows over 200 sellers and checks the app daily. But it's not purely about sustainability. Price sensitivity, the thrill of the hunt, and the desire for unique pieces that won't appear on everyone at the pub drive behaviour. Vintage denim, 90s archive pieces, and obscure brand collaborations command premium prices, sometimes exceeding retail.",
        "url": "https://www.elle.com/uk/fashion/articles/gen-z-secondhand",
        "tags": ["streetwear", "vintage", "sustainable", "budget", "menswear", "womenswear"],
    },
    {
        "title": "Raw Denim in 2025: The Cult That Won't Die",
        "publication": "GQ",
        "date": "2025-08-20",
        "text": "The raw denim community remains one of fashion's most passionate niches. Forums like r/rawdenim and dedicated Instagram accounts track fading progress with almost scientific precision. Japanese mills — Kuroki, Collect, Nihon Menpu — command the highest respect, while brands like Iron Heart, The Flat Head, and Studio D'Artisan maintain cult followings. The entry-level price point has shifted upward: consumers now expect to spend £150-250 for a quality pair, with premium options exceeding £400. Weight matters — 14oz is considered mid-weight, with serious enthusiasts gravitating toward 18-21oz fabrics that take years to break in.",
        "url": "https://www.gq-magazine.co.uk/article/raw-denim-guide",
        "tags": ["denim", "menswear", "workwear", "vintage"],
    },
    {
        "title": "The Return of British Heritage Brands",
        "publication": "Highsnobiety",
        "date": "2025-10-10",
        "text": "Barbour, Grenson, and Private White V.C. are experiencing a renaissance among younger consumers who previously wouldn't have considered heritage brands. The appeal is authenticity and durability — a waxed Barbour jacket develops a patina that fast fashion simply can't replicate. Social media has accelerated this, with TikTok videos showing 20-year-old Barbour rewaxing rituals accumulating millions of views. The crossover between workwear heritage and contemporary streetwear creates a new aesthetic category that doesn't map neatly onto traditional fashion segments.",
        "url": "https://www.highsnobiety.com/p/british-heritage-brands-revival",
        "tags": ["workwear", "menswear", "vintage", "high-street"],
    },
    {
        "title": "M&S Clothing: How Middle Britain's Favourite Store Got Cool Again",
        "publication": "The Guardian",
        "date": "2025-07-12",
        "text": "Marks & Spencer's clothing division has posted its seventh consecutive quarter of growth, driven by a strategy that finally acknowledges what its core customer actually wants: well-made basics at sensible prices, with enough trend awareness to feel current without trying too hard. The Autograph line bridges the gap between high-street and premium, while everyday essentials compete directly with Uniqlo on quality. The brand's strength lies in its breadth — from workwear to weekend, knitwear to occasion dressing — and a loyalty base that spans generations.",
        "url": "https://www.theguardian.com/fashion/ms-clothing-revival",
        "tags": ["high-street", "womenswear", "menswear", "budget"],
    },
    {
        "title": "Linen: Fashion's Most Sustainable Summer Fabric",
        "publication": "Vogue",
        "date": "2025-06-01",
        "text": "Linen's sustainability credentials are driving increased adoption across price points. Flax requires significantly less water than cotton and thrives without pesticides in European climates. But consumer complaints persist: wrinkling remains the top concern, with social media full of posts about linen pieces looking 'sad' after an hour of wear. Brands addressing this — through linen-cotton blends, pre-washed finishes, or innovative weaving techniques — are seeing higher sell-through rates. Price expectations vary wildly: fast fashion offers linen-look polyester blends at £20, while quality 100% linen commands £80-150.",
        "url": "https://www.vogue.co.uk/article/linen-sustainable-fashion",
        "tags": ["womenswear", "sustainable", "high-street", "luxury", "trend"],
    },
    {
        "title": "Streetwear Is Dead, Long Live Streetwear",
        "publication": "Highsnobiety",
        "date": "2025-12-05",
        "text": "The hype-driven streetwear model — limited drops, bot-powered purchases, instant resale markups — is showing cracks. Supreme's post-acquisition output has disappointed purists, while Palace's cultural cachet depends increasingly on its skate authenticity. New brands like Corteiz and Broken Planet have captured Gen Z attention by inverting the model: community-driven, anti-establishment, and deliberately chaotic distribution. The consumer has evolved from passive brand follower to active participant who demands narrative, exclusivity, and cultural credibility from the labels they support.",
        "url": "https://www.highsnobiety.com/p/streetwear-dead-evolution",
        "tags": ["streetwear", "menswear", "trend"],
    },
    {
        "title": "The Price Transparency Revolution in Fashion",
        "publication": "Business of Fashion",
        "date": "2025-09-28",
        "text": "Everlane pioneered it, but radical price transparency is now spreading across the mid-market. Consumers armed with TikTok fabric analysis videos can identify when a £60 'premium' shirt uses the same poly-cotton as a £15 Primark version. This educated consumer forces brands to justify their margins through genuine quality differentiators: better construction, ethical manufacturing, superior fabric hand-feel. The brands winning this game — Asket, Isto, Nudie Jeans — publish their full cost breakdowns and factory locations, turning transparency into a competitive advantage.",
        "url": "https://www.businessoffashion.com/articles/price-transparency-fashion",
        "tags": ["sustainable", "high-street", "menswear", "womenswear", "budget"],
    },
]


def load_articles(tags: list[str] | None = None, keywords: list[str] | None = None) -> list[dict[str, Any]]:
    """
    Load articles from pre-scraped baseline + any saved JSON in data/articles/.

    Filters by tags if provided. Keywords filter against title + text.
    """
    articles = list(BASELINE_ARTICLES)

    # Load any additional articles from disk
    if ARTICLES_DIR.exists():
        for f in ARTICLES_DIR.glob("*.json"):
            try:
                data = json.loads(f.read_text())
                if isinstance(data, list):
                    articles.extend(data)
                elif isinstance(data, dict):
                    articles.append(data)
            except (json.JSONDecodeError, Exception):
                continue

    # Filter by tags
    if tags:
        tag_set = set(t.lower() for t in tags)
        articles = [a for a in articles if tag_set & set(t.lower() for t in a.get("tags", []))]

    # Filter by keywords
    if keywords:
        kw_lower = [k.lower() for k in keywords]
        filtered = []
        for a in articles:
            haystack = f"{a.get('title', '')} {a.get('text', '')}".lower()
            if any(k in haystack for k in kw_lower):
                filtered.append(a)
        if filtered:
            articles = filtered

    return articles


async def search_articles(query: str, max_results: int = 5) -> list[dict[str, Any]]:
    """
    Live web search for fashion article snippets via DuckDuckGo HTML.

    Returns list of dicts with: title, publication, date, text, url, tags
    """
    results: list[dict[str, Any]] = []

    try:
        async with httpx.AsyncClient(
            headers={"User-Agent": "synmuse-research/1.0"},
            timeout=10.0,
            follow_redirects=True,
        ) as client:
            resp = await client.get(
                "https://html.duckduckgo.com/html/",
                params={"q": f"{query} fashion site:reddit.com OR site:vogue.co.uk OR site:gq-magazine.co.uk"},
            )
            if resp.status_code != 200:
                return results

            text = resp.text
            links = re.findall(r'<a[^>]+href="([^"]+)"[^>]*class="result__a"[^>]*>([^<]+)</a>', text)
            snippets = re.findall(r'<a[^>]+class="result__snippet"[^>]*>(.+?)</a>', text, re.DOTALL)

            for i, (url, title) in enumerate(links[:max_results]):
                snippet = snippets[i] if i < len(snippets) else ""
                snippet = re.sub(r'<[^>]+>', '', snippet).strip()
                if snippet:
                    results.append({
                        "title": title.strip(),
                        "publication": "Web",
                        "date": "",
                        "text": snippet,
                        "url": url,
                        "tags": [],
                    })
    except Exception:
        pass

    return results

"""Given persona description -> which sources to scrape/filter."""

import json

import anthropic

from backend.config import ANTHROPIC_API_KEY, HAIKU_MODEL, AVAILABLE_SUBREDDITS

ROUTER_PROMPT = """You are a source routing system for a consumer research platform.
Given a persona description, determine which Reddit subreddits and article categories
are most relevant for building this persona's profile.

Available subreddits (ONLY pick from these):
{subreddits}

Available article tags: womenswear, menswear, high-street, luxury, trend, minimalist,
streetwear, workwear, vintage, denim, sustainable, budget, plus-size, accessories

Return a JSON object with exactly these keys:
- "subreddits": list of 2-4 relevant subreddit names from the available list
- "article_tags": list of 3-5 relevant article tags
- "keywords": list of 5-8 search keywords relevant to this persona (brands, styles, price points)

Return ONLY valid JSON, no other text."""


def route_sources(persona_description: str) -> dict:
    """
    Call Claude Haiku to map a persona description to relevant sources.

    Returns: {"subreddits": [...], "article_tags": [...], "keywords": [...]}
    """
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    response = client.messages.create(
        model=HAIKU_MODEL,
        max_tokens=500,
        messages=[
            {
                "role": "user",
                "content": ROUTER_PROMPT.format(subreddits=", ".join(AVAILABLE_SUBREDDITS))
                + f"\n\nPersona description: {persona_description}",
            }
        ],
    )

    text = response.content[0].text.strip()
    # Extract JSON from response (handle markdown code blocks)
    if "```" in text:
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

    result = json.loads(text)

    # Validate subreddits are from available list
    result["subreddits"] = [s for s in result.get("subreddits", []) if s in AVAILABLE_SUBREDDITS]
    if not result["subreddits"]:
        result["subreddits"] = AVAILABLE_SUBREDDITS[:2]

    return result

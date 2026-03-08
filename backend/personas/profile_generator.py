"""LLM call to generate persona profile from description + top chunks."""

import json

import anthropic

from backend.config import ANTHROPIC_API_KEY, SONNET_MODEL

PROFILE_PROMPT = """You are building a synthetic consumer persona for a fashion brand research platform.

Given the user's description of a target consumer and real discourse data from Reddit and fashion publications,
generate a detailed, realistic consumer profile.

USER DESCRIPTION:
{description}

REAL CONSUMER DISCOURSE (top posts/comments by relevance):
{chunks}

Generate a JSON profile with these exact fields:
{{
  "name": "A realistic first name for this persona",
  "age": <integer>,
  "location": "City/area in UK",
  "income": "Estimated income as string (e.g. '£45,000' or '£30-35K')",
  "style_descriptor": "2-4 word style label (e.g. 'Trend-forward early adopter')",
  "profile": {{
    "shopping_behaviour": "1-2 concise sentences about how they shop, which stores/platforms, return habits. Max 40 words.",
    "personality": "1-2 concise sentences about their consumer personality, what excites/frustrates them. Max 40 words.",
    "style_identity": "1-2 concise sentences about their aesthetic, brand preferences, wardrobe approach. Max 40 words."
  }},
  "preview_description": "A concise 2-3 sentence paragraph describing this consumer. Reference specific brands and attitudes. Max 60 words.",
  "preview_attributes": {{
    "age_location": "age · location",
    "income": "income string",
    "key_brands": "comma-separated list of 4-6 brands they shop",
    "style_identity": "concise style description",
    "shopping_triggers": "what makes them buy",
    "pain_points": "what frustrates them about fashion shopping"
  }}
}}

Ground the persona in the real discourse above. Reference specific brands, products, price points,
and opinions that appear in the data. Make the persona feel like a real person, not a marketing segment.

Return ONLY valid JSON, no other text."""


def generate_profile(description: str, top_chunks: list[dict]) -> dict:
    """
    Generate a full persona profile using Claude Sonnet.

    Args:
        description: User's natural language persona description
        top_chunks: Most relevant/upvoted chunks from scraped data

    Returns:
        Full persona profile dict
    """
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    chunks_text = "\n\n".join(
        f"[{c.get('source', 'unknown')} | score: {c.get('score', 0)}]\n{c['text']}"
        for c in top_chunks[:30]
    )

    response = client.messages.create(
        model=SONNET_MODEL,
        max_tokens=1500,
        messages=[{
            "role": "user",
            "content": PROFILE_PROMPT.format(
                description=description,
                chunks=chunks_text,
            ),
        }],
    )

    text = response.content[0].text.strip()
    if "```" in text:
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

    profile = json.loads(text)

    # Generate slug from name
    name = profile.get("name", "persona")
    profile["slug"] = name.lower().replace(" ", "_")

    return profile

"""Individual + panel chat generation."""

import asyncio
import json

import anthropic

from backend.config import ANTHROPIC_API_KEY, HAIKU_MODEL
from backend.vectorstore.collection_manager import get_profile
from backend.vectorstore.retriever import query

PERSONA_SYSTEM_PROMPT = """You are {name}, a {age}-year-old {style_identity} based in {location}.

PROFILE:
{profile_json}

REAL CONSUMER DISCOURSE (from Reddit and fashion publications):
{chunks}

INSTRUCTIONS:
- Respond as this specific consumer. First person, conversational tone.
- Ground opinions in the real discourse above. Reference specific brands, products, prices.
- Be specific and opinionated. Real consumers have strong views.
- Include concrete details: fabric weights, competing products, price comparisons.
- Keep response 150-250 words.

RESPONSE FORMAT (return ONLY valid JSON):
{{
  "response_text": "Your 150-250 word response as this consumer",
  "purchase_intent": <1-10 integer>,
  "key_concern": "2-4 word concern summary",
  "referenced_sources": [
    {{"source": "r/subreddit or publication", "text": "brief excerpt you referenced", "score": 0}}
  ]
}}"""

SUMMARY_PROMPT = """You are a consumer research analyst. Given a product question and responses from a panel of synthetic consumers, write a brief analysis.

QUESTION: {question}

RESPONSES:
{responses}

Return ONLY valid JSON:
{{
  "consensus": "2-3 sentence summary of overall panel sentiment",
  "avg_intent": <float, average of all purchase_intent scores>,
  "top_concerns": ["concern 1", "concern 2", "concern 3"],
  "recommendation": "1-2 sentence actionable recommendation for the brand"
}}"""


def _format_chunks(chunks: list[dict]) -> str:
    """Format retrieved chunks for the prompt."""
    lines = []
    for c in chunks:
        source = c.get("source", "unknown")
        score = c.get("score", 0)
        lines.append(f"[{source} | score: {score}]\n{c['text']}")
    return "\n\n".join(lines)


async def generate_individual_response(
    persona_slug: str,
    question: str,
    chat_history: list | None = None,
) -> dict:
    """
    Generate a single persona's response to a product question.

    Uses RAG: retrieves relevant chunks from persona's ChromaDB collection,
    then prompts Claude Sonnet with persona profile + chunks + question.
    """
    # Load profile
    profile = get_profile(persona_slug)
    if not profile:
        return {
            "persona": persona_slug,
            "response_text": f"I don't have enough data to respond as {persona_slug}.",
            "purchase_intent": 5,
            "key_concern": "No data",
            "referenced_sources": [],
        }

    # Retrieve relevant chunks
    chunks = query(persona_slug, question, n_results=8)
    chunks_text = _format_chunks(chunks)

    # Build system prompt — only include relevant profile fields
    slim_profile = {k: profile[k] for k in ("name", "age", "location", "income", "style_descriptor", "profile") if k in profile}
    profile_json = json.dumps(slim_profile, indent=2, ensure_ascii=False)
    style_identity = profile.get("profile", {}).get("style_identity", profile.get("style_descriptor", ""))

    system = PERSONA_SYSTEM_PROMPT.format(
        name=profile.get("name", persona_slug),
        age=profile.get("age", ""),
        style_identity=style_identity,
        location=profile.get("location", ""),
        profile_json=profile_json,
        chunks=chunks_text,
    )

    # Call Claude
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    messages = []
    # Add chat history if provided
    for msg in (chat_history or []):
        role = "user" if msg.get("type") == "user" else "assistant"
        messages.append({"role": role, "content": msg.get("text", "")})
    messages.append({"role": "user", "content": question})

    response = client.messages.create(
        model=HAIKU_MODEL,
        max_tokens=800,
        system=system,
        messages=messages,
    )

    text = response.content[0].text.strip()
    if "```" in text:
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

    try:
        result = json.loads(text)
    except json.JSONDecodeError:
        result = {
            "response_text": text,
            "purchase_intent": 5,
            "key_concern": "Parse error",
            "referenced_sources": [],
        }

    result["persona"] = persona_slug
    result["name"] = profile.get("name", persona_slug)
    result["age"] = profile.get("age", "")
    result["style_descriptor"] = style_identity
    return result


async def generate_panel_responses(persona_slugs: list[str], question: str) -> dict:
    """
    Generate responses from multiple personas concurrently, plus a summary.
    """
    tasks = [generate_individual_response(slug, question) for slug in persona_slugs]
    responses = await asyncio.gather(*tasks)

    # Generate summary
    summary = await _generate_summary(question, responses)

    return {
        "question": question,
        "responses": responses,
        "summary": summary,
    }


async def _generate_summary(question: str, responses: list[dict]) -> dict:
    """Generate a panel summary from individual responses."""
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    responses_text = "\n\n".join(
        f"[{r.get('name', r.get('persona', '?'))} | Intent: {r.get('purchase_intent', '?')}/10 | Concern: {r.get('key_concern', '?')}]\n{r.get('response_text', '')}"
        for r in responses
    )

    response = client.messages.create(
        model=HAIKU_MODEL,
        max_tokens=500,
        messages=[{
            "role": "user",
            "content": SUMMARY_PROMPT.format(
                question=question,
                responses=responses_text,
            ),
        }],
    )

    text = response.content[0].text.strip()
    if "```" in text:
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        intents = [r.get("purchase_intent", 5) for r in responses]
        return {
            "consensus": "Mixed panel response. See individual responses for detail.",
            "avg_intent": sum(intents) / len(intents) if intents else 5,
            "top_concerns": [r.get("key_concern", "") for r in responses[:3]],
            "recommendation": "Review individual persona responses for specific insights.",
        }

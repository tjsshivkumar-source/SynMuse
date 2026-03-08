"""NLP extraction via Claude Haiku — chunk tagging with categories and sentiment."""

import json
from typing import Any

import anthropic

from backend.config import ANTHROPIC_API_KEY, HAIKU_MODEL

CATEGORIES = ["fit", "fabric", "colour", "price", "brand", "trend", "complaint", "praise"]
SENTIMENTS = ["positive", "negative", "neutral"]

EXTRACTION_PROMPT = """Classify each text chunk with a category and sentiment.

Categories: {categories}
Sentiments: {sentiments}

For each chunk, return a JSON array of objects with "index", "category", and "sentiment".
Pick the SINGLE most relevant category. Return ONLY valid JSON, no other text.

Chunks:
{chunks}"""

BATCH_SIZE = 20


def extract_metadata(chunks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Tag each chunk with category and sentiment using Claude Haiku.

    Processes in batches of BATCH_SIZE. Adds 'category' and 'sentiment' fields to each chunk.
    Returns the same list with added fields.
    """
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    result = list(chunks)

    for batch_start in range(0, len(result), BATCH_SIZE):
        batch = result[batch_start:batch_start + BATCH_SIZE]
        chunk_texts = "\n".join(
            f"[{i}] {c['text'][:300]}" for i, c in enumerate(batch)
        )

        try:
            response = client.messages.create(
                model=HAIKU_MODEL,
                max_tokens=1000,
                messages=[{
                    "role": "user",
                    "content": EXTRACTION_PROMPT.format(
                        categories=", ".join(CATEGORIES),
                        sentiments=", ".join(SENTIMENTS),
                        chunks=chunk_texts,
                    ),
                }],
            )

            text = response.content[0].text.strip()
            if "```" in text:
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()

            classifications = json.loads(text)
            for item in classifications:
                idx = item.get("index", -1)
                if 0 <= idx < len(batch):
                    cat = item.get("category", "brand")
                    sent = item.get("sentiment", "neutral")
                    batch[idx]["category"] = cat if cat in CATEGORIES else "brand"
                    batch[idx]["sentiment"] = sent if sent in SENTIMENTS else "neutral"

        except Exception as e:
            print(f"  Extraction batch error: {e}")

        # Fill defaults for any untagged chunks
        for c in batch:
            c.setdefault("category", "brand")
            c.setdefault("sentiment", "neutral")

    return result

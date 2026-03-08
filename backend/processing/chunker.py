"""Splits text into embeddable ~200 token chunks with metadata."""

import re
from typing import Any

# Rough approximation: 1 token ≈ 4 characters
CHARS_PER_TOKEN = 4
DEFAULT_CHUNK_SIZE = 200  # tokens
MIN_CHUNK_CHARS = 20


def _split_sentences(text: str) -> list[str]:
    """Split text into sentences on period/question/exclamation boundaries."""
    parts = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s.strip() for s in parts if s.strip()]


def chunk_text(text: str, chunk_size: int = DEFAULT_CHUNK_SIZE) -> list[str]:
    """Split text into chunks of approximately chunk_size tokens, breaking on sentence boundaries."""
    if not text or len(text.strip()) < MIN_CHUNK_CHARS:
        return []

    max_chars = chunk_size * CHARS_PER_TOKEN
    sentences = _split_sentences(text)
    chunks: list[str] = []
    current: list[str] = []
    current_len = 0

    for sentence in sentences:
        slen = len(sentence)
        if current_len + slen > max_chars and current:
            chunks.append(" ".join(current))
            current = [sentence]
            current_len = slen
        else:
            current.append(sentence)
            current_len += slen

    if current:
        joined = " ".join(current)
        if len(joined) >= MIN_CHUNK_CHARS:
            chunks.append(joined)

    return chunks


def chunk_documents(raw_items: list[dict[str, Any]], chunk_size: int = DEFAULT_CHUNK_SIZE) -> list[dict[str, Any]]:
    """
    Chunk a list of raw scraped items into embeddable pieces.

    Each raw item should have: id, title, body, score, subreddit, url, created_utc, is_comment
    Returns list of chunk dicts with: text, source, source_url, date, score, chunk_index, raw_text
    """
    all_chunks: list[dict[str, Any]] = []

    for item in raw_items:
        if item.get("is_comment"):
            full_text = (item.get("body") or "").strip()
            source_label = f"r/{item.get('subreddit', 'unknown')} comment"
        else:
            title = (item.get("title") or "").strip()
            body = (item.get("body") or "").strip()
            full_text = f"{title}\n\n{body}".strip() if body else title
            source_label = f"r/{item.get('subreddit', 'unknown')}"

        if len(full_text) < MIN_CHUNK_CHARS:
            continue

        text_chunks = chunk_text(full_text, chunk_size)

        for i, chunk_text_str in enumerate(text_chunks):
            all_chunks.append({
                "text": chunk_text_str,
                "source": source_label,
                "source_url": item.get("url", ""),
                "date": item.get("created_utc", 0),
                "score": item.get("score", 0),
                "chunk_index": i,
                "raw_text": chunk_text_str,
                "item_id": item.get("id", ""),
            })

    return all_chunks

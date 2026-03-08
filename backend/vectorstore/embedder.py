"""OpenAI embedding calls using text-embedding-3-small."""

from typing import Any

import openai

from backend.config import OPENAI_API_KEY, EMBEDDING_MODEL

BATCH_SIZE = 100


def get_embeddings(texts: list[str]) -> list[list[float]]:
    """Get embeddings for a list of texts from OpenAI."""
    client = openai.OpenAI(api_key=OPENAI_API_KEY)
    all_embeddings: list[list[float]] = []

    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i:i + BATCH_SIZE]
        response = client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=batch,
        )
        batch_embeddings = [item.embedding for item in response.data]
        all_embeddings.extend(batch_embeddings)

    return all_embeddings


def embed_chunks(chunks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Add 'embedding' field to each chunk dict.

    Calls OpenAI in batches of BATCH_SIZE.
    """
    texts = [c["text"] for c in chunks]
    embeddings = get_embeddings(texts)

    for chunk, emb in zip(chunks, embeddings):
        chunk["embedding"] = emb

    return chunks


def embed_query(query: str) -> list[float]:
    """Embed a single query string."""
    client = openai.OpenAI(api_key=OPENAI_API_KEY)
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=[query],
    )
    return response.data[0].embedding

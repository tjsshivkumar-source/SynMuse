"""RAG retrieval: query -> relevant chunks from persona collection."""

from typing import Any

from backend.vectorstore.embedder import embed_query
from backend.vectorstore.collection_manager import query_collection


def query(persona_slug: str, question: str, n_results: int = 15) -> list[dict[str, Any]]:
    """
    Embed the question and query the persona's ChromaDB collection.

    Returns ranked list of chunks with text, source, score, etc.
    """
    query_emb = embed_query(question)
    raw_results = query_collection(persona_slug, query_emb, n_results)

    # Format for prompt consumption
    chunks = []
    for r in raw_results:
        meta = r.get("metadata", {})
        chunks.append({
            "text": r["text"],
            "source": meta.get("source", ""),
            "source_url": meta.get("source_url", ""),
            "score": meta.get("score", 0),
            "date": meta.get("date", ""),
            "category": meta.get("category", ""),
            "sentiment": meta.get("sentiment", ""),
            "distance": r.get("distance", 0),
        })

    return chunks

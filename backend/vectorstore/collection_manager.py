"""Create/load/query per-persona ChromaDB collections."""

import json
from typing import Any

import chromadb

from backend.config import CHROMA_PERSIST_DIR

_client = None


def _get_client():
    """Lazy-init persistent ChromaDB client."""
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    return _client


def collection_name(persona_slug: str) -> str:
    return f"persona_{persona_slug}"


def create_collection(persona_slug: str) -> chromadb.Collection:
    """Create or get a collection for a persona."""
    client = _get_client()
    return client.get_or_create_collection(
        name=collection_name(persona_slug),
        metadata={"hnsw:space": "cosine"},
    )


def delete_collection(persona_slug: str) -> bool:
    """Delete a persona's ChromaDB collection. Returns True if deleted."""
    client = _get_client()
    try:
        client.delete_collection(collection_name(persona_slug))
        return True
    except Exception:
        return False


def add_chunks(persona_slug: str, chunks: list[dict[str, Any]]) -> int:
    """Insert chunks with embeddings + metadata into a persona's collection."""
    coll = create_collection(persona_slug)

    ids = []
    embeddings = []
    documents = []
    metadatas = []

    seen_ids: set[str] = set()
    for i, chunk in enumerate(chunks):
        base_id = f"{persona_slug}_{chunk.get('item_id', i)}_{chunk.get('chunk_index', i)}"
        chunk_id = base_id
        counter = 1
        while chunk_id in seen_ids:
            chunk_id = f"{base_id}_{counter}"
            counter += 1
        seen_ids.add(chunk_id)
        ids.append(chunk_id)
        embeddings.append(chunk["embedding"])
        documents.append(chunk["text"])
        metadatas.append({
            "source": chunk.get("source", ""),
            "source_url": chunk.get("source_url", ""),
            "date": str(chunk.get("date", "")),
            "score": int(chunk.get("score", 0)),
            "category": chunk.get("category", ""),
            "sentiment": chunk.get("sentiment", ""),
            "chunk_index": chunk.get("chunk_index", 0),
        })

    # ChromaDB has a batch limit of ~5000, insert in chunks
    batch = 500
    for start in range(0, len(ids), batch):
        end = start + batch
        coll.add(
            ids=ids[start:end],
            embeddings=embeddings[start:end],
            documents=documents[start:end],
            metadatas=metadatas[start:end],
        )

    return len(ids)


def save_profile(persona_slug: str, profile: dict) -> None:
    """Save persona profile as a special document in the collection."""
    from backend.vectorstore.embedder import embed_query
    coll = create_collection(persona_slug)
    profile_text = json.dumps(profile, ensure_ascii=False)
    # Embed with OpenAI to match collection's embedding dimension
    embedding = embed_query(profile_text[:8000])
    coll.upsert(
        ids=[f"{persona_slug}_profile"],
        embeddings=[embedding],
        documents=[profile_text],
        metadatas=[{"type": "profile"}],
    )


def get_profile(persona_slug: str) -> dict | None:
    """Retrieve the persona profile document from ChromaDB."""
    client = _get_client()
    try:
        coll = client.get_collection(collection_name(persona_slug))
    except Exception:
        return None

    results = coll.get(ids=[f"{persona_slug}_profile"])
    if results and results["documents"] and results["documents"][0]:
        return json.loads(results["documents"][0])
    return None


def list_personas() -> list[str]:
    """List all persona slugs that have collections."""
    client = _get_client()
    collections = client.list_collections()
    slugs = []
    for c in collections:
        name = c if isinstance(c, str) else c.name
        if name.startswith("persona_"):
            slugs.append(name.replace("persona_", "", 1))
    return slugs


def get_collection_stats(persona_slug: str) -> dict:
    """Get chunk count and source breakdown for a persona's collection."""
    client = _get_client()
    try:
        coll = client.get_collection(collection_name(persona_slug))
    except Exception:
        return {"total_chunks": 0, "sources": {}}

    count = coll.count()
    # Get a sample to determine sources
    results = coll.get(limit=min(count, 1000), include=["metadatas"])
    sources: dict[str, int] = {}
    for meta in (results.get("metadatas") or []):
        if meta and meta.get("type") != "profile":
            src = meta.get("source", "unknown")
            sources[src] = sources.get(src, 0) + 1

    return {"total_chunks": count, "sources": sources}


def query_collection(
    persona_slug: str,
    query_embedding: list[float],
    n_results: int = 15,
) -> list[dict[str, Any]]:
    """Query a persona's collection with a pre-computed embedding."""
    client = _get_client()
    try:
        coll = client.get_collection(collection_name(persona_slug))
    except Exception:
        return []

    # Request extra results to filter out the profile document
    results = coll.query(
        query_embeddings=[query_embedding],
        n_results=n_results + 1,
        include=["documents", "metadatas", "distances"],
    )

    chunks = []
    for i in range(len(results["ids"][0])):
        meta = results["metadatas"][0][i] if results["metadatas"] else {}
        # Skip the profile document
        if meta.get("type") == "profile":
            continue
        chunks.append({
            "text": results["documents"][0][i],
            "metadata": meta,
            "distance": results["distances"][0][i] if results["distances"] else 0,
        })

    return chunks[:n_results]

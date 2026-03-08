"""Reddit scraper using httpx against public JSON endpoints (no API key needed)."""

import asyncio
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Any

import httpx

from backend.config import RAW_DIR, REDDIT_USER_AGENT

BASE_URL = "https://www.reddit.com"
RATE_LIMIT_SECONDS = 2.0
DEFAULT_HEADERS = {
    "User-Agent": REDDIT_USER_AGENT,
    "Accept": "application/json",
}


async def _get_json(client: httpx.AsyncClient, url: str, params: dict | None = None) -> dict:
    """Fetch JSON from Reddit with rate limiting and retry on 429."""
    await asyncio.sleep(RATE_LIMIT_SECONDS)
    resp = await client.get(url, params=params or {})
    if resp.status_code == 429:
        retry_after = float(resp.headers.get("Retry-After", "5"))
        print(f"  Rate limited — waiting {retry_after}s")
        await asyncio.sleep(retry_after)
        resp = await client.get(url, params=params or {})
    resp.raise_for_status()
    return resp.json()


def _parse_post(post_data: dict) -> dict:
    """Extract fields from a Reddit post's JSON data."""
    d = post_data.get("data", post_data)
    return {
        "id": d.get("id", ""),
        "title": d.get("title", ""),
        "body": d.get("selftext", ""),
        "score": d.get("score", 0),
        "num_comments": d.get("num_comments", 0),
        "created_utc": d.get("created_utc", 0),
        "subreddit": d.get("subreddit", ""),
        "url": f"https://reddit.com{d.get('permalink', '')}",
        "author": d.get("author", ""),
        "is_comment": False,
        "parent_id": None,
    }


def _parse_comment(comment_data: dict, post_id: str) -> dict:
    """Extract fields from a Reddit comment's JSON data."""
    d = comment_data.get("data", comment_data)
    return {
        "id": d.get("id", ""),
        "title": "",
        "body": d.get("body", ""),
        "score": d.get("score", 0),
        "num_comments": 0,
        "created_utc": d.get("created_utc", 0),
        "subreddit": d.get("subreddit", ""),
        "url": f"https://reddit.com{d.get('permalink', '')}",
        "author": d.get("author", ""),
        "is_comment": True,
        "parent_id": post_id,
    }


def _extract_comments(children: list[dict], post_id: str, max_per_post: int = 10) -> list[dict]:
    """Recursively extract top comments from a comment tree."""
    comments: list[dict] = []
    for child in children:
        if child.get("kind") != "t1":
            continue
        c = _parse_comment(child, post_id)
        # Skip deleted/removed/bot comments
        if c["author"] in ("[deleted]", "AutoModerator", "") or not c["body"] or c["body"] == "[removed]":
            continue
        comments.append(c)
        if len(comments) >= max_per_post:
            break
        # Grab top nested replies too
        replies = child.get("data", {}).get("replies")
        if isinstance(replies, dict):
            nested = replies.get("data", {}).get("children", [])
            comments.extend(_extract_comments(nested, post_id, max_per_post - len(comments)))
            if len(comments) >= max_per_post:
                break
    return comments[:max_per_post]


async def fetch_top_posts(
    client: httpx.AsyncClient,
    subreddit: str,
    time_filter: str = "year",
    target_posts: int = 500,
    limit_per_page: int = 100,
) -> list[dict]:
    """Paginate through /r/{subreddit}/top.json to collect posts."""
    posts: list[dict] = []
    after: str | None = None
    pages = 0
    max_pages = (target_posts // limit_per_page) + 2  # safety cap

    while len(posts) < target_posts and pages < max_pages:
        params: dict[str, Any] = {"t": time_filter, "limit": limit_per_page, "raw_json": 1}
        if after:
            params["after"] = after

        url = f"{BASE_URL}/r/{subreddit}/top.json"
        print(f"  Fetching page {pages + 1} (have {len(posts)} posts)...")

        try:
            data = await _get_json(client, url, params)
        except httpx.HTTPStatusError as e:
            print(f"  HTTP error {e.response.status_code} — stopping pagination")
            break

        listing = data.get("data", {})
        children = listing.get("children", [])
        if not children:
            break

        for child in children:
            post = _parse_post(child)
            # Skip empty self-posts and non-text posts
            if post["body"] or post["title"]:
                posts.append(post)

        after = listing.get("after")
        pages += 1
        if not after:
            break

    print(f"  Collected {len(posts)} posts from r/{subreddit}")
    return posts


async def fetch_comments_for_post(
    client: httpx.AsyncClient,
    subreddit: str,
    post_id: str,
    max_comments: int = 10,
) -> list[dict]:
    """Fetch top comments for a single post."""
    url = f"{BASE_URL}/r/{subreddit}/comments/{post_id}.json"
    params = {"limit": max_comments, "sort": "top", "raw_json": 1}

    try:
        data = await _get_json(client, url, params)
    except (httpx.HTTPStatusError, httpx.ReadTimeout):
        return []

    if not isinstance(data, list) or len(data) < 2:
        return []

    comment_children = data[1].get("data", {}).get("children", [])
    return _extract_comments(comment_children, post_id, max_comments)


async def scrape_subreddit(
    subreddit: str,
    target_posts: int = 500,
    comments_per_post: int = 10,
    top_n_for_comments: int = 100,
    time_filter: str = "year",
) -> list[dict]:
    """
    Scrape a subreddit's top posts and their comments.

    Args:
        subreddit: Subreddit name (without r/)
        target_posts: Number of posts to collect
        comments_per_post: Max comments per post
        top_n_for_comments: Fetch comments for the top N posts by score
        time_filter: Reddit time filter (hour, day, week, month, year, all)

    Returns:
        List of post and comment dicts
    """
    print(f"\nScraping r/{subreddit}...")
    items: list[dict] = []

    async with httpx.AsyncClient(headers=DEFAULT_HEADERS, timeout=30.0, follow_redirects=True) as client:
        # 1. Fetch posts
        posts = await fetch_top_posts(client, subreddit, time_filter, target_posts)
        items.extend(posts)

        # 2. Fetch comments for top posts (by score)
        posts_for_comments = sorted(posts, key=lambda p: p["score"], reverse=True)[:top_n_for_comments]
        print(f"  Fetching comments for top {len(posts_for_comments)} posts...")

        for i, post in enumerate(posts_for_comments):
            if (i + 1) % 20 == 0:
                print(f"    Comments progress: {i + 1}/{len(posts_for_comments)}")
            comments = await fetch_comments_for_post(client, subreddit, post["id"], comments_per_post)
            items.extend(comments)

    post_count = sum(1 for x in items if not x["is_comment"])
    comment_count = sum(1 for x in items if x["is_comment"])
    print(f"  Done: {post_count} posts + {comment_count} comments = {len(items)} items")
    return items


def save_raw(subreddit: str, items: list[dict], output_dir: Path | None = None) -> Path:
    """Save scraped items to a JSON file in data/raw/."""
    out_dir = output_dir or RAW_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = out_dir / f"{subreddit}_{timestamp}.json"
    path.write_text(json.dumps(items, indent=2, ensure_ascii=False))
    print(f"  Saved {len(items)} items → {path}")
    return path


async def scrape_and_save(
    subreddit: str,
    target_posts: int = 500,
    comments_per_post: int = 10,
    top_n_for_comments: int = 100,
    time_filter: str = "year",
    output_dir: Path | None = None,
) -> Path:
    """Scrape a subreddit and save results to disk."""
    items = await scrape_subreddit(
        subreddit, target_posts, comments_per_post, top_n_for_comments, time_filter
    )
    return save_raw(subreddit, items, output_dir)

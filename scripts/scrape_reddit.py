"""
Standalone script to scrape all target subreddits.

Usage:
    python scripts/scrape_reddit.py                     # scrape all subreddits
    python scripts/scrape_reddit.py -s femalefashionadvice malefashionadvice  # specific ones
    python scripts/scrape_reddit.py --posts 200 --time month  # customize
"""

import argparse
import asyncio
import sys
from pathlib import Path

# Add project root to path so we can import backend modules
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.config import AVAILABLE_SUBREDDITS, RAW_DIR
from backend.scraper.reddit_scraper import scrape_and_save


async def main(
    subreddits: list[str],
    target_posts: int,
    comments_per_post: int,
    top_n_for_comments: int,
    time_filter: str,
):
    print(f"=== SynMuse Reddit Scraper ===")
    print(f"Subreddits: {', '.join(subreddits)}")
    print(f"Target: {target_posts} posts/sub, {comments_per_post} comments/post")
    print(f"Time filter: {time_filter}")
    print(f"Output dir: {RAW_DIR}")
    print()

    results: dict[str, Path] = {}
    for sub in subreddits:
        try:
            path = await scrape_and_save(
                subreddit=sub,
                target_posts=target_posts,
                comments_per_post=comments_per_post,
                top_n_for_comments=top_n_for_comments,
                time_filter=time_filter,
            )
            results[sub] = path
        except Exception as e:
            print(f"  ERROR scraping r/{sub}: {e}")

    print(f"\n=== Summary ===")
    for sub, path in results.items():
        print(f"  r/{sub} → {path.name}")
    print(f"Total: {len(results)}/{len(subreddits)} subreddits scraped")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape Reddit subreddits for SynMuse")
    parser.add_argument(
        "-s", "--subreddits",
        nargs="+",
        default=AVAILABLE_SUBREDDITS,
        help=f"Subreddits to scrape (default: {AVAILABLE_SUBREDDITS})",
    )
    parser.add_argument(
        "--posts",
        type=int,
        default=500,
        help="Target number of posts per subreddit (default: 500)",
    )
    parser.add_argument(
        "--comments",
        type=int,
        default=10,
        help="Max comments per post (default: 10)",
    )
    parser.add_argument(
        "--top-n",
        type=int,
        default=100,
        help="Fetch comments for top N posts by score (default: 100)",
    )
    parser.add_argument(
        "--time",
        choices=["hour", "day", "week", "month", "year", "all"],
        default="year",
        help="Reddit time filter (default: year)",
    )

    args = parser.parse_args()
    asyncio.run(main(args.subreddits, args.posts, args.comments, args.top_n, args.time))

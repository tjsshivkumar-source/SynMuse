"""Shorten existing persona profile descriptions using Claude Haiku."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import anthropic
from backend.config import ANTHROPIC_API_KEY, HAIKU_MODEL, PERSONA_PROFILES_DIR
from backend.vectorstore.collection_manager import save_profile, get_profile

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

SHORTEN_PROMPT = """Condense each of these persona profile fields to 1-2 sentences, max 35 words each. Keep specific brand names, prices, and concrete details. Remove filler words and redundant adjectives. Return ONLY valid JSON with the same keys.

Input:
{input_json}

Return ONLY this JSON structure:
{{
  "shopping_behaviour": "...",
  "personality": "...",
  "style_identity": "..."
}}"""


def shorten_profile_fields(profile_section: dict) -> dict:
    """Use Haiku to condense profile fields."""
    input_json = json.dumps(profile_section, indent=2)
    response = client.messages.create(
        model=HAIKU_MODEL,
        max_tokens=400,
        messages=[{"role": "user", "content": SHORTEN_PROMPT.format(input_json=input_json)}],
    )
    text = response.content[0].text.strip()
    if "```" in text:
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    return json.loads(text)


def main():
    profiles_dir = PERSONA_PROFILES_DIR
    if not profiles_dir.exists():
        print("No profiles directory found")
        return

    for f in sorted(profiles_dir.glob("*.json")):
        slug = f.stem
        print(f"\n--- {slug} ---")
        profile = json.loads(f.read_text())
        old_profile = profile.get("profile", {})

        if not old_profile:
            print("  No profile section, skipping")
            continue

        # Show old word counts
        for k, v in old_profile.items():
            print(f"  {k}: {len(v.split())}w -> ", end="")

        # Shorten
        new_profile = shorten_profile_fields(old_profile)

        # Show new word counts
        for k, v in new_profile.items():
            print(f"{len(v.split())}w")

        # Update profile
        profile["profile"] = new_profile

        # Also shorten preview_description if it exists and is long
        preview = profile.get("preview_description", "")
        if preview and len(preview.split()) > 50:
            response = client.messages.create(
                model=HAIKU_MODEL,
                max_tokens=200,
                messages=[{"role": "user", "content": f"Condense this to 2 sentences, max 50 words. Keep brand names and specifics. Return ONLY the condensed text, no quotes:\n\n{preview}"}],
            )
            profile["preview_description"] = response.content[0].text.strip().strip('"')
            print(f"  preview_description: {len(preview.split())}w -> {len(profile['preview_description'].split())}w")

        # Save to disk
        f.write_text(json.dumps(profile, indent=2, ensure_ascii=False))
        print(f"  Saved to {f}")

        # Update ChromaDB
        try:
            save_profile(slug, profile)
            print(f"  Updated ChromaDB")
        except Exception as e:
            print(f"  ChromaDB update failed: {e}")

    print("\nDone!")


if __name__ == "__main__":
    main()

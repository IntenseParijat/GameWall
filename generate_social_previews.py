#!/usr/bin/env python3
"""
GameWall - Social Preview Metadata Page Generator
Generates crawler-compatible static HTML landing pages for individual game reviews.
Each review page contains full Open Graph and Twitter Card metadata directly in
the initial static HTML, and provides a lightweight usable landing page with a
direct 'READ REVIEW' link to open the interactive GameWall review flow.

Usage:
  python generate_social_previews.py
"""

import html
import json
import os
import re
import sys
import urllib.parse

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))
GAMES_JSON_PATH = os.path.join(REPO_ROOT, "games.json")
POSTERS_DIR = os.path.join(REPO_ROOT, "posters")
REVIEWS_OUTPUT_DIR = os.path.join(REPO_ROOT, "review")

BASE_URL = "https://intenseparijat.github.io/GameWall/"

PAGE_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{page_title}</title>
  <meta name="description" content="{description}">
  <link rel="canonical" href="{canonical_url}">
  <link rel="icon" type="image/x-icon" href="{base_url}favicon.ico">
  <link rel="icon" type="image/png" href="{base_url}favicon.png">

  <!-- Open Graph / Facebook / Discord / WhatsApp / Telegram -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="GameWall">
  <meta property="og:url" content="{canonical_url}">
  <meta property="og:title" content="{raw_title}">
  <meta property="og:description" content="{description}">
  <meta property="og:image" content="{image_url}">
  <meta property="og:image:alt" content="{image_alt}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="{canonical_url}">
  <meta name="twitter:title" content="{raw_title}">
  <meta name="twitter:description" content="{description}">
  <meta name="twitter:image" content="{image_url}">
  <meta name="twitter:image:alt" content="{image_alt}">

  <style>
    :root {{
      --bg: #05070d;
      --card-bg: #0c111d;
      --border: #1e293b;
      --accent: #00f0ff;
      --accent-hover: #38bdf8;
      --text: #f1f5f9;
      --text-dim: #94a3b8;
      --badge-purple: rgba(138, 92, 255, 0.15);
      --badge-border: rgba(138, 92, 255, 0.4);
    }}
    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}
    body {{
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }}
    .review-landing-card {{
      max-width: 520px;
      width: 100%;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }}
    .card-banner {{
      position: relative;
      width: 100%;
      height: 320px;
      background: #020408;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }}
    .card-banner img {{
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 20%;
    }}
    .card-banner::after {{
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(5, 7, 13, 0.1) 0%, rgba(12, 17, 29, 0.95) 100%);
    }}
    .card-content {{
      padding: 1.5rem 1.75rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }}
    .archive-tag {{
      font-size: 0.7rem;
      letter-spacing: 0.12em;
      color: var(--accent);
      font-weight: 700;
      text-transform: uppercase;
    }}
    h1 {{
      font-size: 1.5rem;
      line-height: 1.25;
      color: #fff;
      font-weight: 700;
    }}
    .meta-badges {{
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }}
    .meta-badge {{
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.55rem;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      border-radius: 4px;
      text-transform: uppercase;
    }}
    .badge-rating {{
      background: rgba(0, 240, 255, 0.12);
      border: 1px solid rgba(0, 240, 255, 0.35);
      color: var(--accent);
    }}
    .badge-gameplay {{
      background: var(--badge-purple);
      border: 1px solid var(--badge-border);
      color: #dce9ff;
    }}
    .desc {{
      font-size: 0.95rem;
      line-height: 1.55;
      color: var(--text-dim);
      margin-top: 0.25rem;
    }}
    .actions {{
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      margin-top: 0.75rem;
    }}
    .btn-read-review {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 0.85rem 1.5rem;
      background: var(--accent);
      color: #05070d;
      font-weight: 700;
      font-size: 0.95rem;
      letter-spacing: 0.06em;
      text-decoration: none;
      border-radius: 6px;
      transition: background 0.2s, transform 0.15s;
    }}
    .btn-read-review:hover {{
      background: var(--accent-hover);
      transform: translateY(-1px);
    }}
    .btn-home {{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 0.75rem 1.5rem;
      background: transparent;
      color: var(--text-dim);
      font-weight: 600;
      font-size: 0.85rem;
      text-decoration: none;
      border: 1px solid var(--border);
      border-radius: 6px;
      transition: color 0.2s, border-color 0.2s;
    }}
    .btn-home:hover {{
      color: var(--text);
      border-color: #334155;
    }}
    .note {{
      font-size: 0.75rem;
      color: #64748b;
      text-align: center;
      margin-top: 0.25rem;
    }}
  </style>
</head>
<body>
  <div class="review-landing-card">
    <div class="card-banner">
      <img src="{image_url}" alt="{image_alt}">
    </div>
    <div class="card-content">
      <span class="archive-tag">// GameWall Review Archive</span>
      <h1>{html_title}</h1>
      <div class="meta-badges">
        {rating_badge_html}
        {gameplay_badge_html}
      </div>
      <p class="desc">{description}</p>
      <div class="actions">
        <a href="../../?review={game_id}" class="btn-read-review">READ REVIEW</a>
        <a href="../../" class="btn-home">Browse Full Collection</a>
      </div>
      <p class="note">Opens the interactive review and spoiler controls on GameWall.</p>
    </div>
  </div>
</body>
</html>
"""


def get_small_poster_url(image_url):
    """
    Derives the corresponding game's _small.jpg poster image from the original URL or filename.
    Verifies against local POSTERS_DIR if available, with case-insensitive and unquoted matching.
    Ensures that in the deployed repository (where posters exist), the valid small poster URL is
    returned and never silently falls back to the generic favicon.
    """
    if not image_url or not isinstance(image_url, str):
        return ""

    trimmed = image_url.strip()
    if not trimmed:
        return ""

    try:
        last_slash = trimmed.rfind("/")
        base_name = trimmed[last_slash + 1 :] if last_slash != -1 else trimmed
        unquoted = urllib.parse.unquote(base_name)
        dot_idx = unquoted.rfind(".")
        if dot_idx == -1:
            stem = unquoted
        else:
            stem = unquoted[:dot_idx]

        small_filename = f"{stem}_small.jpg"

        # Check local disk if posters directory exists
        if os.path.isdir(POSTERS_DIR):
            local_path = os.path.join(POSTERS_DIR, small_filename)
            if os.path.exists(local_path):
                quoted_small = urllib.parse.quote(small_filename)
                return f"{BASE_URL}posters/{quoted_small}"

            # Try case-insensitive matching in POSTERS_DIR
            lower_to_actual = {f.lower(): f for f in os.listdir(POSTERS_DIR)}
            actual_name = lower_to_actual.get(small_filename.lower())
            if actual_name:
                quoted_small = urllib.parse.quote(actual_name)
                return f"{BASE_URL}posters/{quoted_small}"

        # If POSTERS_DIR is not present locally or file not found locally,
        # but a valid poster exists for the game in the repository,
        # derive the public URL rather than silently falling back to favicon!
        quoted_small = urllib.parse.quote(small_filename)
        return f"{BASE_URL}posters/{quoted_small}"
    except Exception as e:
        print(f"Warning: error deriving small poster URL for {image_url}: {e}")
        return ""


def generate_previews():
    if not os.path.exists(GAMES_JSON_PATH):
        print(f"Error: {GAMES_JSON_PATH} not found.")
        sys.exit(1)

    with open(GAMES_JSON_PATH, "r", encoding="utf-8") as f:
        games = json.load(f)

    # Filter games that have reviews (non-empty description)
    review_games = [g for g in games if g.get("description", "").strip()]
    print(f"Found {len(review_games)} games with reviews to process.")

    os.makedirs(REVIEWS_OUTPUT_DIR, exist_ok=True)

    # Root redirect in review/ folder
    root_review_index = os.path.join(REVIEWS_OUTPUT_DIR, "index.html")
    with open(root_review_index, "w", encoding="utf-8") as f:
        f.write("""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>GameWall Reviews</title>
  <link rel="canonical" href="https://intenseparijat.github.io/GameWall/">
  <script>
    const p = new URLSearchParams(window.location.search);
    const r = p.get('review') || p.get('id');
    if (r) {
      window.location.replace('../?review=' + encodeURIComponent(r));
    } else {
      window.location.replace('../');
    }
  </script>
</head>
<body>
  <p>Redirecting to <a href="../">GameWall</a>...</p>
</body>
</html>
""")

    count = 0
    for game in review_games:
        game_id = game["id"].strip()
        title = game.get("title", "").strip()
        image_url = get_small_poster_url(game.get("image", ""))
        if not image_url:
            image_url = f"{BASE_URL}favicon.png"

        description = f"Read Parijat's review of {title}."
        canonical_url = f"{BASE_URL}review/{urllib.parse.quote(game_id)}/"

        page_title = html.escape(f"{title} — Parijat's Review | GameWall", quote=True)
        raw_title = html.escape(title, quote=True)
        escaped_desc = html.escape(description, quote=True)
        escaped_image = html.escape(image_url, quote=True)
        escaped_alt = html.escape(f"{title} Poster", quote=True)
        escaped_id = html.escape(game_id, quote=True)

        rating_badge_html = ""
        rating_val = game.get("rating")
        if rating_val is not None:
            try:
                formatted_rating = f"{float(rating_val):.1f}"
                rating_badge_html = f'<span class="meta-badge badge-rating">Rating: {formatted_rating} / 10</span>'
            except (ValueError, TypeError):
                pass

        gameplay_badge_html = ""
        gameplay_val = game.get("gameplay", "").strip()
        if gameplay_val:
            gameplay_badge_html = f'<span class="meta-badge badge-gameplay">{html.escape(gameplay_val)}</span>'

        content = PAGE_TEMPLATE.format(
            base_url=BASE_URL,
            page_title=page_title,
            description=escaped_desc,
            canonical_url=canonical_url,
            raw_title=raw_title,
            image_url=escaped_image,
            image_alt=escaped_alt,
            game_id=escaped_id,
            html_title=html.escape(title, quote=False),
            rating_badge_html=rating_badge_html,
            gameplay_badge_html=gameplay_badge_html,
        )

        game_dir = os.path.join(REVIEWS_OUTPUT_DIR, game_id)
        os.makedirs(game_dir, exist_ok=True)
        out_file = os.path.join(game_dir, "index.html")

        with open(out_file, "w", encoding="utf-8") as f:
            f.write(content)

        count += 1

    print(f"Successfully generated {count} review metadata pages in {REVIEWS_OUTPUT_DIR}/")


if __name__ == "__main__":
    generate_previews()

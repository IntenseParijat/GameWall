#!/usr/bin/env python3
"""
GameWall - Social Preview Metadata Page Generator
Generates crawler-compatible static HTML pages for individual game reviews.
Each review page contains full Open Graph and Twitter Card metadata,
and seamlessly redirects human visitors to the interactive GameWall review modal.

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

  <!-- Open Graph / Facebook / Discord / WhatsApp -->
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

  <!-- Instant client redirect to full interactive experience -->
  <meta http-equiv="refresh" content="0; url=../../?review={game_id}">
  <script>
    window.location.replace("../../?review=" + encodeURIComponent("{js_game_id}"));
  </script>
  <style>
    body {{
      margin: 0;
      padding: 2rem;
      background: #05070d;
      color: #94a3b8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      box-sizing: border-box;
      text-align: center;
    }}
    .redirect-card {{
      max-width: 480px;
      padding: 2rem;
      background: #0d121f;
      border: 1px solid #1e293b;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
    }}
    h1 {{
      font-size: 1.25rem;
      color: #00f0ff;
      margin: 0 0 0.75rem;
    }}
    p {{
      margin: 0 0 1.5rem;
      line-height: 1.5;
    }}
    a {{
      display: inline-block;
      padding: 0.65rem 1.3rem;
      background: #00f0ff;
      color: #05070d;
      font-weight: 600;
      text-decoration: none;
      border-radius: 4px;
      transition: opacity 0.2s;
    }}
    a:hover {{
      opacity: 0.9;
    }}
  </style>
</head>
<body>
  <div class="redirect-card">
    <h1>Opening Review...</h1>
    <p>Loading Parijat's review of <strong>{html_title}</strong> on GameWall.</p>
    <a href="../../?review={game_id}">Click here if not redirected automatically</a>
  </div>
</body>
</html>
"""


def get_small_poster_url(image_url):
    """
    Derives the corresponding game's _small.jpg poster image from the original URL.
    Follows the project's existing small-poster naming convention.
    Falls back to original poster URL if small version is unavailable.
    """
    if not image_url:
        return ""

    try:
        last_slash = image_url.rfind("/")
        base_name = image_url[last_slash + 1 :] if last_slash != -1 else image_url
        unquoted = urllib.parse.unquote(base_name)
        dot_idx = unquoted.rfind(".")
        if dot_idx == -1:
            return image_url

        stem = unquoted[:dot_idx]
        small_filename = f"{stem}_small.jpg"
        local_path = os.path.join(POSTERS_DIR, small_filename)

        if os.path.exists(local_path):
            quoted_small = urllib.parse.quote(small_filename)
            if last_slash != -1:
                return image_url[: last_slash + 1] + quoted_small
            return quoted_small
        return image_url
    except Exception:
        return image_url


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
  <meta http-equiv="refresh" content="0; url=../">
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
        image_url = get_small_poster_url(game.get("image", "").strip())
        description = f"Read Parijat's review of {title}."
        canonical_url = f"{BASE_URL}review/{urllib.parse.quote(game_id)}/"

        page_title = html.escape(f"{title} — Parijat's Review | GameWall", quote=True)
        raw_title = html.escape(title, quote=True)
        escaped_desc = html.escape(description, quote=True)
        escaped_image = html.escape(image_url, quote=True)
        escaped_alt = html.escape(f"{title} Poster", quote=True)
        escaped_id = html.escape(game_id, quote=True)
        js_game_id = game_id.replace('"', '\\"')

        content = PAGE_TEMPLATE.format(
            page_title=page_title,
            description=escaped_desc,
            canonical_url=canonical_url,
            raw_title=raw_title,
            image_url=escaped_image,
            image_alt=escaped_alt,
            game_id=escaped_id,
            js_game_id=js_game_id,
            html_title=html.escape(title, quote=False),
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

# GameWall

**GameWall** is a personal video-game archive with a cyber-tech aesthetic featuring interactive game cards, posters, ratings, reviews, and a CPU-fan loading/cursor system.

**Live site:** https://intenseparijat.github.io/GameWall/

---

## Repository Structure

```text
GameWall/
├── index.html        # Main HTML shell, templates, and modals
├── style.css         # Styling, cyber-tech theme, animations, and responsive layout
├── app.js            # Client-side database, search, filtering, tour, and animations
├── games.json        # Database containing the game entries
├── favicon.ico / png # Site icons
└── posters/          # Poster images (e.g. title.jpg, title_small.jpg)
```

---

## Game JSON Schema

Games in `games.json` use the following schema:

```json
{
  "id": "game-slug",
  "title": "Game Title",
  "image": "https://raw.githubusercontent.com/IntenseParijat/GameWall/main/posters/game.jpg",
  "rating": 9.5,
  "gameplay": "Personal Gameplay Label",
  "platforms": ["PC", "Console", "Mobile"],
  "url": "https://official-game-site.com",
  "description": "Optional Markdown review text",
  "abbreviations": "GT, Abbrev",
  "posterBadge": null
}
```

### `posterBadge` Field (Optional)

Posters can display an upper-left status badge:

- **Completed game (Green // 100%):**
  ```json
  "posterBadge": { "type": "completed" }
  ```
- **Dropped game (Red // {percentage}%):**
  ```json
  "posterBadge": { "type": "dropped", "percentage": 45 }
  ```
- **Custom badge (Neutral outline // custom text):**
  ```json
  "posterBadge": { "type": "custom", "text": "ENDLESS MODE" }
  ```
  *(Setting `"text": "? HOURS"` displays a decorative glitching playtime counter for unknown hours).*
- **No badge (or missing field):**
  ```json
  "posterBadge": null
  ```

---

## Adding or Updating a Game

1. Place poster image(s) in `posters/` (standard format: JPG/PNG, RGB/sRGB). Optionally provide a companion `_small.jpg` for low-bandwidth connections.
2. Add or edit the game entry in `games.json`.
3. Set `id` to a unique alphanumeric slug (used for review URLs: `?review=slug`).
4. To include a review, write Markdown in `"description"`.
5. Test locally using a local web server (e.g., `python -m http.server 8000`).

---

## Search, Filters, and URL Parameters

- **Search Scopes:** `title` (default, checks title & abbreviations), `gameplay`, `review`, `platform`, `badge`, and `everything`.
- **Advanced Filters:** Combine platform checkboxes (PC, Mobile, Console), poster status (Any, Completed, Dropped, Custom, No Badge), review availability, personal rating range (0–10), and gameplay 100% marker using AND logic.
- **Search Clear vs Reset:** Dedicated clear button inside the search field wipes the active query. The **RESET** button resets advanced filters and sorting to defaults while preserving your active search text.
- **Canonical URL Parameters:**
  - `q`: Search query string
  - `scope`: Search scope (omitted if `title`)
  - `platform`: Repeated platform values (e.g. `?platform=PC&platform=Console`)
  - `badge`: Poster status (`completed`, `dropped`, `custom`, `none`)
  - `hasReview`: Review availability (`true` or `false`)
  - `minRating` & `maxRating`: Rating boundaries (omitted if 0 and 10)
  - `gameplayProgress`: Legacy 100% filter (`100` or `not-100`)
  - `sort`: Ordering (`rating-desc` (default), `rating-asc`, `title-asc`, `title-desc`, `default`)
  - `review`: Direct link to open a game's review modal (e.g. `?review=minecraft`)
  - *Legacy URL compatibility:* Incoming `s`, `p1`, and `p2` parameters are automatically parsed and mapped.
- **Interactive Tutorial:** Click the **HELP / GUIDE** button in the header for an on-demand, 14-step guided walkthrough.

---

## Cursor, Loading, and Performance

- **Startup Fan Loader:** Spans deployment, grey-to-neon illumination, acceleration, high-speed spin, and circular database loading progress.
- **Seamless Desktop Transition:** The loading fan smoothly decelerates into the idle rotation speed while shrinking and moving to the mouse pointer, becoming the interactive cursor with zero pause or angle reset.
- **Mobile & Touch Devices:** The startup fan runs completely, but custom mouse cursor tracking is never enabled.
- **Animations Toggle:** Click **ANIMATIONS: ON / OFF** to toggle animations. The choice is saved to `localStorage` and respects `prefers-reduced-motion`. The startup fan runs independently during initial boot.
- **Adaptive Performance:** Devices detected as low-powered during startup automatically bypass the per-card title curtain reveal to ensure fluid rendering.

---

## Publishing to GitHub Pages

1. Commit changes to the repository:
   ```bash
   git add index.html style.css app.js games.json README.md posters/
   git commit -m "Update GameWall archive"
   git push origin main
   ```
2. In GitHub repository settings, navigate to **Pages** and ensure Source is set to `Deploy from a branch` (Branch: `main`, Folder: `/ (root)`).
3. The site updates automatically at `https://intenseparijat.github.io/GameWall/`.

---

## Troubleshooting

- **CORS / Local Testing:** Always open via an HTTP server (`http://localhost:8000`) rather than `file:///`, so `games.json` can be fetched.
- **Image Errors in Firefox:** Ensure images are saved in RGB/sRGB color mode, not CMYK.
- **JavaScript Disabled:** GameWall requires client-side JavaScript to decrypt and render database records. A `<noscript>` warning guides visitors to enable JavaScript.

---

## License & Attribution

Created by **Parijat Das** ([GitHub](https://github.com/IntenseParijat)). Licensed under MIT.

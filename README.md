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
- **Spoiler Warning Protocol:** Displays a cautionary dialog before opening any review with options to proceed (**OK**), cancel (**BACK** / **Escape**), or remember your preference (**DON'T REMIND AGAIN**).
- **Interactive Tutorial:** Click the **HELP / GUIDE** button in the header for an on-demand, 14-step guided walkthrough.

---

## Cursor, Loading, and Performance

- **Startup Fan Loader:** Spans deployment, grey-to-neon illumination, acceleration, high-speed spin, and circular database loading progress. Appears during startup on all devices regardless of touch capabilities, cursor eligibility, or animation preferences.
- **Seamless Desktop Transition:** On desktops with animations enabled, the loading fan smoothly decelerates while shrinking and morphing into a lightweight precision gaming reticle cursor at the mouse pointer without momentary flickering or disappearance.
- **Mobile & Touch Devices / Animations Disabled:** The startup fan runs as the startup loading indicator and dismisses cleanly once startup loading finishes; native cursor behaviour is preserved and custom mouse cursor tracking is never enabled.
- **Precision Gaming Reticle Cursor:** A 24px four-corner angular HUD reticle featuring a dual-layer high-contrast design (opaque dark outer stroke behind bright neon inner stroke in normal state; solid white inner brackets and center diamond with dark backing borders on both normal `.is-hover` and `.is-danger-hover` states), clearly defined central diamond, subtle circular scroll-progress ring, and responsive danger hover effects without continuous animation loops or CPU overhead.
- **Animations Toggle:** Click **ANIMATIONS: ON / OFF** to toggle animations. The choice is saved to `localStorage` and respects `prefers-reduced-motion`. The startup fan is presented on initial boot across all preferences and dismissed once ready.
- **Adaptive Performance:** Devices detected as low-powered during startup automatically bypass the per-card title curtain reveal to ensure fluid rendering.

---

## Archive Access Counter

GameWall tracks visits using a custom backend powered by Cloudflare Workers and Cloudflare D1:

- **Production Worker URL:**
  `https://gamewall-archive-counter.parijatsoftwares.workers.dev`
- **API Endpoints:**
  - `POST /api/visit` — Records exactly one page visit and returns the updated count JSON (`{ "count": number }`).
  - `GET /api/count` — Retrieves the current stored count without incrementing it (`{ "count": number }`).
- **Visit-Counting Protocol:**
  - On each normal page load, the frontend sends exactly one `POST /api/visit` request to record the visit.
  - The displayed counter is updated with the confirmed `count` returned by the server.
  - The last successfully server-confirmed count is stored in `localStorage` (`gamewall_access_count`) purely as an offline display cache/fallback. LocalStorage is never the source of truth and is never used to increment the count locally.
  - If the initial `POST` request fails, the frontend falls back to `GET /api/count` to retrieve the current count without incrementing it.
  - If both network requests fail, the last confirmed cached count is displayed when available; otherwise, an unavailable indicator (`—`) is shown rather than inventing an artificial count.
  - Guards prevent duplicate increments from repeated initialization calls, scroll events, cursor movements, or visibility changes. The frontend never automatically retries failed `POST` requests to prevent duplicate count increments.
- **Maintenance Information:**
  - The frontend API base URL is configured via `ARCHIVE_COUNTER_API_BASE` in `app.js`. If the Worker is replaced, domain names change, or the counter service is redeployed to a different address, update `ARCHIVE_COUNTER_API_BASE` to point to the new endpoint base URL.

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

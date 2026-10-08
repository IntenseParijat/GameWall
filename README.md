# GameWall

**GameWall** is Parijat Das's personal video-game archive: a static, read-only game collection with a neon cyber-tech / gaming interface.

**Live site:** https://intenseparijat.github.io/GameWall/

The project is designed for GitHub Pages and can also be embedded inside a Blogger iframe.

---

## Features

- Responsive game-card grid
- Default sorting by **rating: high → low**
- Search by game title
- Rating sorting and alphabetical sorting
- Personal rating out of 10
- Free-text gameplay/status labels
- PC / Mobile / Console / Gameboy platform icons
- Multiple platforms per game
- Game poster linking to the game's website/store page
- Lazy-loaded posters
- Blurred poster backdrop for transparent poster areas
- Per-poster loading state and fallback state
- Equal-height cards with title/content separated from the bottom metadata area
- Long gameplay labels use a continuous marquee instead of `...`
- Automatic title fitting for long game titles
- GitHub `games.json` update timestamp
- Highest-rated game statistic
- Staggered card entrance animation
- Glitch Split title treatment
- Scramble animation for the loading screen with pre-measured layout stabilization
- Floating top/bottom quick page navigation button with scroll direction tracking
- High-performance custom circular CPU-fan mouse cursor with scroll-progress indicator on fine-pointer devices (hardware-accelerated `translate3d` tracking tested up to 240Hz and 2K/4K displays)
- User-configurable **Animations ON/OFF** toggle setting with `localStorage` persistence and automatic `prefers-reduced-motion` integration
- Optimized background canvas with capped 1.0 DPR, pre-cached radial gradients, squared-distance connection culling, and tab-visibility lifecycle pausing
- Cyber-tech `<noscript>` full-screen warning with browser enablement instructions
- Curtain Wipe animation when a game title first enters the viewport
- Ambient animated background with grid, particles, circuitry, and cyan/purple energy effects
- Responsive and reduced-motion support
- No build system and no backend

---

## Repository Structure

```text
GameWall/
├── index.html
├── style.css
├── app.js
├── games.json
├── README.md
└── posters/
    ├── minecraft.jpg
    ├── Valorant.png
    └── ...
```

`games.json` contains the collection data.

`posters/` contains the poster images.

The rest of the project is plain HTML, CSS, and JavaScript.

---

## Game Data

The frontend reads the complete collection from `games.json`; games are not hard-coded into the card markup.

Each entry follows this structure:

```json
{
  "id": "minecraft",
  "title": "Minecraft (Java)",
  "image": "https://raw.githubusercontent.com/IntenseParijat/GameWall/main/posters/minecraft.jpg",
  "rating": 8.5,
  "gameplay": "Architect",
  "platforms": [
    "PC"
  ],
  "url": "https://www.minecraft.net/"
}
```

### Fields

| Field | Description |
|---|---|
| `id` | Stable unique identifier for the game |
| `title` | Display name |
| `image` | Full raw GitHub URL of the poster |
| `rating` | Personal rating from `0` to `10`; decimals are supported |
| `gameplay` | Free-text personal status/label |
| `platforms` | Array containing one or more supported platform values |
| `url` | Website/store page opened when the game is selected |

### Supported platform values

```text
PC
Mobile
Console
Gameboy
```

The platform field is an array, so a game can have multiple platforms:

```json
"platforms": ["PC", "Mobile", "Console"]
```

---

## Posters

Poster files belong in:

```text
posters/
```

The filename referenced by the `image` URL must match the actual file in the repository exactly.

For example:

```text
posters/Valorant.png
```

must be referenced as:

```text
https://raw.githubusercontent.com/IntenseParijat/GameWall/main/posters/Valorant.png
```

The project does **not** require the poster filename to match the game's `id`.

Posters can use common web image formats such as:

```text
.jpg
.jpeg
.png
.webp
.gif
```

For best browser compatibility, standard RGB/sRGB JPEG/PNG/WebP files are recommended.

---

## Adding Games in Bulk

The bulk JSON generator is intended for large initial imports.

Its workflow is:

1. Fetch the current `games.json`.
2. Keep the database in local memory.
3. Enter games repeatedly.
4. Provide the local poster file path.
5. Extract only the poster filename.
6. Generate the future GitHub raw poster URL from that filename.
7. Update the JSON locally.
8. Repeat until finished.
9. Save the final JSON to a local file.

The poster itself is **not uploaded by the bulk JSON generator**.

For example:

```text
C:\Users\parij\Downloads\GameWall\Valorant.png
```

becomes:

```text
https://raw.githubusercontent.com/IntenseParijat/GameWall/main/posters/Valorant.png
```

The poster can then be manually uploaded into the repository's `posters/` directory.

---

## Publishing

There is no build step.

GitHub Pages should serve the main branch directly:

```text
index.html
```

The frontend loads:

```text
games.json
```

using a relative path, so it works from the GitHub Pages project path:

```text
https://intenseparijat.github.io/GameWall/
```

It is also suitable for embedding into a Blogger iframe.

---

## Database Update Timestamp

The **GAME DATABASE** statistic retrieves the most recent GitHub commit affecting `games.json`.

It uses GitHub's commits API with a path filter for:

```text
games.json
```

The displayed time is converted to UTC.

This means the timestamp changes automatically whenever the `games.json` file receives a new GitHub commit.

---

## Poster Loading

Game posters use native lazy loading.

While a poster is loading, the card displays a dedicated loading animation.

The poster system also provides:

- blurred enlarged backdrop
- actual poster layer
- loading state
- fallback state if loading fails

The main poster remains configured with:

```css
object-fit: cover;
```

so posters keep the existing cover/crop behavior.

---

## Interface Animations

### Title

`GAME WALL` uses:

- Paladins font
- Glitch Split effect
- cyan/purple chromatic separation

The Paladins font is loaded from the project's CDN:

```css
@font-face {
  font-family: "Paladins";
  src: url("https://raw.githubusercontent.com/IntenseParijat/cdn/a665658c495372592d5342a3e347ac8518901828/fonts/paladinssemiital.woff2") format("woff2");
}
```

### Loading screen

Loading messages use a Scramble effect. To prevent line-wrapping jumps and layout jitter on mobile and narrow viewports (such as 320px, 360px, 375px, 390px, and 430px), the scramble animation pre-measures the complete final text layout against the element's computed typography before random character insertion begins.

- **Stable line configuration:** If the target string fits on one line at the current viewport width, one-line dimensions and no-wrap rules are reserved. If the target string naturally requires multiple lines, multi-line dimensions and stable line spans are reserved from the beginning so intermediate random characters cannot temporarily snap between one-line and two-line states.
- **Zero layout shift:** The browser reserves the exact final dimensions beforehand, ensuring the loader message, progress track, and percentage label remain completely stable.
- **Final initialization message:** The loading sequence smoothly progresses through database connection, archive data verification, and timestamp acquisition, culminating strictly in `DATABASE READY` as the final animated scramble message. The intermediate `BUILDING COLLECTION...` step has been removed.
- **Error state isolation:** If network failure or parse errors prevent `games.json` from loading, the loading screen transitions to `DATABASE UNAVAILABLE` with diagnostic details in the empty state.
- **Uncompromised aesthetics:** Once the animation concludes, the element cleanly restores normal plain text and inline dimensions, matching the intended final cyber-tech typography.

### Page Navigation

GameWall provides a subtle floating navigation button anchored in the lower corner of the viewport for rapid movement:
- **At the top:** When near the top of the page, the button presents a downward chevron icon for scrolling smoothly to the document end.
- **After scrolling down:** Once scrolled past a small threshold (300px), the button seamlessly switches to an upward chevron icon for returning to the page top.
- **Modal awareness:** The navigation button automatically hides whenever the Review modal is active and restores its state upon modal dismissal without affecting scroll locking.
- **Accessibility & Motion:** Features an accessible minimum 44×44px touch target on mobile devices, requires no hover interaction, and respects `prefers-reduced-motion` with instant scrolling.

### Custom CPU Fan Progress Cursor

On devices equipped with a fine pointing device (such as desktop mice and precision trackpads), GameWall renders a cyber-tech circular hardware cursor:
- **Instant tracking:** The cursor tracks native mouse coordinates with zero delay, zero lerping, and zero interpolation, providing immediate, precision feedback.
- **Circular scroll-progress ring:** An outer SVG ring continuously visualizes document scroll progress from 0% at the page top to 100% at the footer.
- **Rotating CPU fan light pattern:** The interior features a smooth, continuous rotating 5-blade aerodynamic light pattern illuminated in neon cyan and neon purple around a dark hub, visually evocative of an RGB PC cooling fan.
- **Interactive hover reaction:** When hovering interactive controls (buttons, links, game cards, review dialog controls), the cursor scales subtly and increases rotation speed for tactile feedback.
- **Pointer capability detection & isolation:** Enabled exclusively when `(pointer: fine)` and `(hover: hover)` match. Native cursor is hidden via scoped `cursor: none !important` on supported devices, while mobile and touch-only devices remain 100% untouched with zero cursor overhead.
- **Modal & UI integration:** Set to `pointer-events: none` at high stacking index (`z-index: 10000`), allowing full click-through to all buttons, links, and review modal interactions.

### Game titles

Game titles use a Curtain Wipe when they first enter the viewport.

### Gameplay/status

Long gameplay labels use a continuous horizontal marquee rather than an ellipsis.

Short labels remain static.

---

## Layout

The game grid uses a deliberate responsive column structure rather than unrestricted `auto-fill`.

Desktop and smaller-screen layouts reduce the number of columns at defined breakpoints so cards do not become excessively narrow.

Cards are equal-height flex layouts. The game title occupies the upper content area while the gameplay row and `VIEW GAME` button remain aligned toward the bottom.

---

## Performance & High-Refresh Display Architecture

GameWall is engineered to run fluidly on high-refresh-rate displays (144Hz, 165Hz, 240Hz) and high resolutions (2K, 4K) without dropped frames or pointer latency:

### 1. Zero-Latency Custom Cursor
- **Compositor-Only Transformations:** The custom circular CPU-fan cursor uses `transform: translate3d(clientX, clientY, 0)` with `contain: layout style paint` and `will-change: transform`. Mouse positioning executes entirely on the GPU compositor thread without triggering layout reflows or style recalculations.
- **Decoupled Animation Channels:** Cursor translation (`translate3d`), hover scaling (`scale(1.18)`), CPU fan blade rotation (`@keyframes gw-fan-spin`), and circular scroll progress (`stroke-dashoffset`) operate on completely independent layers. Pointer movement never recalculates SVG attributes or queries the DOM (`getBoundingClientRect()` is avoided entirely during pointer move).
- **Adaptive Pointer Filtering:** Enabled only on devices satisfying `(pointer: fine) and (hover: hover)`, automatically hiding the native cursor on desktop mice while leaving mobile and touch interfaces completely unaffected.

### 2. Optimized Ambient Canvas
- **DPR Clamping:** Ambient canvas resolution is capped at 1.0 DPR, eliminating massive 2K/4K pixel fill-rate penalties while preserving sharp cyber-tech circuit visuals.
- **Pre-Cached Gradients:** Radial atmosphere gradients are generated once on viewport resize rather than reallocated on every animation frame.
- **Squared Distance Proximity Culling:** Inter-node distance testing uses squared arithmetic (`dx*dx + dy*dy <= maxDistanceSq`), eliminating square root calculations for all non-connecting nodes.
- **Lifecycle & Tab Visibility Pausing:** Automatically cancels `requestAnimationFrame` loops when the tab is hidden (`document.hidden`) or scrolled out of view (`IntersectionObserver`), preventing background battery drain.

---

## Review Modal & External Embed System

GameWall features an integrated Markdown review reader with controlled, sandboxed external media embed support:

### Supported Embed Providers
- **YouTube:** Safe `youtube-nocookie.com` responsive iframes with fullscreen and media controls.
- **Vimeo:** Safe `player.vimeo.com` responsive iframes.
- **Instagram:** Controlled official Instagram embeds loaded via safe permalink extraction and official `embed.js` processing.
- **Markdown formatting:** Supports headers, blockquotes, lists, code blocks, bold, italics, external links, and lazy-loaded screenshots with DOMPurify sanitization.

### Dedicated Embed Loading States
When a review with external media is opened:
- Embeds immediately display an indeterminate GameWall cyber-tech loading state with provider tagging (e.g. `[ YOUTUBE ]`, `[ INSTAGRAM ]`, `[ VIMEO ]`), a moving cyan/purple scanning progress bar, and a rotating cyber ring.
- No fake percentages are shown, keeping progress communication honest and accurate.
- For iframes, completion is detected via native `load` events. For Instagram, dynamic frame generation is observed via `MutationObserver` and frame readiness before the loading overlay is cleanly dismissed.

### Error Handling & Reload Recovery
- **Timeout Protection:** Embeds are monitored with a configurable timeout (`EMBED_TIMEOUT_MS = 14000`) so slow or blocked connections never leave a permanently stuck loader.
- **Cyber-Tech Failure Card:** If an embed fails or times out, its container switches to a cyber-tech failure state displaying an error badge, the provider name, an explanatory message, and a dedicated **RELOAD PAGE** button.
- **Full Page Reload:** Clicking **RELOAD PAGE** performs a full page reload (`window.location.reload()`) keeping the active review URL intact for an immediate retry.
- **Failure Isolation:** Each embed operates completely independently. If one embed fails, other embeds and all surrounding review text remain fully functional.
- **Lifecycle Cleanup:** Direct review-to-review navigation (`Review A → Review B`) cleanly cancels pending timers, disconnects observers, and resets iframe sources (`about:blank`) to avoid background bandwidth usage and memory leaks.

---

## Animation Settings & Reduced Motion Hierarchy

GameWall includes an accessible, persistent **ANIMATIONS: ON / OFF** toggle in the hero topline:

### Preference Hierarchy
1. **User's Explicit Saved Choice:** If the user has manually toggled animations to `"on"` or `"off"`, this choice is persisted to `localStorage` under `gamewall-animations` and strictly honored across future visits.
2. **System Preference Default:** On the user's first visit with no stored setting, the site checks `(prefers-reduced-motion: reduce)`. If the operating system requests reduced motion, GameWall defaults to `ANIMATIONS: OFF`. Otherwise, it starts with `ANIMATIONS: ON`.
3. **Explicit Override Capability:** A system reduced-motion preference is treated strictly as an accessible initial default—not a permanent lock. Users on systems with Windows or browser animation restrictions can explicitly click **ANIMATIONS: ON**, which instantly resumes all animations and saves the override.

### Full Animation Resumption
When animations are toggled from OFF to ON, every animation system resumes actively rather than freezing on a static frame:
- **Background Canvas:** Re-requests `requestAnimationFrame` rendering, resizes the viewport buffer, and resumes node velocity movement and circuit pulses.
- **Custom CPU-Fan Cursor:** Restores fine-pointer tracking, rotates the 5-blade aerodynamic light pattern, updates the circular scroll-progress indicator, and hides the native cursor.
- **Ambient Elements:** Resumes background grid animation, particles, and floating cyan/purple energy atmosphere drift.
- **Title Glitch & Scan Lines:** Glitch split animations on the header title and hero/section scanning divider bars re-trigger cleanly.
- **Card Entrance & Titles:** Newly rendered or filtered game cards animate smoothly into view with staggered entry delays, and viewport titles reveal via the curtain-wipe transition.
- **Gameplay Marquee:** Long gameplay labels resume continuous horizontal scrolling.
- **Page Navigation:** Quick top/bottom page navigation transitions smoothly with animated scrolling.
- **Tab Visibility Integration:** Canvas and cursor loops automatically sleep when `document.hidden === true` and wake up when the tab returns to focus without accumulating duplicate listeners or animation loops.
- **Non-Destructive Toggling:** Turning animations ON or OFF never reloads `games.json`, rebuilds the database, resets search queries, modifies filters, or dismisses an open review modal.

---

## JavaScript Requirement (`<noscript>`)

GameWall is a client-side database application. If JavaScript is disabled or unavailable in the browser, a full-screen cyber-tech `<noscript>` overlay is rendered with clear instructions on enabling JavaScript across Google Chrome, Brave, Microsoft Edge, Mozilla Firefox, and Apple Safari.

---

## Browser Compatibility

GameWall uses standard browser APIs including:

- `fetch`
- `IntersectionObserver`
- `ResizeObserver`
- CSS animations, transforms, and custom properties
- SVG paths and stroke dash-offset manipulation
- Pointer Media Queries (`(pointer: fine)`, `(hover: hover)`)
- Canvas for the ambient background
- Native lazy loading

For local testing, use a local HTTP server rather than opening `index.html` directly with `file://`. This allows relative requests such as `games.json` to behave consistently.

---

## Image Compatibility Note

Browser image decoders can differ for unusual or improperly encoded images.

For maximum compatibility, especially with Firefox, use normal RGB/sRGB images rather than CMYK JPEGs or JPEGs with unusual color/profile metadata.

If a particular poster works in Chrome but Firefox reports:

```text
The image cannot be displayed because it contains errors.
```

the first thing to check is the actual image file and its encoding/color space rather than changing the GameWall card CSS.

---

## No Backend

GameWall is intentionally a static archive.

There is:

- no database server
- no authentication system
- no API backend
- no framework
- no npm build process

The repository itself is the data source.

---

## Attribution

If you reuse this project or a substantial portion of it, please include:

> **Game Wall by Parijat Das**  
> https://github.com/IntenseParijat/GameWall

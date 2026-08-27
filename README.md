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
- Scramble animation for the loading screen
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

Loading messages use a Scramble effect.

The loading screen waits for the final scramble to finish, then remains visible briefly before disappearing.

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

## Browser Compatibility

GameWall uses standard browser APIs including:

- `fetch`
- `IntersectionObserver`
- `ResizeObserver`
- CSS animations
- Canvas for the ambient background
- native lazy loading

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

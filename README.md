# GameWall

Personal video-game collection with a cyber-tech interface. GameWall is a static, read-only archive designed for GitHub Pages and responsive enough to embed in a Blogger iframe.

GitHub Pages: [https://intenseparijat.github.io/GameWall/](https://intenseparijat.github.io/GameWall/)

## Data

The site reads every game from `games.json`; no games are hard-coded in the front end. Each entry uses this schema:

```json
{
  "id": "cyberpunk-2077",
  "title": "Cyberpunk 2077",
  "image": "https://raw.githubusercontent.com/IntenseParijat/GameWall/main/posters/cyberpunk-2077.jpg",
  "rating": 8.5,
  "gameplay": "Completed",
  "url": "https://example.com"
}
```

- `id` is a stable, unique slug for future updates.
- `rating` accepts numbers from 0 to 10, including decimals.
- `gameplay` is free text and is displayed as supplied.
- `url` is opened in a new tab from each card.

The sample records are only there to preview the interface. Replace them with the personal collection when ready.

## Posters

Store poster files in [`posters/`](posters/). Future entries should generally use predictable names such as `posters/<id>.jpg`; their JSON `image` values can point to the corresponding raw GitHub URL.

## Publishing

This project has no build step or backend. Enable GitHub Pages for the repository’s main branch and it will serve `index.html`. The frontend loads `games.json` using a relative path, so it works from the `/GameWall/` GitHub Pages project path and when embedded in a narrow iframe.

The planned Python uploader is not included here; it will be responsible for adding poster files and updating `games.json`.

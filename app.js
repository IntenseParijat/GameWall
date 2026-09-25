const state = {
  games: [],
  query: "",
  searchMode: "title",
  filterMode: "none",
  sortMode: "rating-desc",
  connectionMode: "good"
};

const PLATFORM_ICONS = {
  PC: {
    label: "PC",
    svg: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="1.5"></rect><path d="M8 20h8M12 16v4"></path></svg>`
  },
  Mobile: {
    label: "Mobile",
    svg: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="1.8"></rect><path d="M10 5h4M11 18.5h2"></path></svg>`
  },
  Console: {
    label: "Console",
    svg: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 8.5h9.6c2 0 3.3 1.4 4 3.3l1 3.2c.5 1.7-.9 3-2.4 2.3l-3.5-1.7H8.1l-3.5 1.7c-1.5.7-2.9-.6-2.4-2.3l1-3.2c.7-1.9 2-3.3 4-3.3Z"></path><path d="M7.2 11v4M5.2 13h4M15.8 12.5h.01M18.2 14h.01"></path></svg>`
  },
  Gameboy: {
    label: "Gameboy",
    svg: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="1.8"></rect><rect x="8.5" y="5" width="7" height="6" rx=".5"></rect><path d="M9.5 14h3M11 12.5v3M14.8 15h.01M16.2 16.4h.01"></path></svg>`
  }
};

const PLATFORM_ALIASES = {
  pc: "PC",
  computer: "PC",
  mobile: "Mobile",
  phone: "Mobile",
  android: "Mobile",
  ios: "Mobile",
  console: "Console",
  controller: "Console",
  gameboy: "Gameboy",
  "game boy": "Gameboy"
};

const elements = {
  grid: document.querySelector("#game-grid"),
  template: document.querySelector("#game-card-template"),
  search: document.querySelector("#game-search"),
  searchMode: document.querySelector("#search-mode"),
  filter: document.querySelector("#filter-games"),
  sort: document.querySelector("#sort-games"),
  emptyState: document.querySelector("#empty-state"),
  emptyTitle: document.querySelector("#empty-title"),
  emptyMessage: document.querySelector("#empty-message"),
  resultCount: document.querySelector("#result-count"),
  totalGames: document.querySelector("#total-games"),
  averageRating: document.querySelector("#average-rating"),
  databaseUpdate: document.querySelector("#database-update"),
  databaseUpdateDetail: document.querySelector("#database-update-detail"),
  highestRated: document.querySelector("#highest-rated"),
  highestRatedDetail: document.querySelector("#highest-rated-detail"),
  loadingScreen: document.querySelector("#loading-screen"),
  loaderBar: document.querySelector("#loader-bar"),
  loaderPercent: document.querySelector("#loader-percent"),
  loaderMessage: document.querySelector("#loader-message"),
  reviewModalBackdrop: document.querySelector("#review-modal-backdrop"),
  reviewModal: document.querySelector("#review-modal"),
  reviewModalTitle: document.querySelector("#review-modal-title"),
  reviewModalId: document.querySelector("#review-modal-id"),
  reviewModalBody: document.querySelector("#review-modal-body"),
  reviewModalClose: document.querySelector("#review-modal-close"),
  reviewModalCloseBtn: document.querySelector("#review-modal-close-btn"),
  reviewModalShare: document.querySelector("#review-modal-share"),
  reviewShareToast: document.querySelector("#review-share-toast"),
  mainContent: document.querySelector("#main-content")
};

const scrambleTimers = new WeakMap();
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+-/<>[]{}01";

function scrambleText(element, target, options = {}) {
  if (!element) return Promise.resolve();

  const text = String(target ?? "");

  const previousTimer = scrambleTimers.get(element);
  if (previousTimer?.cancel) previousTimer.cancel();

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    element.setAttribute("aria-label", text);
    element.textContent = text;
    return Promise.resolve();
  }

  const intervalMs = options.interval ?? 40;
  const revealEvery = options.revealEvery ?? 3;

  element.setAttribute("aria-label", text);

  let revealed = 0;
  let frame = 0;
  let timer = null;
  let resolvePromise;

  const promise = new Promise((resolve) => {
    resolvePromise = resolve;
  });

  const render = () => {
    let output = "";

    for (let i = 0; i < text.length; i++) {
      if (text[i] === " ") {
        output += "\u00A0";
        continue;
      }

      output += i < revealed
        ? text[i]
        : SCRAMBLE_CHARS[
        Math.floor(
          Math.random() * SCRAMBLE_CHARS.length
        )
        ];
    }

    element.textContent = output;
  };

  render();

  const finish = () => {
    if (timer) clearInterval(timer);

    scrambleTimers.delete(element);
    element.textContent = text;
    resolvePromise();
  };

  timer = setInterval(() => {
    frame++;

    if (frame % revealEvery === 0) {
      revealed++;
    }

    render();

    if (revealed > text.length) {
      finish();
    }
  }, intervalMs);

  scrambleTimers.set(element, {
    cancel: finish
  });

  return promise;
}

function setLoaderProgress(value, message) {
  const progress = Math.max(0, Math.min(100, Math.round(value)));
  elements.loaderBar.style.width = `${progress}%`;
  elements.loaderPercent.textContent = `${progress}%`;

  if (message) {
    return scrambleText(elements.loaderMessage, message);
  }

  return Promise.resolve();
}

function hideLoading() {
  setTimeout(() => elements.loadingScreen.classList.add("is-hidden"), 250);
}

function normalizePlatform(value) {
  if (typeof value !== "string") return null;
  const key = value.trim().toLocaleLowerCase();
  return PLATFORM_ALIASES[key] || null;
}

function normalizePlatforms(value) {
  if (!Array.isArray(value)) return [];

  return [...new Set(
    value
      .map(normalizePlatform)
      .filter(Boolean)
  )];
}

function getSmallPosterUrl(originalUrl) {
  if (!originalUrl) return "";

  try {
    const url = new URL(originalUrl, window.location.href);

    const filename = url.pathname.split("/").pop();
    if (!filename) return originalUrl;

    const dot = filename.lastIndexOf(".");
    if (dot === -1) return originalUrl;

    const baseName = filename.slice(0, dot);

    url.pathname =
      url.pathname.slice(
        0,
        url.pathname.lastIndexOf("/") + 1
      ) +
      `${baseName}_small.jpg`;

    return url.toString();
  } catch {
    return originalUrl.replace(/\.[^/.]+$/, "_small.jpg");
  }
}

function getPosterUrl(originalUrl) {
  if (!originalUrl) return "";
  if (state.connectionMode === "slow") {
    return getSmallPosterUrl(originalUrl);
  }
  return originalUrl;
}

function detectConnectionQuality(timing = null) {
  const conn =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;

  if (conn) {
    if (conn.saveData) {
      console.log("[GameWall] Save-Data active -> SLOW connection mode");
      return "slow";
    }

    if (conn.effectiveType === "slow-2g" || conn.effectiveType === "2g") {
      console.log(`[GameWall] Effective network type (${conn.effectiveType}) -> SLOW connection mode`);
      return "slow";
    }

    if (typeof conn.downlink === "number" && conn.downlink > 0) {
      if (conn.downlink < 2) {
        console.log(`[GameWall] Network downlink (${conn.downlink} Mbps < 2 Mbps) -> SLOW connection mode`);
        return "slow";
      }
      console.log(`[GameWall] Network downlink (${conn.downlink} Mbps >= 2 Mbps) -> GOOD connection mode`);
      return "good";
    }
  }

  // Fallback estimation using games.json download throughput
  if (timing && typeof timing.bytes === "number" && typeof timing.durationMs === "number" && timing.bytes > 0) {
    if (timing.durationMs >= 200) {
      const durationSeconds = timing.durationMs / 1000;
      const mbps = (timing.bytes * 8) / (durationSeconds * 1_000_000);
      console.log(`[GameWall] Measured database throughput: ${mbps.toFixed(2)} Mbps (${timing.durationMs}ms for ${timing.bytes} bytes)`);
      if (mbps < 2) {
        return "slow";
      }
      return "good";
    }
  }

  return "good";
}

function normaliseGame(game, index) {
  const rating = Number(game.rating);
  return {
    id: typeof game.id === "string" && game.id.trim() ? game.id.trim() : `entry-${index + 1}`,
    title: typeof game.title === "string" && game.title.trim() ? game.title.trim() : "Untitled game",
    abbreviations: typeof game.abbreviations === "string" ? game.abbreviations.trim() : "",
    image: typeof game.image === "string" ? game.image.trim() : "",
    rating: Number.isFinite(rating) ? Math.max(0, Math.min(10, rating)) : 0,
    gameplay: typeof game.gameplay === "string" && game.gameplay.trim() ? game.gameplay.trim() : "Unspecified",
    platforms: normalizePlatforms(game.platforms),
    url: isSafeUrl(game.url) ? game.url : "#",
    description: typeof game.description === "string" ? game.description.trim() : "",
    originalIndex: index
  };
}

function isSafeUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function loadGames() {
  setLoaderProgress(18, "CONNECTING TO DATABASE...");
  try {
    const fetchStart = performance.now();
    const response = await fetch("games.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`games.json returned ${response.status}`);

    setLoaderProgress(62, "VERIFYING ARCHIVE DATA...");
    const blob = await response.blob();
    const fetchDurationMs = performance.now() - fetchStart;
    const jsonText = await blob.text();
    const data = JSON.parse(jsonText);
    if (!Array.isArray(data)) throw new Error("games.json must contain an array of games");

    state.connectionMode = detectConnectionQuality({
      bytes: blob.size,
      durationMs: fetchDurationMs
    });
    console.log(`[GameWall] Connection mode set: ${state.connectionMode.toUpperCase()}`);

    state.games = data.map(normaliseGame);
    setLoaderProgress(
      72,
      "CHECKING DATABASE TIMESTAMP..."
    );
    await loadDatabaseUpdate();
    setLoaderProgress(
      82,
      "BUILDING COLLECTION..."
    );

    updateStatistics();
    renderGames();
    await setLoaderProgress(100, "DATABASE READY");

    // Let the final scramble finish and remain readable for one second.
    await new Promise((resolve) => window.setTimeout(resolve, 1000));

    hideLoading();
    checkInitialReviewSlug();
  } catch (error) {
    console.error("GameWall could not load games.json:", error);
    showError();

    await setLoaderProgress(100, "DATABASE UNAVAILABLE");

    await new Promise((resolve) => window.setTimeout(resolve, 1000));

    hideLoading();
  }
}

function matchesSearch(game, query, searchMode) {
  if (!query) return true;

  switch (searchMode) {
    case "gameplay":
      return (game.gameplay || "").toLocaleLowerCase().includes(query);

    case "review":
      return (game.description || "").toLocaleLowerCase().includes(query);

    case "everything": {
      if ((game.title || "").toLocaleLowerCase().includes(query)) return true;
      if ((game.abbreviations || "").toLocaleLowerCase().includes(query)) return true;
      if ((game.gameplay || "").toLocaleLowerCase().includes(query)) return true;
      if ((game.description || "").toLocaleLowerCase().includes(query)) return true;
      if ((game.url || "").toLocaleLowerCase().includes(query)) return true;
      if ((game.image || "").toLocaleLowerCase().includes(query)) return true;
      if ((game.id || "").toLocaleLowerCase().includes(query)) return true;

      const cardId = `gw-${String((game.originalIndex ?? 0) + 1).padStart(3, "0")}`;
      if (cardId.includes(query)) return true;

      const rawRating = String(game.rating);
      const formattedRating = formatRating(game.rating);
      if (rawRating.includes(query) || formattedRating.includes(query)) return true;

      if (Array.isArray(game.platforms)) {
        const platformsText = game.platforms.join(" ").toLocaleLowerCase();
        if (platformsText.includes(query)) return true;
      }

      for (const [key, value] of Object.entries(game)) {
        if (typeof value === "string" && value.toLocaleLowerCase().includes(query)) {
          return true;
        }
        if (typeof value === "number" && String(value).includes(query)) {
          return true;
        }
        if (Array.isArray(value)) {
          const arrStr = value.map((v) => String(v ?? "")).join(" ").toLocaleLowerCase();
          if (arrStr.includes(query)) return true;
        }
      }

      return false;
    }

    case "title":
    default: {
      const titleMatch = (game.title || "").toLocaleLowerCase().includes(query);
      const abbrevMatch = (game.abbreviations || "").toLocaleLowerCase().includes(query);
      return titleMatch || abbrevMatch;
    }
  }
}

function matchesFilter(game, filterMode) {
  const gameplay = game.gameplay || "";
  const description = (game.description || "").trim();

  switch (filterMode) {
    case "100":
      return gameplay.includes("100%");

    case "not-100":
      return !gameplay.includes("100%");

    case "reviews":
      return description.length > 0;

    case "no-reviews":
      return description.length === 0;

    case "none":
    default:
      return true;
  }
}

function getVisibleGames() {
  const query = state.query.trim().toLocaleLowerCase();
  const searchMode = state.searchMode || "title";
  const filterMode = state.filterMode || "none";

  const filtered = state.games.filter((game) => {
    return matchesSearch(game, query, searchMode) && matchesFilter(game, filterMode);
  });

  switch (state.sortMode) {
    case "rating-desc":
      return filtered.sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title));
    case "rating-asc":
      return filtered.sort((a, b) => a.rating - b.rating || a.title.localeCompare(b.title));
    case "title-asc":
      return filtered.sort((a, b) => a.title.localeCompare(b.title));
    case "title-desc":
      return filtered.sort((a, b) => b.title.localeCompare(a.title));
    default:
      return filtered.sort((a, b) => a.originalIndex - b.originalIndex);
  }
}

function renderGames() {
  const games = getVisibleGames();
  elements.grid.replaceChildren();
  elements.resultCount.textContent = `${games.length} ${games.length === 1 ? "ENTRY" : "ENTRIES"}`;

  if (games.length === 0) {
    showEmptyState(state.games.length === 0 ? "database" : "search");
    return;
  }

  elements.emptyState.hidden = true;
  const fragment = document.createDocumentFragment();
  games.forEach((game, index) => fragment.append(createGameCard(game, index)));
  elements.grid.append(fragment);
}

function renderPlatforms(container, platforms, gameTitle) {
  container.replaceChildren();

  platforms.forEach((platform) => {
    const definition = PLATFORM_ICONS[platform];
    if (!definition) return;

    const badge = document.createElement("span");
    badge.className = "platform-badge";
    badge.title = `${gameTitle} — ${definition.label}`;
    badge.setAttribute("aria-label", definition.label);
    badge.innerHTML = definition.svg;
    container.append(badge);
  });

  container.hidden = platforms.length === 0;
}

function setupGameplayMarquee(textElement) {
  if (!textElement) return;

  const track = textElement.parentElement;
  const badge = track?.parentElement;

  if (!track || !badge) return;

  track.classList.remove("is-scrolling");
  track.style.removeProperty("--gameplay-duration");

  textElement.removeAttribute("data-text");

  const textWidth = textElement.scrollWidth;

  const styles = getComputedStyle(badge);

  const availableWidth =
    badge.clientWidth -
    parseFloat(styles.paddingLeft) -
    parseFloat(styles.paddingRight);

  if (textWidth <= availableWidth + 1) {
    return;
  }

  textElement.setAttribute(
    "data-text",
    textElement.textContent
  );

  const gap = 40;
  const distance = textWidth + gap;

  const duration = Math.max(
    5,
    distance / 28
  );

  track.style.setProperty(
    "--gameplay-distance",
    `${distance}px`
  );

  track.style.setProperty(
    "--gameplay-duration",
    `${duration}s`
  );

  track.classList.add("is-scrolling");
}

const gameTitleObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;

    const curtain = entry.target;
    const titleElement = curtain.querySelector(".game-title");

    if (!titleElement) return;

    observer.unobserve(curtain);

    requestAnimationFrame(() => {
      fitText(titleElement, 0.85, 1.35);

      requestAnimationFrame(() => {
        curtain.classList.add("is-revealed");
      });
    });
  });
}, {
  threshold: 0.15,
  rootMargin: "0px 0px -5% 0px"
});

function observeGameTitle(curtainElement) {
  if (curtainElement) gameTitleObserver.observe(curtainElement);
}

function createGameCard(game, position) {
  const card = elements.template.content.cloneNode(true);
  const cardElement = card.querySelector(".game-card");
  const staggerIndex = Math.min(position, 19);
  cardElement.style.setProperty(
    "--card-delay",
    `${staggerIndex * 35}ms`
  );
  cardElement.classList.add("is-entering");
  cardElement.addEventListener("animationend", () => {
    cardElement.classList.remove("is-entering");
  }, { once: true });
  const posterLink = card.querySelector(".poster-link");
  const posterFrame = card.querySelector(".poster-frame");
  const image = card.querySelector(".game-poster");
  const posterLoader = card.querySelector(".poster-loader");
  const placeholder = card.querySelector(".poster-placeholder");
  const cardId = card.querySelector(".card-id");
  const platformBadges = card.querySelector(".platform-badges");
  const rating = card.querySelector(".rating-badge b");
  const titleCurtain = card.querySelector(".game-title-curtain");
  const title = card.querySelector(".game-title");
  const gameplay = card.querySelector(".gameplay-text");
  const viewLink = card.querySelector(".view-game");

  const identifier = `GW-${String(position + 1).padStart(3, "0")}`;
  cardId.textContent = identifier;
  renderPlatforms(platformBadges, game.platforms, game.title);
  rating.textContent = formatRating(game.rating);
  title.textContent = game.title;
  title.setAttribute("aria-label", game.title);
  requestAnimationFrame(() => {
    fitText(title, 0.85, 1.35);
    observeGameTitle(titleCurtain);
  });
  gameplay.textContent = game.gameplay;
  requestAnimationFrame(() => {
    setupGameplayMarquee(gameplay);
    observeGameplayBadge(gameplay);
  });
  posterLink.href = game.url;
  posterLink.setAttribute("aria-label", `Open ${game.title} in a new tab`);
  viewLink.href = game.url;
  viewLink.setAttribute("aria-label", `View ${game.title} in a new tab`);

  const reviewButton = card.querySelector(".review-button");
  if (game.description) {
    reviewButton.hidden = false;
    reviewButton.setAttribute("aria-label", `Read review for ${game.title}`);
    reviewButton.addEventListener("click", () => {
      openReviewModal(game, identifier, reviewButton);
    });
  } else {
    reviewButton?.remove();
  }

  if (game.image) {
    const originalUrl = game.image.trim();
    const isSlow = state.connectionMode === "slow";
    const primaryUrl = isSlow ? getSmallPosterUrl(originalUrl) : originalUrl;
    let currentUrl = primaryUrl;

    console.log(
      `[GameWall] Loading poster for "${game.title}":`,
      currentUrl,
      isSlow ? "(slow connection mode: small poster)" : "(good connection mode: standard poster)"
    );
    posterFrame.style.setProperty(
      "--poster-bg",
      `url("${currentUrl}")`
    );
    image.classList.add("is-loading");
    placeholder.hidden = true;
    posterLoader.classList.remove("is-hidden");
    image.alt = `${game.title} poster`;

    const onPosterLoad = () => {
      console.log(
        `[GameWall] Poster loaded: ${game.title}`,
        image.naturalWidth,
        image.naturalHeight
      );
      image.classList.remove("is-loading");
      placeholder.hidden = true;
      posterLoader.classList.add("is-hidden");
    };

    const onPosterError = () => {
      if (currentUrl !== originalUrl && originalUrl) {
        console.warn(
          `[GameWall] Small poster failed for "${game.title}", falling back to original:`,
          originalUrl
        );
        currentUrl = originalUrl;
        posterFrame.style.setProperty(
          "--poster-bg",
          `url("${currentUrl}")`
        );
        image.src = currentUrl;
        return;
      }

      console.error(
        `[GameWall] Poster FAILED: ${game.title}`,
        currentUrl
      );
      image.classList.add("is-loading");
      posterLoader.classList.add("is-hidden");
      placeholder.hidden = false;
    };

    image.addEventListener("load", onPosterLoad);
    image.addEventListener("error", onPosterError);
    image.src = currentUrl;
  } else {
    image.classList.add("is-loading");
    posterLoader.classList.add("is-hidden");
    placeholder.hidden = false;
  }

  if (game.url === "#") {
    posterLink.removeAttribute("href");
    viewLink.removeAttribute("href");
    posterLink.setAttribute("aria-disabled", "true");
    viewLink.setAttribute("aria-disabled", "true");
  }

  return card;
}

function formatRating(rating) {
  return Number(rating).toFixed(1);
}

function updateStatistics() {
  const games = state.games;
  const ratings = games
    .map((game) => game.rating)
    .filter((rating) => Number.isFinite(rating));
  const highest = games.length
    ? games.reduce(
      (best, game) =>
        game.rating > best.rating ? game : best
    )
    : null;
  animateValue(
    elements.totalGames,
    games.length,
    (value) => String(value).padStart(2, "0")
  );
  animateValue(
    elements.averageRating,
    ratings.length
      ? ratings.reduce(
        (sum, rating) => sum + rating,
        0
      ) / ratings.length
      : 0,
    (value) => value.toFixed(2),
    650
  );
  elements.highestRated.textContent =
    highest ? highest.title : "—";
  elements.highestRatedDetail.textContent =
    highest
      ? `MY SCORE ${formatRating(highest.rating)} / 10`
      : "WAITING FOR DATA";
  requestAnimationFrame(() => {
    fitText(
      elements.highestRated,
      0.85,
      2.3
    );
  });
}

async function loadDatabaseUpdate() {
  const apiUrl =
    "https://api.github.com/repos/" +
    "IntenseParijat/GameWall/commits" +
    "?path=games.json&per_page=1" +
    "&_=" + Date.now();

  try {
    const response = await fetch(apiUrl, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(
        `GitHub API returned ${response.status}`
      );
    }

    const commits = await response.json();

    if (!Array.isArray(commits) || !commits.length) {
      throw new Error("No games.json commit found");
    }

    const commit = commits[0];
    const dateString =
      commit?.commit?.author?.date ||
      commit?.commit?.committer?.date;

    if (!dateString) {
      throw new Error(
        "GitHub commit timestamp unavailable"
      );
    }

    const date = new Date(dateString);

    const dateText = new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone: "UTC",
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    ).format(date).toUpperCase();

    const timeText = new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone: "UTC",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }
    ).format(date);

    elements.databaseUpdate.textContent = dateText;
    elements.databaseUpdateDetail.textContent =
      `${timeText} UTC - LAST UPDATE TIME`;

  } catch (error) {
    console.error(
      "GameWall could not determine the games.json update time:",
      error
    );

    elements.databaseUpdate.textContent = "—";
    elements.databaseUpdateDetail.textContent =
      "GITHUB TIMESTAMP UNAVAILABLE";
  }
}

function animateValue(element, target, formatter, duration = 520) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || target === 0) {
    element.textContent = formatter(target);
    return;
  }

  const start = performance.now();
  function tick(now) {
    const elapsed = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - elapsed, 3);
    element.textContent = formatter(target * eased);
    if (elapsed < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function showEmptyState(type) {
  elements.emptyState.hidden = false;
  if (type === "database") {
    elements.emptyTitle.textContent = "GAME DATABASE EMPTY";
    elements.emptyMessage.textContent = "NO GAMES HAVE BEEN ADDED YET";
  } else {
    elements.emptyTitle.textContent = "NO MATCH FOUND";
    elements.emptyMessage.textContent = "DATABASE RETURNED 0 RESULTS";
  }
}

function showError() {
  state.games = [];
  elements.grid.replaceChildren();
  elements.resultCount.textContent = "DATABASE OFFLINE";
  elements.emptyState.hidden = false;
  elements.emptyTitle.textContent = "DATABASE CONNECTION FAILED";
  elements.emptyMessage.textContent = "UNABLE TO LOAD GAMEWALL DATA. PLEASE TRY AGAIN LATER.";
  updateStatistics();
}

function fitText(element, minSize, maxSize) {
  if (!element) return;
  element.style.fontSize = `${maxSize}rem`;
  const maxHeight = element.clientHeight;
  let size = maxSize;
  while (
    (
      element.scrollWidth > element.clientWidth ||
      element.scrollHeight > maxHeight
    ) &&
    size > minSize
  ) {
    size -= 0.025;
    element.style.fontSize = `${size}rem`;
  }
}

const gameplayObserver =
  new ResizeObserver(() => {
    document
      .querySelectorAll(".gameplay-text")
      .forEach((textElement) => {
        setupGameplayMarquee(textElement);
      });
  });

function observeGameplayBadge(textElement) {
  const badge = textElement?.parentElement?.parentElement;

  if (badge) {
    gameplayObserver.observe(badge);
  }
}

const VALID_SEARCH_MODES = ["title", "gameplay", "review", "everything"];
const VALID_FILTERS = ["none", "100", "not-100", "reviews", "no-reviews"];

function buildSearchQueryString(query = state.query, searchMode = state.searchMode, filterMode = state.filterMode) {
  const params = new URLSearchParams();
  const trimmed = (query || "").trim();
  if (trimmed) {
    params.set("s", trimmed);
  }
  if (searchMode && searchMode !== "title" && VALID_SEARCH_MODES.includes(searchMode)) {
    params.set("p1", searchMode);
  }
  if (filterMode && filterMode !== "none" && VALID_FILTERS.includes(filterMode)) {
    params.set("p2", filterMode);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function syncSearchUrl() {
  if (activeReviewSlug) return;
  const currentPath = window.location.pathname;
  const qs = buildSearchQueryString();
  const newUrl = `${currentPath}${qs}${window.location.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (currentUrl !== newUrl) {
    window.history.replaceState({ type: "search" }, "", newUrl);
  }
}

function initUrlState() {
  try {
    const params = new URLSearchParams(window.location.search);

    const sParam = params.get("s");
    if (typeof sParam === "string" && sParam.length > 0) {
      state.query = sParam;
      if (elements.search) {
        elements.search.value = sParam;
      }
    }

    const p1Param = params.get("p1");
    if (p1Param && VALID_SEARCH_MODES.includes(p1Param)) {
      state.searchMode = p1Param;
      if (elements.searchMode) {
        elements.searchMode.value = p1Param;
      }
    } else {
      state.searchMode = "title";
      if (elements.searchMode) {
        elements.searchMode.value = "title";
      }
    }

    const p2Param = params.get("p2");
    if (p2Param && VALID_FILTERS.includes(p2Param)) {
      state.filterMode = p2Param;
      if (elements.filter) {
        elements.filter.value = p2Param;
      }
    } else {
      state.filterMode = "none";
      if (elements.filter) {
        elements.filter.value = "none";
      }
    }
  } catch (err) {
    console.warn("[GameWall] Error initializing URL search state:", err);
  }
}

if (elements.search) {
  elements.search.addEventListener("input", (event) => {
    state.query = event.target.value;
    syncSearchUrl();
    renderGames();
  });
}

if (elements.searchMode) {
  elements.searchMode.addEventListener("change", (event) => {
    state.searchMode = event.target.value;
    syncSearchUrl();
    renderGames();
  });
}

if (elements.filter) {
  elements.filter.addEventListener("change", (event) => {
    state.filterMode = event.target.value;
    syncSearchUrl();
    renderGames();
  });
}

if (elements.sort) {
  elements.sort.addEventListener("change", (event) => {
    state.sortMode = event.target.value;
    renderGames();
  });
}

function initBackgroundCanvas() {
  const canvas = document.querySelector("#background-canvas");
  if (!canvas) return;

  const context = canvas.getContext("2d", {
    alpha: true,
    desynchronized: true
  });

  if (!context) return;

  const mobileQuery = window.matchMedia("(max-width: 760px)");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const state = {
    width: 0,
    height: 0,
    dpr: 1,
    nodes: [],
    circuits: [],
    raf: 0,
    lastTime: 0,
    visible: true
  };

  const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, value));

  function makeNode(index) {
    const angle = Math.random() * Math.PI * 2;

    return {
      x: Math.random() * state.width,
      y: Math.random() * state.height,
      radius: Math.random() < .85 ? 1 : 1.5,
      vx: Math.cos(angle) * (.7 + Math.random() * .8),
      vy: Math.sin(angle) * (.7 + Math.random() * .8),
      phase: Math.random() * Math.PI * 2,
      pulse: .35 + Math.random() * .65,
      hue: index % 5 === 0 ? "purple" : "cyan"
    };
  }

  function makeCircuit() {
    const startX = Math.random() * state.width;
    const startY = Math.random() * state.height;
    const horizontal = 70 + Math.random() * 170;
    const vertical = 40 + Math.random() * 120;
    const direction = Math.random() < .5 ? 1 : -1;
    const bend = Math.random() < .5 ? 1 : -1;

    return {
      points: [
        { x: startX, y: startY },
        { x: clamp(startX + horizontal * direction, 0, state.width), y: startY },
        { x: clamp(startX + horizontal * direction, 0, state.width), y: clamp(startY + vertical * bend, 0, state.height) }
      ],
      phase: Math.random() * Math.PI * 2,
      speed: .05 + Math.random() * .08,
      color: Math.random() < .5 ? "cyan" : "purple"
    };
  }

  function resize() {
    if (mobileQuery.matches) {
      if (state.raf) {
        cancelAnimationFrame(state.raf);
        state.raf = 0;
      }
      context.clearRect(0, 0, state.width, state.height);
      return;
    }

    const rect = canvas.getBoundingClientRect();

    state.width = Math.max(1, rect.width);
    state.height = Math.max(1, rect.height);
    state.dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);

    context.setTransform(
      state.dpr,
      0,
      0,
      state.dpr,
      0,
      0
    );

    const area = state.width * state.height;
    const desiredNodes = clamp(Math.round(area / 24000), 30, 72);

    while (state.nodes.length < desiredNodes) {
      state.nodes.push(makeNode(state.nodes.length));
    }

    if (state.nodes.length > desiredNodes) {
      state.nodes.length = desiredNodes;
    }

    const desiredCircuits = 11;

    while (state.circuits.length < desiredCircuits) {
      state.circuits.push(makeCircuit());
    }

    if (state.circuits.length > desiredCircuits) {
      state.circuits.length = desiredCircuits;
    }

    for (const node of state.nodes) {
      node.x = clamp(node.x, 0, state.width);
      node.y = clamp(node.y, 0, state.height);
    }
  }

  function color(kind, alpha) {
    return kind === "purple"
      ? `rgba(138, 92, 255, ${alpha})`
      : `rgba(0, 240, 255, ${alpha})`;
  }

  function drawCircuit(circuit, time) {
    const glow = .22 + (
      Math.sin(time * circuit.speed + circuit.phase) + 1
    ) * .05;

    context.beginPath();
    context.moveTo(
      circuit.points[0].x,
      circuit.points[0].y
    );

    for (let i = 1; i < circuit.points.length; i++) {
      context.lineTo(
        circuit.points[i].x,
        circuit.points[i].y
      );
    }

    context.strokeStyle = color(circuit.color, .095);
    context.lineWidth = 1;
    context.stroke();

    // Small travelling pulse along the 3-point circuit.
    const p = (
      (time * circuit.speed + circuit.phase / (Math.PI * 2)) % 1 + 1
    ) % 1;

    let a;
    let b;
    let local;

    if (p < .5) {
      a = circuit.points[0];
      b = circuit.points[1];
      local = p * 2;
    } else {
      a = circuit.points[1];
      b = circuit.points[2];
      local = (p - .5) * 2;
    }

    const px = a.x + (b.x - a.x) * local;
    const py = a.y + (b.y - a.y) * local;

    context.beginPath();
    context.arc(
      px,
      py,
      1.4,
      0,
      Math.PI * 2
    );
    context.fillStyle = color(
      circuit.color,
      glow
    );
    context.shadowBlur = 12;
    context.shadowColor = color(
      circuit.color,
      .75
    );
    context.fill();
    context.shadowBlur = 0;
  }

  function render(time) {
    if (mobileQuery.matches) {
      if (state.raf) {
        cancelAnimationFrame(state.raf);
        state.raf = 0;
      }
      context.clearRect(0, 0, state.width, state.height);
      return;
    }

    if (!state.visible) {
      state.raf = requestAnimationFrame(render);
      return;
    }

    const seconds = time * .001;

    context.clearRect(
      0,
      0,
      state.width,
      state.height
    );

    // Subtle upper technical field.
    const gradient = context.createRadialGradient(
      state.width * .5,
      state.height * .18,
      0,
      state.width * .5,
      state.height * .18,
      state.width * .62
    );

    gradient.addColorStop(
      0,
      "rgba(0, 240, 255, .045)"
    );
    gradient.addColorStop(
      .5,
      "rgba(138, 92, 255, .022)"
    );
    gradient.addColorStop(
      1,
      "rgba(5, 7, 13, 0)"
    );

    context.fillStyle = gradient;
    context.fillRect(
      0,
      0,
      state.width,
      state.height
    );

    for (const circuit of state.circuits) {
      drawCircuit(circuit, seconds);
    }

    const maxDistance = 135;

    for (let i = 0; i < state.nodes.length; i++) {
      const node = state.nodes[i];

      if (!motionQuery.matches) {
        node.x += node.vx * .015;
        node.y += node.vy * .015;

        if (node.x < -20) node.x = state.width + 20;
        if (node.x > state.width + 20) node.x = -20;
        if (node.y < -20) node.y = state.height + 20;
        if (node.y > state.height + 20) node.y = -20;
      }

      const pulse =
        .36 +
        (
          Math.sin(seconds * .7 + node.phase) + 1
        ) * .10;

      for (let j = i + 1; j < state.nodes.length; j++) {
        const other = state.nodes[j];
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const distance = Math.hypot(dx, dy);

        if (distance > maxDistance) continue;

        const opacity =
          (1 - distance / maxDistance) * .085;

        context.beginPath();
        context.moveTo(node.x, node.y);
        context.lineTo(other.x, other.y);
        context.strokeStyle = color(
          node.hue,
          opacity
        );
        context.lineWidth = .7;
        context.stroke();
      }

      context.beginPath();
      context.arc(
        node.x,
        node.y,
        node.radius,
        0,
        Math.PI * 2
      );
      context.fillStyle = color(
        node.hue,
        pulse * node.pulse
      );
      context.fill();
    }

    state.raf = requestAnimationFrame(render);
  }

  function updateAnimationLoop() {
    if (mobileQuery.matches) {
      if (state.raf) {
        cancelAnimationFrame(state.raf);
        state.raf = 0;
      }
      context.clearRect(0, 0, state.width, state.height);
      return;
    }

    resize();

    if (motionQuery.matches) {
      if (state.raf) {
        cancelAnimationFrame(state.raf);
        state.raf = 0;
      }
      render(0);
      return;
    }

    if (!state.raf) {
      state.raf = requestAnimationFrame(render);
    }
  }

  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      state.visible = entries[0]?.isIntersecting !== false;
    },
    { threshold: 0 }
  );

  visibilityObserver.observe(canvas);

  mobileQuery.addEventListener("change", updateAnimationLoop);
  motionQuery.addEventListener("change", updateAnimationLoop);

  window.addEventListener(
    "resize",
    () => {
      if (mobileQuery.matches) {
        if (state.raf) {
          cancelAnimationFrame(state.raf);
          state.raf = 0;
        }
        context.clearRect(0, 0, state.width, state.height);
      } else {
        resize();
        if (!state.raf && !motionQuery.matches) {
          state.raf = requestAnimationFrame(render);
        }
      }
    },
    { passive: true }
  );

  updateAnimationLoop();
}

let accessCounterLoaded = false;

async function loadAccessCounter() {
  if (accessCounterLoaded) return;
  accessCounterLoaded = true;

  const counterElement = document.querySelector("#access-counter");
  if (!counterElement) return;

  try {
    const response = await fetch(
      "https://abacus.jasoncameron.dev/hit/intenseparijat.github.io/gamewall",
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`Counter API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    if (typeof data.value === "number") {
      counterElement.textContent = data.value.toLocaleString();
    } else {
      throw new Error("Invalid counter response payload");
    }
  } catch (error) {
    console.warn("GameWall access counter unavailable:", error);
    counterElement.textContent = "—";
  }
}

function validateInstagramUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const decoded = rawUrl
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();

  try {
    const withProto = decoded.startsWith("//") ? `https:${decoded}` : decoded;
    const parsed = new URL(withProto);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname !== "instagram.com" && hostname !== "www.instagram.com") {
      return null;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    parsed.protocol = "https:";
    return parsed.toString();
  } catch {
    return null;
  }
}

function processInstagramEmbeds(text) {
  if (!text || typeof text !== "string") return "";

  // 1. Discard official Instagram embed.js script tag if present in Markdown
  let cleaned = text.replace(
    /<script\b[^>]*?src=["'](?:https?:)?\/\/(?:www\.)?instagram\.com\/embed\.js["'][^>]*?>\s*(?:<\/script>)?/gi,
    ""
  );

  // 2. Recognize official Instagram blockquote embed code
  const instagramBlockquoteRegex = /<blockquote\b[^>]*\bclass=["'][^"']*\binstagram-media\b[^"']*["'][^>]*>[\s\S]*?<\/blockquote>/gi;

  cleaned = cleaned.replace(instagramBlockquoteRegex, (match) => {
    const permalinkMatch = match.match(/data-instgrm-permalink=["']([^"']+)["']/i);
    if (!permalinkMatch || !permalinkMatch[1]) {
      return "";
    }

    const validatedUrl = validateInstagramUrl(permalinkMatch[1]);
    if (!validatedUrl) {
      return "";
    }

    // Replace with safe GameWall placeholder element containing only the validated permalink
    return `\n\n<div class="review-instagram-placeholder" data-instagram-permalink="${escapeHtml(validatedUrl)}"></div>\n\n`;
  });

  return cleaned;
}

function processSafeEmbeds(markdown) {
  if (!markdown) return "";

  const lines = markdown.split("\n");
  const processed = lines.map((line) => {
    const trimmed = line.trim();

    // Standalone YouTube URL: https://www.youtube.com/watch?v=ID or https://youtu.be/ID or embed/
    const ytMatch = trimmed.match(
      /^(?:https?:)?\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S*)?$/i
    );
    if (ytMatch) {
      const videoId = encodeURIComponent(ytMatch[1]);
      return `<div class="review-video-embed"><iframe src="https://www.youtube-nocookie.com/embed/${videoId}" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>`;
    }

    // Standalone Vimeo URL: https://vimeo.com/ID
    const vimeoMatch = trimmed.match(
      /^(?:https?:)?\/\/(?:www\.)?vimeo\.com\/(\d+)(?:\S*)?$/i
    );
    if (vimeoMatch) {
      const videoId = encodeURIComponent(vimeoMatch[1]);
      return `<div class="review-video-embed"><iframe src="https://player.vimeo.com/video/${videoId}" allowfullscreen allow="autoplay; fullscreen; picture-in-picture"></iframe></div>`;
    }

    return line;
  });

  return processed.join("\n");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function fallbackMarkdownParse(text) {
  if (!text) return "";

  const embedBlocks = [];
  let working = text.replace(/<div class="(?:review-video-embed|review-instagram-placeholder)"[\s\S]*?<\/div>/gi, (match) => {
    embedBlocks.push(match);
    return `%%EMBED${embedBlocks.length - 1}%%`;
  });

  const codeBlocks = [];
  working = working.replace(/```([a-z0-9_-]*)[ \t]*\r?\n([\s\S]*?)```/gi, (_, lang, code) => {
    codeBlocks.push(`<pre><code>${escapeHtml(code.trim())}</code></pre>`);
    return `%%CODEBLOCK${codeBlocks.length - 1}%%`;
  });

  working = working.replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`);

  const blocks = working.split(/\r?\n\s*\r?\n/);
  const parsedBlocks = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("%%CODEBLOCK") || trimmed.startsWith("%%EMBED")) {
      parsedBlocks.push(trimmed);
      continue;
    }

    const hMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      parsedBlocks.push(`<h${level}>${hMatch[2]}</h${level}>`);
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoteText = trimmed.replace(/^>\s?/gm, "");
      parsedBlocks.push(`<blockquote><p>${quoteText}</p></blockquote>`);
      continue;
    }

    if (/^(?:---|\*\*\*|___)$/.test(trimmed)) {
      parsedBlocks.push("<hr />");
      continue;
    }

    const lines = trimmed.split(/\r?\n/);
    if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
      const items = lines.map((l) => `<li>${l.replace(/^\s*[-*]\s+/, "")}</li>`).join("");
      parsedBlocks.push(`<ul>${items}</ul>`);
      continue;
    }

    if (lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
      const items = lines.map((l) => `<li>${l.replace(/^\s*\d+\.\s+/, "")}</li>`).join("");
      parsedBlocks.push(`<ol>${items}</ol>`);
      continue;
    }

    parsedBlocks.push(`<p>${lines.join("<br />")}</p>`);
  }

  let result = parsedBlocks.join("\n");

  result = result.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/gi, (_, alt, url) => {
    return `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" loading="lazy" />`;
  });

  result = result.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi, (_, label, url) => {
    return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });

  result = result.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
  result = result.replace(/(?<!_)_([^_]+)_(?!_)/g, "<em>$1</em>");
  result = result.replace(/~~([^~]+)~~/g, "<del>$1</del>");

  result = result.replace(/%%CODEBLOCK(\d+)%%/g, (_, idx) => codeBlocks[Number(idx)] || "");
  result = result.replace(/%%EMBED(\d+)%%/g, (_, idx) => embedBlocks[Number(idx)] || "");

  return result;
}

function fallbackSanitizeHtml(html) {
  const template = document.createElement("template");
  template.innerHTML = html;
  const content = template.content;

  const dangerous = content.querySelectorAll("script, object, embed, style, link, meta, base");
  dangerous.forEach((el) => el.remove());

  const allElements = content.querySelectorAll("*");
  allElements.forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.toLowerCase().trim();
      if (name.startsWith("on") || value.startsWith("javascript:") || value.startsWith("data:text/html")) {
        el.removeAttribute(attr.name);
      }
    }
  });

  return template.innerHTML;
}

function postProcessReviewHtml(cleanHtml) {
  const template = document.createElement("template");
  template.innerHTML = cleanHtml;
  const content = template.content;

  content.querySelectorAll("a").forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (/^https?:\/\//i.test(href)) {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    } else {
      link.removeAttribute("href");
      link.setAttribute("aria-disabled", "true");
    }
  });

  content.querySelectorAll("img").forEach((img) => {
    img.setAttribute("loading", "lazy");
    const src = img.getAttribute("src") || "";
    if (!/^(?:https?:|\/|data:image\/)/i.test(src)) {
      img.remove();
    }
  });

  content.querySelectorAll("iframe").forEach((iframe) => {
    const src = iframe.getAttribute("src") || "";
    const isSafeYoutube = /^https:\/\/(?:www\.)?(?:youtube-nocookie\.com|youtube\.com)\/embed\/[a-zA-Z0-9_-]+/i.test(src);
    const isSafeVimeo = /^https:\/\/player\.vimeo\.com\/video\/\d+/i.test(src);

    if (!isSafeYoutube && !isSafeVimeo) {
      iframe.remove();
    } else {
      iframe.setAttribute("loading", "lazy");
      iframe.setAttribute("allowfullscreen", "true");
    }
  });

  return template.innerHTML;
}

function renderReviewMarkdown(rawMarkdown) {
  if (!rawMarkdown || typeof rawMarkdown !== "string") return "";

  const instagramProcessed = processInstagramEmbeds(rawMarkdown);
  const embedProcessed = processSafeEmbeds(instagramProcessed);

  let html = "";
  if (window.marked && typeof window.marked.parse === "function") {
    html = window.marked.parse(embedProcessed, {
      breaks: true,
      gfm: true
    });
  } else {
    html = fallbackMarkdownParse(embedProcessed);
  }

  let cleanHtml = "";
  if (window.DOMPurify && typeof window.DOMPurify.sanitize === "function") {
    cleanHtml = window.DOMPurify.sanitize(html, {
      ADD_TAGS: ["iframe"],
      ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "loading", "data-instagram-permalink"]
    });
  } else {
    cleanHtml = fallbackSanitizeHtml(html);
  }

  return postProcessReviewHtml(cleanHtml);
}

let instagramScriptPromise = null;

function loadInstagramScript() {
  if (window.instgrm?.Embeds) {
    return Promise.resolve(window.instgrm);
  }
  if (instagramScriptPromise) {
    return instagramScriptPromise;
  }

  const existingScript = document.querySelector('script[src*="instagram.com/embed.js"]');
  if (existingScript) {
    instagramScriptPromise = new Promise((resolve, reject) => {
      if (window.instgrm?.Embeds) {
        resolve(window.instgrm);
        return;
      }
      existingScript.addEventListener("load", () => {
        if (window.instgrm?.Embeds) resolve(window.instgrm);
        else reject(new Error("Instagram API missing"));
      }, { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Instagram script")), { once: true });
      setTimeout(() => {
        if (window.instgrm?.Embeds) resolve(window.instgrm);
        else reject(new Error("Instagram script timeout"));
      }, 6000);
    });
    return instagramScriptPromise;
  }

  instagramScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.src = "https://www.instagram.com/embed.js";

    const timer = setTimeout(() => {
      if (window.instgrm?.Embeds) {
        resolve(window.instgrm);
      } else {
        reject(new Error("Instagram embed script timed out"));
      }
    }, 6000);

    script.onload = () => {
      clearTimeout(timer);
      if (window.instgrm?.Embeds) {
        resolve(window.instgrm);
      } else {
        let retries = 0;
        const check = setInterval(() => {
          retries++;
          if (window.instgrm?.Embeds) {
            clearInterval(check);
            resolve(window.instgrm);
          } else if (retries > 25) {
            clearInterval(check);
            reject(new Error("Instagram embed object not available"));
          }
        }, 50);
      }
    };

    script.onerror = (err) => {
      clearTimeout(timer);
      reject(err || new Error("Failed to load Instagram embed script"));
    };

    document.head.appendChild(script);
  });

  return instagramScriptPromise;
}

function createInstagramFallback(permalink) {
  const fallback = document.createElement("div");
  fallback.className = "review-instagram-fallback";

  const info = document.createElement("div");
  info.className = "review-instagram-fallback-info";
  info.innerHTML = `
    <svg class="instagram-fallback-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
    <span class="instagram-fallback-text">View this post on Instagram</span>
  `;

  const link = document.createElement("a");
  link.className = "instagram-fallback-link";
  link.href = permalink;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.innerHTML = `<span>VIEW POST</span><span aria-hidden="true">↗</span>`;

  fallback.append(info, link);
  return fallback;
}

function hydrateInstagramEmbeds(container) {
  if (!container) return;
  const placeholders = Array.from(container.querySelectorAll(".review-instagram-placeholder"));
  if (!placeholders.length) return;

  const items = placeholders.map((placeholder) => {
    const permalink = placeholder.getAttribute("data-instagram-permalink");
    const validated = validateInstagramUrl(permalink);
    if (!validated) {
      placeholder.remove();
      return null;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "review-instagram-wrapper";

    const blockquote = document.createElement("blockquote");
    blockquote.className = "instagram-media";
    blockquote.setAttribute("data-instgrm-permalink", validated);
    blockquote.setAttribute("data-instgrm-version", "14");

    wrapper.appendChild(blockquote);
    placeholder.replaceWith(wrapper);
    return { wrapper, blockquote, permalink: validated };
  }).filter(Boolean);

  if (!items.length) return;

  loadInstagramScript()
    .then((instgrm) => {
      try {
        if (instgrm?.Embeds?.process) {
          instgrm.Embeds.process();
        } else if (window.instgrm?.Embeds?.process) {
          window.instgrm.Embeds.process();
        }
      } catch (err) {
        console.warn("[GameWall] Instagram Embeds.process error:", err);
      }
    })
    .catch((err) => {
      console.warn("[GameWall] Instagram script load failed, using fallback:", err);
      items.forEach(({ wrapper, permalink }) => {
        wrapper.replaceChildren(createInstagramFallback(permalink));
      });
    });

  // Watchdog: If after 5 seconds Instagram's script hasn't injected an iframe or rendered content, display fallback
  setTimeout(() => {
    items.forEach(({ wrapper, permalink }) => {
      if (document.contains(wrapper)) {
        const hasIframe = wrapper.querySelector("iframe");
        const hasProcessedBlock = wrapper.querySelector(".instagram-media-rendered");
        if (!hasIframe && !hasProcessedBlock && wrapper.firstElementChild?.tagName === "BLOCKQUOTE") {
          wrapper.replaceChildren(createInstagramFallback(permalink));
        }
      }
    });
  }, 5000);
}

let lastFocusedElement = null;
let savedScrollY = 0;
let currentReviewGame = null;
let activeReviewSlug = null;
let previousSearchUrl = null;
let copyFeedbackTimeout = null;

function showCopyFeedback() {
  if (!elements.reviewModalShare) return;
  elements.reviewModalShare.classList.add("is-copied");
  elements.reviewModalShare.setAttribute("aria-label", "Review link copied to clipboard");
  if (copyFeedbackTimeout) clearTimeout(copyFeedbackTimeout);
  copyFeedbackTimeout = setTimeout(() => {
    if (elements.reviewModalShare) {
      elements.reviewModalShare.classList.remove("is-copied");
      elements.reviewModalShare.setAttribute("aria-label", "Share review link");
    }
  }, 2000);
}

function legacyCopyToClipboard(text) {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    textarea.setAttribute("readonly", "");
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  } catch (e) {
    console.warn("[GameWall] Legacy clipboard copy failed:", e);
    return false;
  }
}

async function shareCurrentReview() {
  if (!currentReviewGame) return;
  const shareUrl = `${window.location.origin}${window.location.pathname}?review=${encodeURIComponent(currentReviewGame.id)}`;
  const shareData = {
    title: `${currentReviewGame.title} — Review`,
    url: shareUrl
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }
    }
  }

  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(shareUrl);
      showCopyFeedback();
    } else {
      const ok = legacyCopyToClipboard(shareUrl);
      if (ok) showCopyFeedback();
    }
  } catch (err) {
    const ok = legacyCopyToClipboard(shareUrl);
    if (ok) showCopyFeedback();
  }
}

function openReviewModal(game, identifier, triggerElement, fromPopstate = false) {
  if (!game || !game.description) return;

  currentReviewGame = game;

  if (!activeReviewSlug && !fromPopstate) {
    const currentQs = buildSearchQueryString();
    previousSearchUrl = `${window.location.pathname}${currentQs}${window.location.hash}`;
  }

  activeReviewSlug = game.id;

  if (!fromPopstate) {
    const reviewUrl = `${window.location.pathname}?review=${encodeURIComponent(game.id)}${window.location.hash}`;
    window.history.replaceState({ type: "review", slug: game.id }, "", reviewUrl);
  }

  lastFocusedElement = triggerElement || document.activeElement;
  savedScrollY = window.scrollY || window.pageYOffset || 0;

  document.documentElement.classList.add("modal-open");
  document.body.classList.add("modal-open");
  elements.mainContent?.setAttribute("aria-hidden", "true");

  if (elements.reviewModalId) {
    elements.reviewModalId.textContent = identifier;
  }
  if (elements.reviewModalTitle) {
    elements.reviewModalTitle.textContent = `${game.title} — Review`;
  }
  if (elements.reviewModalBody) {
    elements.reviewModalBody.innerHTML = renderReviewMarkdown(game.description);
    elements.reviewModalBody.scrollTop = 0;
    hydrateInstagramEmbeds(elements.reviewModalBody);
  }

  if (elements.reviewModalBackdrop) {
    elements.reviewModalBackdrop.hidden = false;
    elements.reviewModalBackdrop.removeAttribute("aria-hidden");
    requestAnimationFrame(() => {
      elements.reviewModalBackdrop.classList.add("is-open");
      elements.reviewModalClose?.focus();
    });
  }
}

function closeReviewModal(fromPopstate = false) {
  if (!elements.reviewModalBackdrop || elements.reviewModalBackdrop.hidden) return;

  if (!fromPopstate) {
    const restoreUrl = previousSearchUrl || `${window.location.pathname}${buildSearchQueryString()}${window.location.hash}`;
    window.history.replaceState({ type: "search" }, "", restoreUrl);
  }
  previousSearchUrl = null;
  activeReviewSlug = null;
  currentReviewGame = null;

  elements.reviewModalBackdrop.classList.remove("is-open");
  document.documentElement.classList.remove("modal-open");
  document.body.classList.remove("modal-open");
  elements.mainContent?.removeAttribute("aria-hidden");

  window.scrollTo(0, savedScrollY);

  setTimeout(() => {
    elements.reviewModalBackdrop.hidden = true;
    elements.reviewModalBackdrop.setAttribute("aria-hidden", "true");
    if (elements.reviewModalBody) {
      elements.reviewModalBody.innerHTML = "";
    }
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }, 250);
}

function checkInitialReviewSlug() {
  try {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("review");
    if (!slug) return;

    const trimmed = slug.trim().toLowerCase();
    const game = state.games.find((g) => g.id.toLowerCase() === trimmed);
    if (game && game.description) {
      const position = state.games.indexOf(game);
      const identifier = `GW-${String(position + 1).padStart(3, "0")}`;
      previousSearchUrl = `${window.location.pathname}${buildSearchQueryString()}${window.location.hash}`;
      openReviewModal(game, identifier, null, false);
    } else {
      // Invalid slug: ignore/remove gracefully without error
      const cleanUrl = `${window.location.pathname}${buildSearchQueryString()}${window.location.hash}`;
      window.history.replaceState({ type: "search" }, "", cleanUrl);
    }
  } catch (err) {
    console.warn("[GameWall] Error checking initial review slug:", err);
  }
}

function initReviewModalEvents() {
  if (elements.reviewModalShare) {
    elements.reviewModalShare.addEventListener("click", shareCurrentReview);
  }

  if (elements.reviewModalClose) {
    elements.reviewModalClose.addEventListener("click", () => closeReviewModal(false));
  }
  if (elements.reviewModalCloseBtn) {
    elements.reviewModalCloseBtn.addEventListener("click", () => closeReviewModal(false));
  }

  if (elements.reviewModalBackdrop) {
    elements.reviewModalBackdrop.addEventListener("click", (event) => {
      if (event.target === elements.reviewModalBackdrop) {
        closeReviewModal(false);
      }
    });
  }

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.reviewModalBackdrop && !elements.reviewModalBackdrop.hidden) {
      closeReviewModal(false);
    }
  });

  if (elements.reviewModal) {
    elements.reviewModal.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;

      const focusables = Array.from(
        elements.reviewModal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.disabled && el.offsetParent !== null);

      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }
}

window.addEventListener("popstate", () => {
  const currentParams = new URLSearchParams(window.location.search);
  const reviewSlug = currentParams.get("review");

  if (reviewSlug) {
    if (activeReviewSlug !== reviewSlug) {
      const targetGame = state.games.find((g) => g.id.toLowerCase() === reviewSlug.trim().toLowerCase());
      if (targetGame && targetGame.description) {
        const gameIndex = state.games.indexOf(targetGame);
        const identifier = `GW-${String(gameIndex + 1).padStart(3, "0")}`;
        openReviewModal(targetGame, identifier, null, true);
      }
    }
  } else {
    if (elements.reviewModalBackdrop && !elements.reviewModalBackdrop.hidden) {
      closeReviewModal(true);
    }

    const sParam = currentParams.get("s");
    const p1Param = currentParams.get("p1");
    const p2Param = currentParams.get("p2");

    let needsRender = false;
    const newQuery = sParam || "";
    if (state.query !== newQuery) {
      state.query = newQuery;
      if (elements.search) elements.search.value = newQuery;
      needsRender = true;
    }

    const newP1 = (p1Param && VALID_SEARCH_MODES.includes(p1Param)) ? p1Param : "title";
    if (state.searchMode !== newP1) {
      state.searchMode = newP1;
      if (elements.searchMode) elements.searchMode.value = newP1;
      needsRender = true;
    }

    const newP2 = (p2Param && VALID_FILTERS.includes(p2Param)) ? p2Param : "none";
    if (state.filterMode !== newP2) {
      state.filterMode = newP2;
      if (elements.filter) elements.filter.value = newP2;
      needsRender = true;
    }

    if (needsRender) {
      renderGames();
    }
  }
});

initUrlState();
initBackgroundCanvas();
initReviewModalEvents();
loadAccessCounter();

scrambleText(
  document.querySelector(".loading-screen h1"),
  "INITIALIZING GAME WALL"
);

loadGames();

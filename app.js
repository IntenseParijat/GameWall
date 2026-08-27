const state = {
  games: [],
  query: "",
  sortMode: "rating-desc"
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
  loaderMessage: document.querySelector("#loader-message")
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

function normaliseGame(game, index) {
  const rating = Number(game.rating);
  return {
    id: typeof game.id === "string" && game.id.trim() ? game.id.trim() : `entry-${index + 1}`,
    title: typeof game.title === "string" && game.title.trim() ? game.title.trim() : "Untitled game",
    image: typeof game.image === "string" ? game.image.trim() : "",
    rating: Number.isFinite(rating) ? Math.max(0, Math.min(10, rating)) : 0,
    gameplay: typeof game.gameplay === "string" && game.gameplay.trim() ? game.gameplay.trim() : "Unspecified",
    platforms: normalizePlatforms(game.platforms),
    url: isSafeUrl(game.url) ? game.url : "#",
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
    const response = await fetch("games.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(`games.json returned ${response.status}`);

    setLoaderProgress(62, "VERIFYING ARCHIVE DATA...");
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("games.json must contain an array of games");

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
  } catch (error) {
    console.error("GameWall could not load games.json:", error);
    showError();

    await setLoaderProgress(100, "DATABASE UNAVAILABLE");

    await new Promise((resolve) => window.setTimeout(resolve, 1000));

    hideLoading();
  }
}

function getVisibleGames() {
  const query = state.query.trim().toLocaleLowerCase();
  const games = query
    ? state.games.filter((game) => game.title.toLocaleLowerCase().includes(query))
    : [...state.games];

  switch (state.sortMode) {
    case "rating-desc":
      return games.sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title));
    case "rating-asc":
      return games.sort((a, b) => a.rating - b.rating || a.title.localeCompare(b.title));
    case "title-asc":
      return games.sort((a, b) => a.title.localeCompare(b.title));
    case "title-desc":
      return games.sort((a, b) => b.title.localeCompare(a.title));
    default:
      return games.sort((a, b) => a.originalIndex - b.originalIndex);
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

  if (game.image) {
    const imageUrl = game.image.trim();
    console.log(
      `[GameWall] Loading poster for "${game.title}":`,
      imageUrl
    );
    posterFrame.style.setProperty(
      "--poster-bg",
      `url("${imageUrl}")`
    );
    image.classList.add("is-loading");
    placeholder.hidden = true;
    posterLoader.classList.remove("is-hidden");
    image.alt = `${game.title} poster`;
    image.addEventListener("load", () => {
      console.log(
        `[GameWall] Poster loaded: ${game.title}`,
        image.naturalWidth,
        image.naturalHeight
      );
      image.classList.remove("is-loading");
      placeholder.hidden = true;
      posterLoader.classList.add("is-hidden");
    }, { once: true });
    image.addEventListener("error", () => {
      console.error(
        `[GameWall] Poster FAILED: ${game.title}`,
        imageUrl
      );
      image.classList.add("is-loading");
      posterLoader.classList.add("is-hidden");
      placeholder.hidden = false;
    }, { once: true });
    image.src = imageUrl;
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

elements.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderGames();
});

elements.sort.addEventListener("change", (event) => {
  state.sortMode = event.target.value;
  renderGames();
});

function initBackgroundCanvas() {
  const canvas = document.querySelector("#background-canvas");
  if (!canvas) return;

  const context = canvas.getContext("2d", {
    alpha: true,
    desynchronized: true
  });

  if (!context) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

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
    const mobile = state.width <= 760;

    const desiredNodes = mobile
      ? clamp(Math.round(area / 36000), 18, 30)
      : clamp(Math.round(area / 24000), 30, 72);

    while (state.nodes.length < desiredNodes) {
      state.nodes.push(makeNode(state.nodes.length));
    }

    if (state.nodes.length > desiredNodes) {
      state.nodes.length = desiredNodes;
    }

    const desiredCircuits = mobile ? 5 : 11;

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
    const glow = .12 + (
      Math.sin(time * circuit.speed + circuit.phase) + 1
    ) * .025;

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

    context.strokeStyle = color(circuit.color, .055);
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
      1.2,
      0,
      Math.PI * 2
    );
    context.fillStyle = color(
      circuit.color,
      glow
    );
    context.shadowBlur = 9;
    context.shadowColor = color(
      circuit.color,
      .5
    );
    context.fill();
    context.shadowBlur = 0;
  }

  function render(time) {
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
      "rgba(0, 240, 255, .025)"
    );
    gradient.addColorStop(
      .5,
      "rgba(138, 92, 255, .010)"
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

    const maxDistance =
      state.width <= 760 ? 105 : 135;

    for (let i = 0; i < state.nodes.length; i++) {
      const node = state.nodes[i];

      if (!reduceMotion) {
        node.x += node.vx * .015;
        node.y += node.vy * .015;

        if (node.x < -20) node.x = state.width + 20;
        if (node.x > state.width + 20) node.x = -20;
        if (node.y < -20) node.y = state.height + 20;
        if (node.y > state.height + 20) node.y = -20;
      }

      const pulse =
        .22 +
        (
          Math.sin(seconds * .7 + node.phase) + 1
        ) * .06;

      for (let j = i + 1; j < state.nodes.length; j++) {
        const other = state.nodes[j];
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const distance = Math.hypot(dx, dy);

        if (distance > maxDistance) continue;

        const opacity =
          (1 - distance / maxDistance) * .045;

        context.beginPath();
        context.moveTo(node.x, node.y);
        context.lineTo(other.x, other.y);
        context.strokeStyle = color(
          node.hue,
          opacity
        );
        context.lineWidth = .55;
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

  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      state.visible = entries[0]?.isIntersecting !== false;
    },
    { threshold: 0 }
  );

  visibilityObserver.observe(canvas);

  window.addEventListener(
    "resize",
    resize,
    { passive: true }
  );

  resize();

  if (reduceMotion) {
    render(0);
    cancelAnimationFrame(state.raf);
    return;
  }

  state.raf = requestAnimationFrame(render);
}


initBackgroundCanvas();

scrambleText(
  document.querySelector(".loading-screen h1"),
  "INITIALIZING GAME WALL"
);

loadGames();

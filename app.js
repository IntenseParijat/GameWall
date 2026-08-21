const state = {
  games: [],
  query: "",
  sortMode: "default"
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
  completedGames: document.querySelector("#completed-games"),
  highestRated: document.querySelector("#highest-rated"),
  highestRatedDetail: document.querySelector("#highest-rated-detail"),
  loadingScreen: document.querySelector("#loading-screen"),
  loaderBar: document.querySelector("#loader-bar"),
  loaderPercent: document.querySelector("#loader-percent"),
  loaderMessage: document.querySelector("#loader-message")
};

function setLoaderProgress(value, message) {
  const progress = Math.max(0, Math.min(100, Math.round(value)));
  elements.loaderBar.style.width = `${progress}%`;
  elements.loaderPercent.textContent = `${progress}%`;
  if (message) elements.loaderMessage.textContent = message;
}

function hideLoading() {
  setTimeout(() => elements.loadingScreen.classList.add("is-hidden"), 250);
}

function normaliseGame(game, index) {
  const rating = Number(game.rating);
  return {
    id: typeof game.id === "string" && game.id.trim() ? game.id.trim() : `entry-${index + 1}`,
    title: typeof game.title === "string" && game.title.trim() ? game.title.trim() : "Untitled game",
    image: typeof game.image === "string" ? game.image.trim() : "",
    rating: Number.isFinite(rating) ? Math.max(0, Math.min(10, rating)) : 0,
    gameplay: typeof game.gameplay === "string" && game.gameplay.trim() ? game.gameplay.trim() : "Unspecified",
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
    setLoaderProgress(82, "BUILDING COLLECTION...");
    updateStatistics();
    renderGames();
    setLoaderProgress(100, "DATABASE READY");
  } catch (error) {
    console.error("GameWall could not load games.json:", error);
    showError();
    setLoaderProgress(100, "DATABASE UNAVAILABLE");
  } finally {
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

function createGameCard(game, position) {
  const card = elements.template.content.cloneNode(true);
  const posterLink = card.querySelector(".poster-link");
  const image = card.querySelector(".game-poster");
  const placeholder = card.querySelector(".poster-placeholder");
  const cardId = card.querySelector(".card-id");
  const rating = card.querySelector(".rating-badge b");
  const title = card.querySelector(".game-title");
  const gameplay = card.querySelector(".gameplay-badge");
  const viewLink = card.querySelector(".view-game");

  const identifier = `GW-${String(position + 1).padStart(3, "0")}`;
  cardId.textContent = identifier;
  rating.textContent = formatRating(game.rating);
  title.textContent = game.title;
  gameplay.textContent = game.gameplay;
  posterLink.href = game.url;
  posterLink.setAttribute("aria-label", `Open ${game.title} in a new tab`);
  viewLink.href = game.url;
  viewLink.setAttribute("aria-label", `View ${game.title} in a new tab`);

  if (game.image) {
    const imageUrl = new URL(game.image, window.location.href);
    imageUrl.searchParams.set("v", Date.now());
    image.alt = `${game.title} poster`;
    image.addEventListener("load", () => {
      image.hidden = false;
      placeholder.hidden = true;
    }, { once: true });
    image.addEventListener("error", () => {
      console.error(
        `GameWall: failed to load poster for "${game.title}"`,
        imageUrl.toString()
      );
      image.hidden = true;
      placeholder.hidden = false;
    }, { once: true });
    image.src = imageUrl.toString();
  } else {
    image.hidden = true;
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
  return Number.isInteger(rating) ? rating.toFixed(1) : rating.toFixed(1);
}

function updateStatistics() {
  const games = state.games;
  const ratings = games.map((game) => game.rating).filter((rating) => Number.isFinite(rating));
  const completed = games.filter((game) => isCompleted(game.gameplay));
  const highest = games.length ? games.reduce((best, game) => game.rating > best.rating ? game : best) : null;

  animateValue(elements.totalGames, games.length, (value) => String(value).padStart(2, "0"));
  animateValue(elements.completedGames, completed.length, (value) => String(value).padStart(2, "0"));
  animateValue(
    elements.averageRating,
    ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0,
    (value) => value.toFixed(2),
    650
  );

  elements.highestRated.textContent = highest ? highest.title : "—";
  elements.highestRatedDetail.textContent = highest ? `MY SCORE ${formatRating(highest.rating)} / 10` : "WAITING FOR DATA";
}

function isCompleted(gameplay) {
  const value = gameplay.trim().toLocaleLowerCase();
  return value === "completed" || value === "100%";
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

elements.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderGames();
});

elements.sort.addEventListener("change", (event) => {
  state.sortMode = event.target.value;
  renderGames();
});

loadGames();

const ANIMATION_STORAGE_KEY = "gamewall-animations";

function getInitialAnimationPreference() {
  try {
    const stored = localStorage.getItem(ANIMATION_STORAGE_KEY);
    if (stored === "on" || stored === "off") {
      return stored === "on";
    }
  } catch { }
  if (typeof window !== "undefined" && window.matchMedia) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return false;
    }
  }
  return true;
}

let animationsEnabled = getInitialAnimationPreference();

if (typeof document !== "undefined" && document.documentElement) {
  if (animationsEnabled) {
    document.documentElement.classList.remove("no-animations");
    document.documentElement.classList.add("animations-unlocked");
  } else {
    document.documentElement.classList.add("no-animations");
    document.documentElement.classList.remove("animations-unlocked");
  }
}

const state = {
  games: [],
  query: "",
  searchMode: "title",
  platforms: [],
  badgeStatus: "any",
  reviewAvailability: "any",
  minRating: 0,
  maxRating: 10,
  gameplayProgress: "any",
  sortMode: "rating-desc",
  connectionMode: "good",
  initialized: false
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
  searchClearBtn: document.querySelector("#search-clear-btn"),
  searchMode: document.querySelector("#search-mode"),
  sort: document.querySelector("#sort-games"),
  filterToggleBtn: document.querySelector("#filter-toggle-btn"),
  activeFilterBadge: document.querySelector("#active-filter-badge"),
  resetFiltersBtn: document.querySelector("#reset-filters-btn"),
  advancedFiltersPanel: document.querySelector("#advanced-filters-panel"),
  filterBadge: document.querySelector("#filter-badge"),
  filterReview: document.querySelector("#filter-review"),
  filterMinRating: document.querySelector("#filter-min-rating"),
  filterMaxRating: document.querySelector("#filter-max-rating"),
  filterGameplay: document.querySelector("#filter-gameplay"),
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
  loadingStatus: document.querySelector("#loading-status"),
  loadingStatusText: document.querySelector("#loading-status-text"),
  loadingDetail: document.querySelector("#loading-detail"),
  reviewModalBackdrop: document.querySelector("#review-modal-backdrop"),
  reviewModal: document.querySelector("#review-modal"),
  reviewModalTitle: document.querySelector("#review-modal-title"),
  reviewModalId: document.querySelector("#review-modal-id"),
  reviewModalBody: document.querySelector("#review-modal-body"),
  reviewModalClose: document.querySelector("#review-modal-close"),
  reviewModalCloseBtn: document.querySelector("#review-modal-close-btn"),
  reviewModalShare: document.querySelector("#review-modal-share"),
  reviewShareToast: document.querySelector("#review-share-toast"),
  spoilerModalBackdrop: document.querySelector("#spoiler-modal-backdrop"),
  spoilerModal: document.querySelector("#spoiler-modal"),
  spoilerModalTitle: document.querySelector("#spoiler-modal-title"),
  spoilerModalDesc: document.querySelector("#spoiler-modal-desc"),
  spoilerModalGameTarget: document.querySelector("#spoiler-modal-game-target"),
  spoilerBtnOk: document.querySelector("#spoiler-btn-ok"),
  spoilerBtnBack: document.querySelector("#spoiler-btn-back"),
  spoilerBtnDontRemind: document.querySelector("#spoiler-btn-dont-remind"),
  mainContent: document.querySelector("#main-content"),
  pageNavBtn: document.querySelector("#page-nav-btn"),
  gwCursor: document.querySelector("#gw-cursor"),
  gwCursorProgressFill: document.querySelector("#gw-cursor-progress-fill"),
  animToggleBtn: document.querySelector("#anim-toggle-btn"),
  tutorialBtn: document.querySelector("#tutorial-btn"),
  tutorialOverlay: document.querySelector("#tutorial-overlay"),
  tutorialSpotlightCutout: document.querySelector("#tutorial-spotlight-cutout"),
  tutorialSpotlightBox: document.querySelector("#tutorial-spotlight-box"),
  tutorialDialog: document.querySelector("#tutorial-dialog"),
  tutorialStepBadge: document.querySelector("#tutorial-step-badge"),
  tutorialCloseBtn: document.querySelector("#tutorial-close-btn"),
  tutorialStepTitle: document.querySelector("#tutorial-step-title"),
  tutorialStepDesc: document.querySelector("#tutorial-step-desc"),
  tutorialBtnPrev: document.querySelector("#tutorial-btn-prev"),
  tutorialBtnNext: document.querySelector("#tutorial-btn-next"),
  tutorialDots: document.querySelector("#tutorial-dots"),
  tutorialLiveRegion: document.querySelector("#tutorial-live-region")
};

const scrambleControllers = new WeakMap();
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+-/<>[]{}01";
let scrambleCallSequence = 0;

const textLayoutCache = new WeakMap();
const activeLayoutCaches = [];

if (typeof window !== "undefined") {
  window.addEventListener("resize", () => {
    activeLayoutCaches.forEach((cache) => cache.clear());
  }, { passive: true });
}

let fontsReadyPromise = null;
function ensureFontsReady() {
  if (!fontsReadyPromise) {
    if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
      fontsReadyPromise = Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 350))
      ]);
    } else {
      fontsReadyPromise = Promise.resolve();
    }
  }
  return fontsReadyPromise;
}

function getCachedTextLayout(element, targetText) {
  let cache = textLayoutCache.get(element);
  if (!cache) {
    cache = new Map();
    textLayoutCache.set(element, cache);
    activeLayoutCaches.push(cache);
  }

  const parent = element.parentElement || document.body;
  const parentStyle = window.getComputedStyle(parent);
  const parentPaddingX = (parseFloat(parentStyle.paddingLeft) || 0) + (parseFloat(parentStyle.paddingRight) || 0);
  const availableParentWidth = Math.max(0, parent.clientWidth - parentPaddingX);

  const elementStyle = window.getComputedStyle(element);
  let elementMaxWidth = availableParentWidth;
  if (elementStyle.maxWidth && elementStyle.maxWidth !== "none") {
    if (elementStyle.maxWidth.endsWith("px")) {
      const parsed = parseFloat(elementStyle.maxWidth);
      if (!isNaN(parsed) && parsed > 0) elementMaxWidth = parsed;
    } else if (elementStyle.maxWidth.endsWith("%")) {
      const parsedPct = parseFloat(elementStyle.maxWidth);
      if (!isNaN(parsedPct) && parsedPct > 0) elementMaxWidth = (parsedPct / 100) * availableParentWidth;
    }
  }
  const maxAllowedWidth = Math.max(0, Math.min(availableParentWidth, elementMaxWidth));
  const cacheKey = `${targetText}__${Math.round(maxAllowedWidth)}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const layout = measureTextLayout(element, targetText, maxAllowedWidth, elementStyle, parent);
  cache.set(cacheKey, layout);
  return layout;
}

function measureTextLayout(element, targetText, maxAllowedWidth, elementStyle, parent) {
  if (!targetText) {
    return {
      fitsOnOneLine: true,
      lines: [""],
      width: 0,
      height: 0
    };
  }

  const clone = document.createElement(element.tagName);
  clone.className = element.className;
  clone.style.cssText = `
    position: absolute !important;
    visibility: hidden !important;
    pointer-events: none !important;
    left: -9999px !important;
    top: 0 !important;
    z-index: -999 !important;
    opacity: 0 !important;
    transform: none !important;
    animation: none !important;
    transition: none !important;
    box-sizing: border-box !important;
    margin: 0 !important;
  `;
  const typographyProps = [
    "fontFamily", "fontSize", "fontWeight", "fontStyle", "fontStretch",
    "letterSpacing", "lineHeight", "textTransform", "wordSpacing", "textIndent"
  ];
  typographyProps.forEach((prop) => {
    clone.style[prop] = elementStyle[prop];
  });
  parent.appendChild(clone);

  clone.style.whiteSpace = "nowrap";
  clone.style.width = "auto";
  clone.style.maxWidth = "none";
  clone.textContent = targetText;
  const singleLineRect = clone.getBoundingClientRect();
  const singleLineWidth = singleLineRect.width;
  const singleLineHeight = singleLineRect.height;

  const fitsOnOneLine = singleLineWidth <= (maxAllowedWidth + 0.5);

  if (fitsOnOneLine) {
    clone.remove();
    return {
      fitsOnOneLine: true,
      lines: [targetText],
      width: Math.ceil(Math.min(singleLineWidth, maxAllowedWidth)),
      height: Math.ceil(singleLineHeight)
    };
  }

  clone.style.whiteSpace = elementStyle.whiteSpace || "normal";
  clone.style.maxWidth = `${maxAllowedWidth}px`;
  const wrappedRect = clone.getBoundingClientRect();

  const textNode = clone.firstChild;
  const lines = [];
  if (textNode && textNode.nodeType === Node.TEXT_NODE) {
    const range = document.createRange();
    let currentLineStart = 0;
    let lastTop = null;

    for (let i = 0; i < targetText.length; i++) {
      range.setStart(textNode, i);
      range.setEnd(textNode, i + 1);
      const rects = range.getClientRects();
      if (rects.length > 0) {
        const top = Math.round(rects[0].top);
        if (lastTop === null) {
          lastTop = top;
        } else if (top > lastTop + 4) {
          lines.push(targetText.slice(currentLineStart, i));
          currentLineStart = i;
          lastTop = top;
        }
      }
    }
    lines.push(targetText.slice(currentLineStart));
  }
  clone.remove();

  return {
    fitsOnOneLine: false,
    lines: lines.length > 0 ? lines : [targetText],
    width: Math.ceil(wrappedRect.width),
    height: Math.ceil(wrappedRect.height)
  };
}

async function scrambleText(element, target, options = {}) {
  if (!element) return Promise.resolve();

  const text = String(target ?? "");
  const callId = ++scrambleCallSequence;

  // Immediately cancel any previous scramble for this element synchronously
  const prev = scrambleControllers.get(element);
  if (prev) {
    prev.cancelled = true;
    if (prev.timer) {
      clearInterval(prev.timer);
      prev.timer = null;
    }
    prev.cleanupStyles?.();
    prev.resolve?.();
  }

  let resolvePromise;
  const promise = new Promise((resolve) => {
    resolvePromise = resolve;
  });

  const controller = {
    callId,
    cancelled: false,
    timer: null,
    cleanupStyles: null,
    resolve: resolvePromise
  };
  scrambleControllers.set(element, controller);

  if (!animationsEnabled) {
    element.setAttribute("aria-label", text);
    element.textContent = text;
    resolvePromise();
    return promise;
  }

  await ensureFontsReady();

  // If superseded while waiting for fonts, bail immediately without DOM writes or intervals
  if (controller.cancelled || scrambleControllers.get(element) !== controller) {
    return promise;
  }

  const intervalMs = options.interval ?? 40;
  const revealEvery = options.revealEvery ?? 3;

  element.setAttribute("aria-label", text);

  const layout = getCachedTextLayout(element, text);

  // If superseded during measurement, exit
  if (controller.cancelled || scrambleControllers.get(element) !== controller) {
    return promise;
  }

  element.style.minHeight = `${layout.height}px`;
  element.style.height = `${layout.height}px`;
  element.style.minWidth = `${layout.width}px`;
  element.style.maxWidth = "100%";
  element.style.boxSizing = "border-box";

  if (layout.fitsOnOneLine) {
    element.style.whiteSpace = "nowrap";
  }

  let revealed = 0;
  let frame = 0;

  const scrambleString = (str, revCount) => {
    let out = "";
    for (let i = 0; i < str.length; i++) {
      if (str[i] === " ") {
        out += "\u00A0";
        continue;
      }
      out += i < revCount
        ? str[i]
        : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
    }
    return out;
  };

  let lineSpans = null;
  if (!layout.fitsOnOneLine) {
    element.replaceChildren();
    lineSpans = layout.lines.map(() => {
      const span = document.createElement("span");
      span.className = "scramble-line";
      element.appendChild(span);
      return span;
    });
  }

  const render = () => {
    if (layout.fitsOnOneLine) {
      element.textContent = scrambleString(text, revealed);
    } else {
      let count = 0;
      for (let l = 0; l < layout.lines.length; l++) {
        const line = layout.lines[l];
        const lineRev = Math.max(0, Math.min(line.length, revealed - count));
        count += line.length;
        lineSpans[l].textContent = scrambleString(line, lineRev);
      }
    }
  };

  render();

  const cleanupStyles = () => {
    element.style.minHeight = "";
    element.style.height = "";
    element.style.minWidth = "";
    element.style.maxWidth = "";
    element.style.whiteSpace = "";
    element.style.boxSizing = "";
  };
  controller.cleanupStyles = cleanupStyles;

  const finish = () => {
    if (controller.timer) {
      clearInterval(controller.timer);
      controller.timer = null;
    }
    if (scrambleControllers.get(element) === controller) {
      scrambleControllers.delete(element);
    }
    element.textContent = text;
    cleanupStyles();
    resolvePromise();
  };

  controller.timer = setInterval(() => {
    if (controller.cancelled || scrambleControllers.get(element) !== controller) {
      if (controller.timer) {
        clearInterval(controller.timer);
        controller.timer = null;
      }
      cleanupStyles();
      return;
    }

    frame++;

    if (frame % revealEvery === 0) {
      revealed++;
    }

    render();

    if (revealed > text.length) {
      finish();
    }
  }, intervalMs);

  return promise;
}

function setLoaderProgress(value, message) {
  const progress = Math.max(0, Math.min(100, Math.round(value)));

  const progressFill = elements.gwCursorProgressFill || document.querySelector("#gw-cursor-progress-fill");
  if (progressFill) {
    const pathLength = 307.88;
    const offset = (pathLength * (1 - progress / 100)).toFixed(2);
    progressFill.style.strokeDashoffset = `${offset}`;
  }

  const statusText = elements.loadingStatusText || document.querySelector("#loading-status-text");
  if (statusText) {
    if (message === "DATABASE UNAVAILABLE") {
      statusText.textContent = `> Database Unavailable... ${progress}%`;
    } else {
      statusText.textContent = `> Loading Database... ${progress}%`;
    }
  }

  const statusDetail = elements.loadingDetail || document.querySelector("#loading-detail");
  if (statusDetail) {
    if (message) {
      statusDetail.textContent = `[ ${message} ]`;
      if (message === "DATABASE UNAVAILABLE") {
        statusDetail.classList.add("is-error");
        statusDetail.classList.remove("is-ready");
      } else if (message === "DATABASE READY") {
        statusDetail.classList.add("is-ready");
        statusDetail.classList.remove("is-error");
      } else {
        statusDetail.classList.remove("is-ready", "is-error");
      }
    }
  }

  return Promise.resolve();
}

function hideLoading() {
  document.documentElement.classList.remove("gw-booting", "background-entering");
  document.documentElement.classList.add("background-ready");
  isBooting = false;
  window.__resumeCanvasAnimations?.();

  if (elements.loadingScreen) {
    elements.loadingScreen.classList.remove("is-fading");
    elements.loadingScreen.classList.add("is-hidden");
  }

  if (!isFinePointerDevice() || !animationsEnabled) {
    document.documentElement.classList.remove("has-custom-cursor");
    const cursor = elements.gwCursor || document.querySelector("#gw-cursor");
    if (cursor) {
      cursor.style.display = "none";
      cursor.style.opacity = "0";
      cursor.classList.remove("is-active", "is-hover", "is-danger-hover", "is-loading");
    }
  }
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

let isLowPowerDevice = false;
let rAFSamples = [];
let perfRafHandle = null;
let lastRafTime = 0;

function startPerformanceSampling() {
  lastRafTime = performance.now();
  function sample(now) {
    const delta = now - lastRafTime;
    lastRafTime = now;
    if (delta > 0 && delta < 500) {
      rAFSamples.push(delta);
    }
    if (rAFSamples.length < 45 && isBooting) {
      perfRafHandle = requestAnimationFrame(sample);
    }
  }
  perfRafHandle = requestAnimationFrame(sample);
}

function evaluateDeviceCapability() {
  if (perfRafHandle) {
    cancelAnimationFrame(perfRafHandle);
    perfRafHandle = null;
  }

  let slowSignalCount = 0;

  const cores = navigator.hardwareConcurrency;
  if (typeof cores === "number" && cores > 0 && cores <= 2) {
    slowSignalCount += 2;
  }

  const memory = navigator.deviceMemory;
  if (typeof memory === "number" && memory > 0 && memory <= 1) {
    slowSignalCount += 2;
  }

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn?.saveData || conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g") {
    slowSignalCount += 1;
  }

  if (rAFSamples.length >= 10) {
    const droppedFrames = rAFSamples.filter((t) => t > 38).length;
    const droppedRatio = droppedFrames / rAFSamples.length;
    const avgFrame = rAFSamples.reduce((a, b) => a + b, 0) / rAFSamples.length;

    if (droppedRatio > 0.35 || avgFrame > 35) {
      slowSignalCount += 2;
    }
  }

  const isTouchOnly = !isFinePointerDevice();
  if (isTouchOnly && slowSignalCount >= 2) {
    isLowPowerDevice = true;
  } else if (slowSignalCount >= 4) {
    isLowPowerDevice = true;
  } else {
    isLowPowerDevice = false;
  }

  if (isLowPowerDevice) {
    document.documentElement.classList.add("gw-low-power");
    console.log("[GameWall] Adaptive performance: low-power mode active (title curtain reveal disabled)");
  } else {
    document.documentElement.classList.remove("gw-low-power");
    console.log("[GameWall] Adaptive performance: standard mode active");
  }
}

function normalisePosterBadge(badge) {
  if (!badge || typeof badge !== "object") return null;
  const type = typeof badge.type === "string" ? badge.type.trim().toLowerCase() : "";
  if (type === "completed") {
    return {
      type: "completed",
      label: "COMPLETED // 100%"
    };
  }
  if (type === "dropped") {
    const rawPct = Number(badge.percentage);
    if (Number.isInteger(rawPct) && rawPct >= 0 && rawPct <= 99) {
      return {
        type: "dropped",
        percentage: rawPct,
        label: `DROPPED // ${rawPct}%`
      };
    }
    return null;
  }
  if (type === "custom") {
    const text = typeof badge.text === "string" ? badge.text.trim() : "";
    if (text) {
      return {
        type: "custom",
        text,
        label: text
      };
    }
    return null;
  }
  return null;
}

function isUnknownHoursBadge(badge) {
  if (!badge || badge.type !== "custom") return false;
  const text = typeof badge.text === "string" ? badge.text : badge.label;
  if (!text) return false;
  return /^\s*\?\s+hours\s*$/i.test(text);
}

function renderBadgeText(container, text) {
  container.textContent = "";
  if (!text) return;
  const parts = text.split("~");
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) {
      container.appendChild(document.createTextNode(parts[i]));
    }
    if (i < parts.length - 1) {
      const tildeSpan = document.createElement("span");
      tildeSpan.className = "badge-tilde";
      tildeSpan.textContent = "~";
      tildeSpan.setAttribute("aria-hidden", "true");
      container.appendChild(tildeSpan);
    }
  }
}

const activeGlitchElements = new Set();
let glitchTimerId = null;

function getRandomGlitchDigits() {
  return String(Math.floor(Math.random() * 1000)).padStart(3, "0");
}

function updateGlitchBadges() {
  if (!animationsEnabled || document.visibilityState === "hidden") {
    return;
  }
  if (activeGlitchElements.size === 0) {
    stopGlitchTicker();
    return;
  }

  activeGlitchElements.forEach((el) => {
    if (!el.isConnected) {
      activeGlitchElements.delete(el);
      return;
    }
    el.textContent = getRandomGlitchDigits();
    if (Math.random() < 0.25) {
      el.classList.add("is-flickering");
    } else {
      el.classList.remove("is-flickering");
    }
  });
}

function startGlitchTicker() {
  if (glitchTimerId || !animationsEnabled) return;
  glitchTimerId = setInterval(updateGlitchBadges, 85);
}

function stopGlitchTicker() {
  if (glitchTimerId) {
    clearInterval(glitchTimerId);
    glitchTimerId = null;
  }
}

function syncGlitchBadgesAnimationState() {
  if (animationsEnabled) {
    activeGlitchElements.forEach((el) => {
      if (el.isConnected) {
        el.textContent = getRandomGlitchDigits();
      } else {
        activeGlitchElements.delete(el);
      }
    });
    if (activeGlitchElements.size > 0 && document.visibilityState !== "hidden") {
      startGlitchTicker();
    }
  } else {
    stopGlitchTicker();
    activeGlitchElements.forEach((el) => {
      if (el.isConnected) {
        el.textContent = "???";
        el.classList.remove("is-flickering");
      } else {
        activeGlitchElements.delete(el);
      }
    });
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    stopGlitchTicker();
  } else if (animationsEnabled && activeGlitchElements.size > 0) {
    startGlitchTicker();
  }
});

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
    posterBadge: normalisePosterBadge(game.posterBadge),
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

async function coordinateStartupReadiness({ success = true } = {}) {
  // 1. Ensure essential fonts have loaded or bounded wait expires (max 400ms)
  try {
    if (document.fonts && document.fonts.ready) {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 400))
      ]);
    }
  } catch { }

  evaluateDeviceCapability();

  // 2. Ensure background canvas has initialized its buffer and rendered a valid initial frame
  window.__ensureCanvasReady?.();

  // 3. Begin background entrance: unpause CSS animations and resume canvas animation loop
  document.documentElement.classList.remove("background-muted");
  document.documentElement.classList.add("background-entering");
  window.__resumeCanvasAnimations?.();

  // 4. Bounded paint-settling step: allow browser to commit initial layout & canvas frame
  await new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });

  // 5. Coordinated fan transition & overlay fade out
  await decelerateCursorFan();

  // 6. Dismiss loading overlay and finalize readiness state
  hideLoading();

  state.initialized = true;
  window.__updatePageNav?.();
  window.__updateCursorProgress?.();
  if (success) {
    checkInitialReviewSlug();
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
    setLoaderProgress(85, "SYNCHRONIZING CACHE...");
    updateStatistics();
    await renderGames();
    await setLoaderProgress(100, "DATABASE READY");

    await coordinateStartupReadiness({ success: true });
  } catch (error) {
    console.error("GameWall could not load games.json:", error);
    showError();

    await setLoaderProgress(100, "DATABASE UNAVAILABLE");
    await coordinateStartupReadiness({ success: false });
  }
}

const VALID_SEARCH_MODES = ["title", "gameplay", "review", "platform", "badge", "everything"];
const VALID_SORT_MODES = ["rating-desc", "rating-asc", "title-asc", "title-desc", "default"];

function matchesSearch(game, query, searchMode) {
  if (!query) return true;

  switch (searchMode) {
    case "gameplay":
      return (game.gameplay || "").toLocaleLowerCase().includes(query);

    case "review":
      return (game.description || "").toLocaleLowerCase().includes(query);

    case "platform": {
      if (!Array.isArray(game.platforms)) return false;
      return game.platforms.some((p) => p.toLocaleLowerCase().includes(query));
    }

    case "badge": {
      if (!game.posterBadge) return false;
      const labelText = (game.posterBadge.label || "").toLocaleLowerCase();
      const typeText = (game.posterBadge.type || "").toLocaleLowerCase();
      return labelText.includes(query) || typeText.includes(query);
    }

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

      if (game.posterBadge) {
        if ((game.posterBadge.label || "").toLocaleLowerCase().includes(query)) return true;
        if ((game.posterBadge.type || "").toLocaleLowerCase().includes(query)) return true;
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

function matchesAdvancedFilters(game) {
  // 1. Platform filter
  if (state.platforms && state.platforms.length > 0) {
    if (!Array.isArray(game.platforms) || !game.platforms.some((p) => state.platforms.includes(p))) {
      return false;
    }
  }

  // 2. Poster badge status filter
  if (state.badgeStatus && state.badgeStatus !== "any") {
    if (state.badgeStatus === "completed") {
      if (!game.posterBadge || game.posterBadge.type !== "completed") return false;
    } else if (state.badgeStatus === "dropped") {
      if (!game.posterBadge || game.posterBadge.type !== "dropped") return false;
    } else if (state.badgeStatus === "custom") {
      if (!game.posterBadge || game.posterBadge.type !== "custom") return false;
    } else if (state.badgeStatus === "none") {
      if (game.posterBadge) return false;
    }
  }

  // 3. Review availability filter
  if (state.reviewAvailability && state.reviewAvailability !== "any") {
    const hasRev = Boolean((game.description || "").trim().length > 0);
    if (state.reviewAvailability === "has-review" && !hasRev) return false;
    if (state.reviewAvailability === "no-review" && hasRev) return false;
  }

  // 4. Rating range filter
  const minR = typeof state.minRating === "number" ? state.minRating : 0;
  const maxR = typeof state.maxRating === "number" ? state.maxRating : 10;
  const actualMin = Math.min(minR, maxR);
  const actualMax = Math.max(minR, maxR);
  if (game.rating < actualMin || game.rating > actualMax) {
    return false;
  }

  // 5. Gameplay completion marker (legacy 100%)
  if (state.gameplayProgress && state.gameplayProgress !== "any") {
    const gameplay = game.gameplay || "";
    if (state.gameplayProgress === "100" && !gameplay.includes("100%")) return false;
    if (state.gameplayProgress === "not-100" && gameplay.includes("100%")) return false;
  }

  return true;
}

function getVisibleGames() {
  const query = state.query.trim().toLocaleLowerCase();
  const searchMode = state.searchMode || "title";

  const filtered = state.games.filter((game) => {
    return matchesSearch(game, query, searchMode) && matchesAdvancedFilters(game);
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

let activeRenderToken = 0;

function renderGames() {
  activeGlitchElements.clear();
  const token = ++activeRenderToken;
  const games = getVisibleGames();
  elements.grid.replaceChildren();
  elements.resultCount.textContent = `${games.length} ${games.length === 1 ? "ENTRY" : "ENTRIES"}`;

  if (games.length === 0) {
    showEmptyState(state.games.length === 0 ? "database" : "search");
    return Promise.resolve();
  }

  elements.emptyState.hidden = true;

  const BATCH_SIZE = 28;
  if (games.length <= BATCH_SIZE) {
    const fragment = document.createDocumentFragment();
    games.forEach((game, index) => fragment.append(createGameCard(game, index)));
    elements.grid.append(fragment);
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let currentIndex = 0;

    function renderNextBatch() {
      if (token !== activeRenderToken) {
        resolve();
        return;
      }

      const endIndex = Math.min(currentIndex + BATCH_SIZE, games.length);
      const fragment = document.createDocumentFragment();

      for (let i = currentIndex; i < endIndex; i++) {
        fragment.append(createGameCard(games[i], i));
      }

      elements.grid.append(fragment);
      currentIndex = endIndex;

      if (currentIndex < games.length) {
        if (typeof window.requestAnimationFrame === "function") {
          window.requestAnimationFrame(() => {
            setTimeout(renderNextBatch, 0);
          });
        } else {
          setTimeout(renderNextBatch, 0);
        }
      } else {
        resolve();
      }
    }

    renderNextBatch();
  });
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
  const platformBadges = card.querySelector(".platform-badges");
  const rating = card.querySelector(".rating-badge b");
  const titleCurtain = card.querySelector(".game-title-curtain");
  const title = card.querySelector(".game-title");
  const gameplay = card.querySelector(".gameplay-text");
  const viewLink = card.querySelector(".view-game");

  const identifier = `GW-${String(position + 1).padStart(3, "0")}`;
  const posterBadge = card.querySelector(".poster-badge");
  if (posterBadge) {
    if (game.posterBadge) {
      posterBadge.hidden = false;
      posterBadge.className = `poster-badge badge-${game.posterBadge.type}`;
      posterBadge.textContent = "";

      if (isUnknownHoursBadge(game.posterBadge)) {
        posterBadge.classList.add("badge-glitch-hours");
        posterBadge.setAttribute("aria-label", "Unknown hours played");
        posterBadge.title = "Unknown hours played";

        const glitchWrap = document.createElement("span");
        glitchWrap.className = "badge-glitch-wrap";
        glitchWrap.setAttribute("aria-hidden", "true");

        const numSpan = document.createElement("span");
        numSpan.className = "badge-glitch-num";
        numSpan.textContent = animationsEnabled ? getRandomGlitchDigits() : "???";
        activeGlitchElements.add(numSpan);

        const labelSpan = document.createElement("span");
        labelSpan.className = "badge-glitch-label";
        labelSpan.textContent = " HOURS";

        glitchWrap.appendChild(numSpan);
        glitchWrap.appendChild(labelSpan);
        posterBadge.appendChild(glitchWrap);

        if (animationsEnabled) {
          startGlitchTicker();
        }
      } else {
        posterBadge.setAttribute("aria-label", `Progress status: ${game.posterBadge.label}`);
        posterBadge.title = `Progress status: ${game.posterBadge.label}`;
        renderBadgeText(posterBadge, game.posterBadge.label);
      }
    } else {
      posterBadge.hidden = true;
      posterBadge.remove();
    }
  }
  renderPlatforms(platformBadges, game.platforms, game.title);
  rating.textContent = formatRating(game.rating);
  title.textContent = game.title;
  title.setAttribute("aria-label", game.title);
  if (!animationsEnabled || isLowPowerDevice) {
    titleCurtain.classList.add("is-revealed");
    fitText(title, 0.85, 1.35);
  } else {
    observeGameTitle(titleCurtain);
  }
  gameplay.textContent = game.gameplay;
  setupGameplayMarquee(gameplay);
  observeGameplayBadge(gameplay);
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
  if (!animationsEnabled || target === 0) {
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
  if (element.scrollWidth <= element.clientWidth && element.scrollHeight <= maxHeight) {
    return;
  }

  let low = minSize;
  let high = maxSize;
  let best = minSize;
  while (high - low > 0.03) {
    const mid = Math.round(((low + high) / 2) * 40) / 40;
    element.style.fontSize = `${mid}rem`;
    if (element.scrollWidth <= element.clientWidth && element.scrollHeight <= maxHeight) {
      best = mid;
      low = mid;
    } else {
      high = mid - 0.025;
    }
  }
  element.style.fontSize = `${best}rem`;
}

const gameplayObserver =
  new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      const textElement = entry.target.querySelector(".gameplay-text");
      if (textElement) {
        setupGameplayMarquee(textElement);
      }
    });
  });

function observeGameplayBadge(textElement) {
  const badge = textElement?.parentElement?.parentElement;

  if (badge) {
    gameplayObserver.observe(badge);
  }
}

function getActiveFilterCount() {
  let count = 0;
  if (state.platforms && state.platforms.length > 0) count += state.platforms.length;
  if (state.badgeStatus && state.badgeStatus !== "any") count += 1;
  if (state.reviewAvailability && state.reviewAvailability !== "any") count += 1;
  if (state.minRating > 0 || state.maxRating < 10) count += 1;
  if (state.gameplayProgress && state.gameplayProgress !== "any") count += 1;
  return count;
}

function updateActiveFilterBadge() {
  const count = getActiveFilterCount();
  const badge = elements.activeFilterBadge || document.querySelector("#active-filter-badge");
  if (badge) {
    badge.textContent = String(count);
    badge.hidden = count === 0;
  }
  const toggleBtn = elements.filterToggleBtn || document.querySelector("#filter-toggle-btn");
  if (toggleBtn) {
    if (count > 0) {
      toggleBtn.classList.add("has-active-filters");
    } else {
      toggleBtn.classList.remove("has-active-filters");
    }
  }
}

function buildSearchQueryString() {
  const params = new URLSearchParams();
  const trimmed = (state.query || "").trim();
  if (trimmed) {
    params.set("q", trimmed);
  }
  if (state.searchMode && state.searchMode !== "title" && VALID_SEARCH_MODES.includes(state.searchMode)) {
    params.set("scope", state.searchMode);
  }
  if (state.platforms && state.platforms.length > 0) {
    state.platforms.forEach((p) => params.append("platform", p));
  }
  if (state.badgeStatus && state.badgeStatus !== "any") {
    params.set("badge", state.badgeStatus);
  }
  if (state.reviewAvailability === "has-review") {
    params.set("hasReview", "true");
  } else if (state.reviewAvailability === "no-review") {
    params.set("hasReview", "false");
  }
  if (typeof state.minRating === "number" && state.minRating > 0) {
    params.set("minRating", String(state.minRating));
  }
  if (typeof state.maxRating === "number" && state.maxRating < 10) {
    params.set("maxRating", String(state.maxRating));
  }
  if (state.gameplayProgress && state.gameplayProgress !== "any") {
    params.set("gameplayProgress", state.gameplayProgress);
  }
  if (state.sortMode && state.sortMode !== "rating-desc" && VALID_SORT_MODES.includes(state.sortMode)) {
    params.set("sort", state.sortMode);
  }

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function syncSearchUrl() {
  if (activeReviewSlug) return;
  const currentUrl = new URL(window.location.href);

  ["s", "p1", "p2", "q", "scope", "platform", "badge", "hasReview", "minRating", "maxRating", "gameplayProgress", "sort"].forEach((k) => {
    currentUrl.searchParams.delete(k);
  });

  const newQs = buildSearchQueryString();
  if (newQs) {
    const newParams = new URLSearchParams(newQs.slice(1));
    newParams.forEach((val, key) => currentUrl.searchParams.append(key, val));
  }

  const searchStr = currentUrl.searchParams.toString();
  const newUrl = `${currentUrl.pathname}${searchStr ? "?" + searchStr : ""}${currentUrl.hash}`;
  const existingRelative = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (existingRelative !== newUrl) {
    window.history.replaceState({ type: "search" }, "", newUrl);
  }
}

function initUrlState() {
  try {
    const params = new URLSearchParams(window.location.search);

    const qParam = params.get("q") ?? params.get("s");
    if (typeof qParam === "string" && qParam.length > 0) {
      state.query = qParam;
      if (elements.search) elements.search.value = qParam;
    } else {
      state.query = "";
      if (elements.search) elements.search.value = "";
    }

    const scopeParam = params.get("scope") ?? params.get("p1");
    if (scopeParam && VALID_SEARCH_MODES.includes(scopeParam)) {
      state.searchMode = scopeParam;
    } else {
      state.searchMode = "title";
    }
    if (elements.searchMode) elements.searchMode.value = state.searchMode;

    const platformParams = params.getAll("platform");
    const parsedPlatforms = [];
    platformParams.forEach((val) => {
      val.split(",").map((v) => v.trim()).forEach((v) => {
        const norm = normalizePlatform(v);
        if (norm && !parsedPlatforms.includes(norm)) parsedPlatforms.push(norm);
      });
    });
    state.platforms = parsedPlatforms;
    const platformCheckboxes = document.querySelectorAll("input[name='platform-filter']");
    platformCheckboxes.forEach((cb) => {
      cb.checked = state.platforms.includes(cb.value);
    });

    const badgeParam = params.get("badge");
    if (badgeParam && ["completed", "dropped", "custom", "none"].includes(badgeParam.toLowerCase())) {
      state.badgeStatus = badgeParam.toLowerCase();
    } else {
      state.badgeStatus = "any";
    }
    const badgeSelect = elements.filterBadge || document.querySelector("#filter-badge");
    if (badgeSelect) badgeSelect.value = state.badgeStatus;

    const hasReviewParam = params.get("hasReview");
    const p2Param = params.get("p2");
    if (hasReviewParam === "true" || p2Param === "reviews") {
      state.reviewAvailability = "has-review";
    } else if (hasReviewParam === "false" || p2Param === "no-reviews") {
      state.reviewAvailability = "no-review";
    } else {
      state.reviewAvailability = "any";
    }
    const reviewSelect = elements.filterReview || document.querySelector("#filter-review");
    if (reviewSelect) reviewSelect.value = state.reviewAvailability;

    const minR = parseFloat(params.get("minRating"));
    const maxR = parseFloat(params.get("maxRating"));
    state.minRating = !isNaN(minR) && minR >= 0 && minR <= 10 ? minR : 0;
    state.maxRating = !isNaN(maxR) && maxR >= 0 && maxR <= 10 ? maxR : 10;
    const minInput = elements.filterMinRating || document.querySelector("#filter-min-rating");
    const maxInput = elements.filterMaxRating || document.querySelector("#filter-max-rating");
    if (minInput) minInput.value = state.minRating;
    if (maxInput) maxInput.value = state.maxRating;

    const gpParam = params.get("gameplayProgress");
    if (gpParam === "100" || p2Param === "100") {
      state.gameplayProgress = "100";
    } else if (gpParam === "not-100" || p2Param === "not-100") {
      state.gameplayProgress = "not-100";
    } else {
      state.gameplayProgress = "any";
    }
    const gpSelect = elements.filterGameplay || document.querySelector("#filter-gameplay");
    if (gpSelect) gpSelect.value = state.gameplayProgress;

    const sortParam = params.get("sort");
    if (sortParam && VALID_SORT_MODES.includes(sortParam)) {
      state.sortMode = sortParam;
    } else {
      state.sortMode = "rating-desc";
    }
    if (elements.sort) elements.sort.value = state.sortMode;

    updateActiveFilterBadge();
    updateSearchClearButton();
  } catch (err) {
    console.warn("[GameWall] Error initializing URL search state:", err);
  }
}

function updateSearchClearButton() {
  const hasQuery = Boolean(state.query && state.query.trim().length > 0);
  const clearBtn = elements.searchClearBtn || document.querySelector("#search-clear-btn");
  const searchField = document.querySelector(".search-field");
  if (clearBtn) {
    clearBtn.hidden = !hasQuery;
  }
  if (searchField) {
    searchField.classList.toggle("has-query", hasQuery);
  }
}

function clearSearchQuery() {
  state.query = "";
  if (elements.search) {
    elements.search.value = "";
    elements.search.focus();
  }
  updateSearchClearButton();
  syncSearchUrl();
  renderGames();
}

function resetSearchAndFilters() {
  // Correct reset behavior: Does NOT clear search query or searchMode!
  state.platforms = [];
  state.badgeStatus = "any";
  state.reviewAvailability = "any";
  state.minRating = 0;
  state.maxRating = 10;
  state.gameplayProgress = "any";
  state.sortMode = "rating-desc";

  if (elements.sort) elements.sort.value = "rating-desc";

  const platformCheckboxes = document.querySelectorAll("input[name='platform-filter']");
  platformCheckboxes.forEach((cb) => (cb.checked = false));

  const badgeSelect = elements.filterBadge || document.querySelector("#filter-badge");
  if (badgeSelect) badgeSelect.value = "any";

  const reviewSelect = elements.filterReview || document.querySelector("#filter-review");
  if (reviewSelect) reviewSelect.value = "any";

  const minInput = elements.filterMinRating || document.querySelector("#filter-min-rating");
  if (minInput) minInput.value = "0";

  const maxInput = elements.filterMaxRating || document.querySelector("#filter-max-rating");
  if (maxInput) maxInput.value = "10";

  const gpSelect = elements.filterGameplay || document.querySelector("#filter-gameplay");
  if (gpSelect) gpSelect.value = "any";

  updateActiveFilterBadge();
  syncSearchUrl();
  renderGames();
}

function initControlsEvents() {
  if (elements.search) {
    elements.search.addEventListener("input", (event) => {
      state.query = event.target.value;
      updateSearchClearButton();
      syncSearchUrl();
      renderGames();
    });
  }

  const clearBtn = elements.searchClearBtn || document.querySelector("#search-clear-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      clearSearchQuery();
    });
  }

  if (elements.searchMode) {
    elements.searchMode.addEventListener("change", (event) => {
      state.searchMode = event.target.value;
      syncSearchUrl();
      renderGames();
    });
  }

  if (elements.sort) {
    elements.sort.addEventListener("change", (event) => {
      state.sortMode = event.target.value;
      syncSearchUrl();
      renderGames();
    });
  }

  const toggleBtn = elements.filterToggleBtn || document.querySelector("#filter-toggle-btn");
  const panel = elements.advancedFiltersPanel || document.querySelector("#advanced-filters-panel");
  if (toggleBtn && panel) {
    toggleBtn.addEventListener("click", () => {
      const isExpanded = toggleBtn.getAttribute("aria-expanded") === "true";
      const willExpand = !isExpanded;
      toggleBtn.setAttribute("aria-expanded", String(willExpand));
      toggleBtn.classList.toggle("is-active", willExpand);
      panel.hidden = !willExpand;
    });
  }

  const resetBtn = elements.resetFiltersBtn || document.querySelector("#reset-filters-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      resetSearchAndFilters();
    });
  }

  const platformCheckboxes = document.querySelectorAll("input[name='platform-filter']");
  platformCheckboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      const selected = [];
      platformCheckboxes.forEach((box) => {
        if (box.checked) selected.push(box.value);
      });
      state.platforms = selected;
      updateActiveFilterBadge();
      syncSearchUrl();
      renderGames();
    });
  });

  const badgeSelect = elements.filterBadge || document.querySelector("#filter-badge");
  if (badgeSelect) {
    badgeSelect.addEventListener("change", (e) => {
      state.badgeStatus = e.target.value;
      updateActiveFilterBadge();
      syncSearchUrl();
      renderGames();
    });
  }

  const reviewSelect = elements.filterReview || document.querySelector("#filter-review");
  if (reviewSelect) {
    reviewSelect.addEventListener("change", (e) => {
      state.reviewAvailability = e.target.value;
      updateActiveFilterBadge();
      syncSearchUrl();
      renderGames();
    });
  }

  const minInput = elements.filterMinRating || document.querySelector("#filter-min-rating");
  const maxInput = elements.filterMaxRating || document.querySelector("#filter-max-rating");
  const onRatingChange = () => {
    let minVal = parseFloat(minInput?.value);
    let maxVal = parseFloat(maxInput?.value);
    if (isNaN(minVal)) minVal = 0;
    if (isNaN(maxVal)) maxVal = 10;
    minVal = Math.max(0, Math.min(10, minVal));
    maxVal = Math.max(0, Math.min(10, maxVal));
    state.minRating = minVal;
    state.maxRating = maxVal;
    updateActiveFilterBadge();
    syncSearchUrl();
    renderGames();
  };
  if (minInput) {
    minInput.addEventListener("input", onRatingChange);
    minInput.addEventListener("change", onRatingChange);
  }
  if (maxInput) {
    maxInput.addEventListener("input", onRatingChange);
    maxInput.addEventListener("change", onRatingChange);
  }

  const gpSelect = elements.filterGameplay || document.querySelector("#filter-gameplay");
  if (gpSelect) {
    gpSelect.addEventListener("change", (e) => {
      state.gameplayProgress = e.target.value;
      updateActiveFilterBadge();
      syncSearchUrl();
      renderGames();
    });
  }
}

initControlsEvents();

function initBackgroundCanvas() {
  const canvas = document.querySelector("#background-canvas");
  if (!canvas) return;

  const context = canvas.getContext("2d", {
    alpha: true,
    desynchronized: true
  });

  if (!context) return;

  const mobileQuery = window.matchMedia("(max-width: 760px)");

  const state = {
    width: 0,
    height: 0,
    dpr: 1,
    nodes: [],
    circuits: [],
    raf: 0,
    lastTime: 0,
    visible: true,
    bootPaused: true
  };

  let cachedGradient = null;

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
    if (mobileQuery.matches || !animationsEnabled) {
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
    state.dpr = 1;

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

    cachedGradient = context.createRadialGradient(
      state.width * .5,
      state.height * .18,
      0,
      state.width * .5,
      state.height * .18,
      state.width * .62
    );
    cachedGradient.addColorStop(0, "rgba(0, 240, 255, .045)");
    cachedGradient.addColorStop(.5, "rgba(138, 92, 255, .022)");
    cachedGradient.addColorStop(1, "rgba(5, 7, 13, 0)");

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

  function drawStaticFrame(seconds = 0) {
    if (mobileQuery.matches || !animationsEnabled) {
      context.clearRect(0, 0, state.width, state.height);
      return;
    }

    if (!state.width || !state.height) {
      resize();
    }

    context.clearRect(0, 0, state.width, state.height);

    if (cachedGradient) {
      context.fillStyle = cachedGradient;
      context.fillRect(0, 0, state.width, state.height);
    }

    for (const circuit of state.circuits) {
      drawCircuit(circuit, seconds);
    }

    const maxDistance = 135;
    const maxDistanceSq = 135 * 135;

    for (let i = 0; i < state.nodes.length; i++) {
      const node = state.nodes[i];
      const pulse = .36 + (Math.sin(seconds * .7 + node.phase) + 1) * .10;

      for (let j = i + 1; j < state.nodes.length; j++) {
        const other = state.nodes[j];
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const distSq = dx * dx + dy * dy;

        if (distSq > maxDistanceSq) continue;

        const distance = Math.sqrt(distSq);
        const opacity = (1 - distance / maxDistance) * .085;

        context.beginPath();
        context.moveTo(node.x, node.y);
        context.lineTo(other.x, other.y);
        context.strokeStyle = color(node.hue, opacity);
        context.lineWidth = .7;
        context.stroke();
      }

      context.beginPath();
      context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      context.fillStyle = color(node.hue, pulse * node.pulse);
      context.fill();
    }
  }

  function render(time) {
    if (state.bootPaused) {
      if (state.raf) {
        cancelAnimationFrame(state.raf);
        state.raf = 0;
      }
      return;
    }

    if (mobileQuery.matches || !animationsEnabled) {
      if (state.raf) {
        cancelAnimationFrame(state.raf);
        state.raf = 0;
      }
      context.clearRect(0, 0, state.width, state.height);
      return;
    }

    if (document.hidden || !state.visible) {
      if (state.raf) {
        cancelAnimationFrame(state.raf);
        state.raf = 0;
      }
      return;
    }

    const seconds = time * .001;

    context.clearRect(
      0,
      0,
      state.width,
      state.height
    );

    if (cachedGradient) {
      context.fillStyle = cachedGradient;
      context.fillRect(
        0,
        0,
        state.width,
        state.height
      );
    }

    for (const circuit of state.circuits) {
      drawCircuit(circuit, seconds);
    }

    const maxDistance = 135;
    const maxDistanceSq = 135 * 135;

    for (let i = 0; i < state.nodes.length; i++) {
      const node = state.nodes[i];

      node.x += node.vx * .015;
      node.y += node.vy * .015;

      if (node.x < -20) node.x = state.width + 20;
      if (node.x > state.width + 20) node.x = -20;
      if (node.y < -20) node.y = state.height + 20;
      if (node.y > state.height + 20) node.y = -20;

      const pulse =
        .36 +
        (
          Math.sin(seconds * .7 + node.phase) + 1
        ) * .10;

      for (let j = i + 1; j < state.nodes.length; j++) {
        const other = state.nodes[j];
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const distSq = dx * dx + dy * dy;

        if (distSq > maxDistanceSq) continue;

        const distance = Math.sqrt(distSq);
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
    if (state.bootPaused) {
      if (state.raf) {
        cancelAnimationFrame(state.raf);
        state.raf = 0;
      }
      return;
    }

    if (mobileQuery.matches || !animationsEnabled) {
      if (state.raf) {
        cancelAnimationFrame(state.raf);
        state.raf = 0;
      }
      context.clearRect(0, 0, state.width, state.height);
      return;
    }

    if (document.hidden || !state.visible) {
      if (state.raf) {
        cancelAnimationFrame(state.raf);
        state.raf = 0;
      }
      return;
    }

    if (!state.width || !state.height) {
      resize();
    }

    if (!state.raf) {
      state.raf = requestAnimationFrame(render);
    }
  }

  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      state.visible = entries[0]?.isIntersecting !== false;
      if (!state.visible) {
        if (state.raf) {
          cancelAnimationFrame(state.raf);
          state.raf = 0;
        }
      } else {
        updateAnimationLoop();
      }
    },
    { threshold: 0 }
  );

  visibilityObserver.observe(canvas);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (state.raf) {
        cancelAnimationFrame(state.raf);
        state.raf = 0;
      }
    } else {
      updateAnimationLoop();
    }
  });

  mobileQuery.addEventListener("change", updateAnimationLoop);

  window.addEventListener(
    "resize",
    () => {
      if (mobileQuery.matches || !animationsEnabled) {
        if (state.raf) {
          cancelAnimationFrame(state.raf);
          state.raf = 0;
        }
        context.clearRect(0, 0, state.width, state.height);
      } else {
        resize();
        if (!state.bootPaused && !state.raf) {
          state.raf = requestAnimationFrame(render);
        } else if (state.bootPaused) {
          drawStaticFrame(0);
        }
      }
    },
    { passive: true }
  );

  window.__ensureCanvasReady = function () {
    if (mobileQuery.matches || !animationsEnabled) return;
    if (!state.width || !state.height) {
      resize();
    }
    drawStaticFrame(performance.now() * 0.001);
  };

  window.__updateCanvasAnimations = function (enabled) {
    updateAnimationLoop();
  };

  window.__resumeCanvasAnimations = function () {
    state.bootPaused = false;
    updateAnimationLoop();
  };

  resize();
  drawStaticFrame(0);
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

  let cleaned = text.replace(
    /<script\b[^>]*?src=["'](?:https?:)?\/\/(?:www\.)?instagram\.com\/embed\.js["'][^>]*?>\s*(?:<\/script>)?/gi,
    ""
  );

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

    return `\n\n<div class="review-instagram-placeholder" data-instagram-permalink="${escapeHtml(validatedUrl)}"></div>\n\n`;
  });

  return cleaned;
}

function processSafeEmbeds(markdown) {
  if (!markdown) return "";

  const lines = markdown.split("\n");
  const processed = lines.map((line) => {
    const trimmed = line.trim();

    const ytMatch = trimmed.match(
      /^(?:https?:)?\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S*)?$/i
    );
    if (ytMatch) {
      const videoId = encodeURIComponent(ytMatch[1]);
      return `<div class="review-video-embed" data-provider="YOUTUBE"><iframe src="https://www.youtube-nocookie.com/embed/${videoId}" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>`;
    }

    const vimeoMatch = trimmed.match(
      /^(?:https?:)?\/\/(?:www\.)?vimeo\.com\/(\d+)(?:\S*)?$/i
    );
    if (vimeoMatch) {
      const videoId = encodeURIComponent(vimeoMatch[1]);
      return `<div class="review-video-embed" data-provider="VIMEO"><iframe src="https://player.vimeo.com/video/${videoId}" allowfullscreen allow="autoplay; fullscreen; picture-in-picture"></iframe></div>`;
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
    const href = (link.getAttribute("href") || "").trim();

    try {
      const url = new URL(href, window.location.href);
      if (
        url.origin === window.location.origin &&
        url.searchParams.has("review")
      ) {
        link.removeAttribute("target");
        link.removeAttribute("rel");
        link.setAttribute("data-review-slug", url.searchParams.get("review") || "");
      } else if (url.protocol === "http:" || url.protocol === "https:") {
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      } else {
        link.removeAttribute("href");
        link.setAttribute("aria-disabled", "true");
      }
    } catch {
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
      ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "loading", "data-instagram-permalink", "data-provider"]
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

const EMBED_TIMEOUT_MS = 14000;
let activeEmbedControllers = [];

function cleanupActiveEmbeds() {
  if (activeEmbedControllers.length) {
    activeEmbedControllers.forEach((controller) => {
      try {
        controller.cleanup();
      } catch (err) {
        console.warn("[GameWall] Embed cleanup error:", err);
      }
    });
    activeEmbedControllers = [];
  }
}

function createEmbedLoadingState(provider) {
  const loading = document.createElement("div");
  loading.className = "embed-loading-state";
  loading.setAttribute("role", "status");
  loading.setAttribute("aria-live", "polite");

  const badge = document.createElement("div");
  badge.className = `embed-provider-badge provider-${provider.toLowerCase()}`;
  badge.textContent = `[ ${provider} ]`;

  const title = document.createElement("p");
  title.className = "embed-loading-title";
  title.textContent = `LOADING ${provider} EMBED...`;

  const indicatorWrap = document.createElement("div");
  indicatorWrap.className = "embed-indicator-wrap";
  indicatorWrap.setAttribute("aria-hidden", "true");

  const spinner = document.createElement("div");
  spinner.className = "embed-spinner-ring";

  const progressBar = document.createElement("div");
  progressBar.className = "embed-progress-bar";

  indicatorWrap.append(spinner, progressBar);

  const subtitle = document.createElement("p");
  subtitle.className = "embed-loading-subtitle";
  subtitle.textContent = "INITIALIZING EXTERNAL STREAM";

  loading.append(badge, title, indicatorWrap, subtitle);
  return loading;
}

function createEmbedFailureState(provider, permalink = null) {
  const failure = document.createElement("div");
  failure.className = "embed-failure-state";
  failure.setAttribute("role", "alert");

  const badge = document.createElement("div");
  badge.className = "embed-failure-badge";
  badge.innerHTML = `
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
    <span>// EXTERNAL SIGNAL LOST // ${provider}</span>
  `;

  const title = document.createElement("h4");
  title.className = "embed-failure-title";
  title.textContent = "EMBED FAILED TO LOAD";

  const message = document.createElement("p");
  message.className = "embed-failure-message";
  message.textContent = "The external content could not be loaded.";

  const actions = document.createElement("div");
  actions.className = "embed-failure-actions";

  const reloadBtn = document.createElement("button");
  reloadBtn.type = "button";
  reloadBtn.className = "embed-reload-btn";
  reloadBtn.setAttribute("aria-label", "Reload current page");
  reloadBtn.innerHTML = `
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="23 4 23 10 17 10"></polyline>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
    </svg>
    <span>RELOAD PAGE</span>
  `;
  reloadBtn.addEventListener("click", () => {
    window.location.reload();
  });

  actions.appendChild(reloadBtn);

  if (permalink) {
    const extLink = document.createElement("a");
    extLink.className = "embed-external-link";
    extLink.href = permalink;
    extLink.target = "_blank";
    extLink.rel = "noopener noreferrer";
    extLink.innerHTML = `<span>VIEW ON ${provider}</span> <span aria-hidden="true">↗</span>`;
    actions.appendChild(extLink);
  }

  failure.append(badge, title, message, actions);
  return failure;
}

function initVideoEmbed(container) {
  const provider = (container.getAttribute("data-provider") || "VIDEO").toUpperCase();
  const iframe = container.querySelector("iframe");
  if (!iframe) return;

  const loadingOverlay = createEmbedLoadingState(provider);
  container.appendChild(loadingOverlay);

  let isDone = false;
  let timer = null;

  const markSuccess = () => {
    if (isDone) return;
    isDone = true;
    if (timer) clearTimeout(timer);
    container.classList.add("is-loaded");
    loadingOverlay.classList.add("is-hidden");
    setTimeout(() => {
      if (loadingOverlay.parentElement) loadingOverlay.remove();
    }, 350);
  };

  const markFailure = () => {
    if (isDone) return;
    isDone = true;
    if (timer) clearTimeout(timer);
    if (loadingOverlay.parentElement) loadingOverlay.remove();
    iframe.style.display = "none";
    try {
      iframe.src = "about:blank";
    } catch { }
    const failureCard = createEmbedFailureState(provider);
    container.appendChild(failureCard);
  };

  timer = setTimeout(() => {
    console.warn(`[GameWall] ${provider} embed timed out after ${EMBED_TIMEOUT_MS}ms`);
    markFailure();
  }, EMBED_TIMEOUT_MS);

  const onLoad = () => {
    markSuccess();
  };

  const onError = () => {
    console.warn(`[GameWall] ${provider} iframe fired error event`);
    markFailure();
  };

  iframe.addEventListener("load", onLoad);
  iframe.addEventListener("error", onError);

  activeEmbedControllers.push({
    cleanup() {
      if (timer) clearTimeout(timer);
      iframe.removeEventListener("load", onLoad);
      iframe.removeEventListener("error", onError);
      try {
        iframe.src = "about:blank";
      } catch { }
    }
  });
}

function initInstagramEmbed(placeholder) {
  const permalink = placeholder.getAttribute("data-instagram-permalink");
  const validated = validateInstagramUrl(permalink);
  if (!validated) {
    placeholder.remove();
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "review-instagram-wrapper";

  const blockquote = document.createElement("blockquote");
  blockquote.className = "instagram-media";
  blockquote.setAttribute("data-instgrm-permalink", validated);
  blockquote.setAttribute("data-instgrm-version", "14");

  const loadingOverlay = createEmbedLoadingState("INSTAGRAM");

  wrapper.append(blockquote, loadingOverlay);
  placeholder.replaceWith(wrapper);

  let isDone = false;
  let timer = null;
  let checkInterval = null;
  let observer = null;

  const markSuccess = () => {
    if (isDone) return;
    isDone = true;
    if (timer) clearTimeout(timer);
    if (checkInterval) clearInterval(checkInterval);
    if (observer) observer.disconnect();
    wrapper.classList.add("is-loaded");
    loadingOverlay.classList.add("is-hidden");
    setTimeout(() => {
      if (loadingOverlay.parentElement) loadingOverlay.remove();
    }, 350);
  };

  const markFailure = () => {
    if (isDone) return;
    isDone = true;
    if (timer) clearTimeout(timer);
    if (checkInterval) clearInterval(checkInterval);
    if (observer) observer.disconnect();
    if (loadingOverlay.parentElement) loadingOverlay.remove();
    try {
      blockquote.remove();
    } catch { }
    const existingIframe = wrapper.querySelector("iframe");
    if (existingIframe) {
      try { existingIframe.src = "about:blank"; } catch { }
      existingIframe.remove();
    }
    const failureCard = createEmbedFailureState("INSTAGRAM", validated);
    wrapper.appendChild(failureCard);
  };

  timer = setTimeout(() => {
    console.warn(`[GameWall] Instagram embed timed out after ${EMBED_TIMEOUT_MS}ms`);
    markFailure();
  }, EMBED_TIMEOUT_MS);

  const checkInstagramRendered = () => {
    if (isDone) return;
    const iframe = wrapper.querySelector("iframe");
    if (iframe) {
      try {
        if (iframe.contentDocument && iframe.contentDocument.readyState === "complete") {
          markSuccess();
          return;
        }
      } catch { }
      iframe.addEventListener("load", () => {
        markSuccess();
      }, { once: true });
      iframe.addEventListener("error", () => {
        markFailure();
      }, { once: true });
    }
  };

  observer = new MutationObserver(() => {
    checkInstagramRendered();
  });
  observer.observe(wrapper, { childList: true, subtree: true });

  checkInterval = setInterval(checkInstagramRendered, 150);

  loadInstagramScript()
    .then((instgrm) => {
      if (isDone) return;
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
      console.warn("[GameWall] Instagram script load failed:", err);
      markFailure();
    });

  activeEmbedControllers.push({
    cleanup() {
      if (timer) clearTimeout(timer);
      if (checkInterval) clearInterval(checkInterval);
      if (observer) observer.disconnect();
      const iframe = wrapper.querySelector("iframe");
      if (iframe) {
        try { iframe.src = "about:blank"; } catch { }
      }
    }
  });
}

function setupReviewEmbeds(container) {
  if (!container) return;
  const videoEmbeds = Array.from(container.querySelectorAll(".review-video-embed"));
  videoEmbeds.forEach(initVideoEmbed);

  const instagramPlaceholders = Array.from(container.querySelectorAll(".review-instagram-placeholder"));
  instagramPlaceholders.forEach(initInstagramEmbed);
}

let activeReviewImageControllers = [];

function cleanupActiveReviewImages() {
  activeReviewImageControllers.forEach((controller) => {
    try {
      controller.cleanup();
    } catch { }
  });
  activeReviewImageControllers = [];
}

function setupReviewImages(container) {
  if (!container) return;
  const images = Array.from(container.querySelectorAll("img"));

  images.forEach((img) => {
    if (img.closest(".review-image-frame, .steam-review-card, .review-video-embed, .review-instagram-placeholder")) {
      return;
    }

    img.classList.add("review-image");

    const frame = document.createElement("figure");
    frame.className = "review-image-frame is-loading";

    const loader = document.createElement("div");
    loader.className = "review-image-loader";
    loader.setAttribute("aria-hidden", "true");

    const spinner = document.createElement("div");
    spinner.className = "review-image-spinner";

    const scan = document.createElement("div");
    scan.className = "review-image-scan";

    const text = document.createElement("small");
    text.className = "review-image-text";
    text.textContent = "LOADING IMAGE...";

    loader.append(spinner, scan, text);

    const errorDiv = document.createElement("div");
    errorDiv.className = "review-image-error";
    errorDiv.setAttribute("role", "alert");

    const errorIcon = document.createElement("span");
    errorIcon.className = "review-image-error-icon";
    errorIcon.setAttribute("aria-hidden", "true");
    errorIcon.textContent = "⚠";

    const errorText = document.createElement("span");
    errorText.className = "review-image-error-text";
    errorText.textContent = "IMAGE FAILED TO LOAD";

    errorDiv.append(errorIcon, errorText);

    const altText = (img.getAttribute("alt") || "").trim();
    if (altText) {
      const errorAlt = document.createElement("span");
      errorAlt.className = "review-image-error-alt";
      errorAlt.textContent = `[${altText}]`;
      errorDiv.append(errorAlt);
    }

    const parent = img.parentElement;
    if (parent && parent.tagName === "P" && parent.childNodes.length === 1) {
      parent.replaceWith(frame);
    } else if (parent) {
      parent.insertBefore(frame, img);
    }
    frame.append(img, loader, errorDiv);

    let finished = false;
    let timeoutId = null;

    const onLoad = () => {
      if (finished) return;
      finished = true;
      if (timeoutId) clearTimeout(timeoutId);
      frame.classList.remove("is-loading");
      frame.classList.add("is-loaded");
      setTimeout(() => {
        try { loader.remove(); } catch { }
      }, 350);
    };

    const onError = () => {
      if (finished) return;
      finished = true;
      if (timeoutId) clearTimeout(timeoutId);
      frame.classList.remove("is-loading");
      frame.classList.add("is-error");
      try { loader.remove(); } catch { }
    };

    if (img.complete) {
      if (img.naturalWidth > 0) {
        onLoad();
        return;
      } else if (img.src) {
        onError();
        return;
      }
    }

    img.addEventListener("load", onLoad, { once: true });
    img.addEventListener("error", onError, { once: true });

    timeoutId = setTimeout(() => {
      if (!finished && (!img.complete || img.naturalWidth === 0)) {
        onError();
      }
    }, 15000);

    activeReviewImageControllers.push({
      cleanup() {
        if (timeoutId) clearTimeout(timeoutId);
        img.removeEventListener("load", onLoad);
        img.removeEventListener("error", onError);
      }
    });
  });
}

let lastFocusedElement = null;
let savedScrollY = 0;
let currentReviewGame = null;
let activeReviewSlug = null;
let previousSearchUrl = null;
let copyFeedbackTimeout = null;
let reviewCloseTimeout = null;
let isHandlingUrlChange = false;

function safeHistoryUpdate(fn) {
  isHandlingUrlChange = true;
  try {
    fn();
  } finally {
    isHandlingUrlChange = false;
  }
}

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

const STEAM_REVIEW_PLACEHOLDER = "GW_STEAM_REVIEW_EMBED_PLACEHOLDER";

function extractSteamReviewShortcode(rawDescription) {
  const description = typeof rawDescription === "string" ? rawDescription : "";
  const shortcodePattern = /\[steamreview\]([\s\S]*?)\[\/steamreview\]\((https?:\/\/[^\s)]+)\)/i;
  const match = description.match(shortcodePattern);

  if (!match) {
    return { markdown: description, steamReview: null };
  }

  const text = match[1].trim();
  const url = match[2].trim();

  if (!text || !isSafeUrl(url)) {
    return { markdown: description, steamReview: null };
  }

  return {
    markdown: description.replace(match[0], `\n\n${STEAM_REVIEW_PLACEHOLDER}\n\n`),
    steamReview: { text, url }
  };
}

function createSteamReviewCard(steamReview) {
  if (!steamReview?.text || !isSafeUrl(steamReview.url)) return null;

  const card = document.createElement("section");
  card.className = "steam-review-card";
  card.setAttribute("aria-label", "Original Steam review");

  const label = document.createElement("div");
  label.className = "steam-review-label";
  label.textContent = "STEAM COMMUNITY REVIEW";

  const title = document.createElement("h3");
  title.className = "steam-review-title";
  title.textContent = "My Steam Review";

  const quote = document.createElement("blockquote");
  quote.className = "steam-review-quote";
  quote.textContent = steamReview.text;

  const note = document.createElement("p");
  note.className = "steam-review-note";
  note.textContent = "Original review excerpt, linked to the full post on Steam.";

  const link = document.createElement("a");
  link.className = "steam-review-link";
  link.href = steamReview.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "READ MY REVIEW DIRECTLY ON STEAM ↗";
  link.setAttribute("aria-label", "Read the original Steam review (opens in a new tab)");

  card.append(label, title, quote, note, link);
  return card;
}

function renderSteamReviewShortcode(container, steamReview) {
  if (!container || !steamReview) return;

  const card = createSteamReviewCard(steamReview);
  if (!card) return;

  const placeholder = Array.from(container.querySelectorAll("p")).find(
    (paragraph) => paragraph.textContent.trim() === STEAM_REVIEW_PLACEHOLDER
  );

  if (placeholder) {
    placeholder.replaceWith(card);
  } else {
    container.append(card);
  }
}

const SPOILER_STORAGE_KEY = "gamewall-skip-spoiler-warning";
let pendingReviewRequest = null;
let isSpoilerWarningOpen = false;
let spoilerCloseTimeout = null;

function shouldSkipSpoilerWarning() {
  try {
    return localStorage.getItem(SPOILER_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function setSkipSpoilerWarning(skip) {
  try {
    if (skip) {
      localStorage.setItem(SPOILER_STORAGE_KEY, "true");
    } else {
      localStorage.removeItem(SPOILER_STORAGE_KEY);
    }
  } catch { }
}

function showSpoilerWarning(game, identifier, triggerElement, fromPopstate = false) {
  if (!game) return;

  if (spoilerCloseTimeout) {
    clearTimeout(spoilerCloseTimeout);
    spoilerCloseTimeout = null;
  }

  const isModalOpen = elements.reviewModalBackdrop &&
    !elements.reviewModalBackdrop.hidden &&
    elements.reviewModalBackdrop.classList.contains("is-open");

  pendingReviewRequest = {
    game,
    identifier,
    triggerElement: triggerElement || (isModalOpen ? elements.reviewModalClose : (document.activeElement && document.activeElement !== document.body ? document.activeElement : null)),
    fromPopstate,
    isModalOpenUnderneath: Boolean(isModalOpen),
    previousUrl: previousSearchUrl || `${window.location.pathname}${buildSearchQueryString()}${window.location.hash}`
  };

  isSpoilerWarningOpen = true;

  if (elements.spoilerModalGameTarget) {
    elements.spoilerModalGameTarget.textContent = game.title.toUpperCase();
  }

  document.documentElement.classList.add("spoiler-modal-open");
  document.body.classList.add("spoiler-modal-open");
  if (!isModalOpen) {
    elements.mainContent?.setAttribute("aria-hidden", "true");
  }

  if (elements.spoilerModalBackdrop) {
    elements.spoilerModalBackdrop.hidden = false;
    elements.spoilerModalBackdrop.removeAttribute("aria-hidden");
    elements.spoilerModalBackdrop.classList.add("is-open");
    elements.spoilerBtnOk?.focus();
    setTimeout(() => {
      elements.spoilerBtnOk?.focus();
    }, 40);
  }
}

function closeSpoilerWarning(cancelled = false) {
  if (!elements.spoilerModalBackdrop || elements.spoilerModalBackdrop.hidden) return;
  isSpoilerWarningOpen = false;

  if (spoilerCloseTimeout) {
    clearTimeout(spoilerCloseTimeout);
    spoilerCloseTimeout = null;
  }

  elements.spoilerModalBackdrop.classList.remove("is-open");

  const isModalOpen = elements.reviewModalBackdrop &&
    !elements.reviewModalBackdrop.hidden &&
    elements.reviewModalBackdrop.classList.contains("is-open");

  document.documentElement.classList.remove("spoiler-modal-open");
  document.body.classList.remove("spoiler-modal-open");

  if (!isModalOpen && cancelled) {
    elements.mainContent?.removeAttribute("aria-hidden");
  }

  if (elements.gwCursor) {
    elements.gwCursor.classList.remove("is-danger-hover");
  }

  spoilerCloseTimeout = setTimeout(() => {
    spoilerCloseTimeout = null;
    if (elements.spoilerModalBackdrop) {
      elements.spoilerModalBackdrop.hidden = true;
      elements.spoilerModalBackdrop.setAttribute("aria-hidden", "true");
    }
  }, 220);
}

function handleSpoilerBack() {
  if (!isSpoilerWarningOpen) return;

  const req = pendingReviewRequest;
  pendingReviewRequest = null;

  closeSpoilerWarning(true);

  if (!req) return;

  if (!req.isModalOpenUnderneath) {
    const currentParams = new URLSearchParams(window.location.search);
    if (currentParams.has("review")) {
      const cleanUrl = req.previousUrl || `${window.location.pathname}${buildSearchQueryString()}${window.location.hash}`;
      safeHistoryUpdate(() => {
        window.history.replaceState({ type: "search" }, "", cleanUrl);
      });
    }
    previousSearchUrl = null;
    activeReviewSlug = null;
    currentReviewGame = null;

    if (req.triggerElement && typeof req.triggerElement.focus === "function" && req.triggerElement.isConnected) {
      req.triggerElement.focus();
    } else if (req.game?.id) {
      const card = document.querySelector(`.game-card[data-game-id="${req.game.id}"]`);
      const btn = card?.querySelector(".review-button:not([hidden])") || card?.querySelector(".view-game");
      if (btn && typeof btn.focus === "function") {
        btn.focus();
      } else {
        elements.search?.focus();
      }
    } else {
      elements.search?.focus();
    }
  } else {
    if (req.triggerElement && typeof req.triggerElement.focus === "function" && req.triggerElement.isConnected) {
      req.triggerElement.focus();
    } else {
      elements.reviewModalClose?.focus();
    }
  }
}

function handleSpoilerConfirm(dontRemind = false) {
  if (!isSpoilerWarningOpen) return;

  if (dontRemind) {
    setSkipSpoilerWarning(true);
  }

  const req = pendingReviewRequest;
  pendingReviewRequest = null;

  closeSpoilerWarning(false);

  if (req && req.game) {
    openReviewModal(req.game, req.identifier, req.triggerElement, req.fromPopstate, true);
  }
}

function initSpoilerWarningEvents() {
  if (elements.spoilerBtnOk) {
    elements.spoilerBtnOk.addEventListener("click", () => handleSpoilerConfirm(false));
  }
  if (elements.spoilerBtnBack) {
    elements.spoilerBtnBack.addEventListener("click", handleSpoilerBack);
  }
  if (elements.spoilerBtnDontRemind) {
    elements.spoilerBtnDontRemind.addEventListener("click", () => handleSpoilerConfirm(true));
  }

  if (elements.spoilerModalBackdrop) {
    elements.spoilerModalBackdrop.addEventListener("click", (event) => {
      if (event.target === elements.spoilerModalBackdrop) {
        handleSpoilerBack();
      }
    });
  }

  if (elements.spoilerModal) {
    elements.spoilerModal.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;

      const focusables = [
        elements.spoilerBtnOk,
        elements.spoilerBtnBack,
        elements.spoilerBtnDontRemind
      ].filter((btn) => btn && !btn.disabled && btn.offsetParent !== null);

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

function openReviewModal(game, identifier, triggerElement, fromPopstate = false, bypassSpoilerWarning = false) {
  if (!game || !game.description) return;

  const isModalOpen = elements.reviewModalBackdrop &&
    !elements.reviewModalBackdrop.hidden &&
    elements.reviewModalBackdrop.classList.contains("is-open");

  if (!bypassSpoilerWarning && !shouldSkipSpoilerWarning()) {
    showSpoilerWarning(game, identifier, triggerElement, fromPopstate);
    return;
  }

  if (isModalOpen && activeReviewSlug?.toLowerCase() === game.id.toLowerCase()) {
    return;
  }

  if (reviewCloseTimeout) {
    clearTimeout(reviewCloseTimeout);
    reviewCloseTimeout = null;
  }

  currentReviewGame = game;

  if (!activeReviewSlug) {
    const currentQs = buildSearchQueryString();
    previousSearchUrl = `${window.location.pathname}${currentQs}${window.location.hash}`;
  }

  activeReviewSlug = game.id;

  const reviewUrl = `${window.location.pathname}?review=${encodeURIComponent(game.id)}${window.location.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (!fromPopstate && currentUrl !== reviewUrl) {
    safeHistoryUpdate(() => {
      if (isModalOpen) {
        window.history.pushState({ type: "review", slug: game.id }, "", reviewUrl);
      } else {
        window.history.replaceState({ type: "review", slug: game.id }, "", reviewUrl);
      }
    });
  }

  if (!isModalOpen) {
    lastFocusedElement = triggerElement || document.activeElement;
    savedScrollY = window.scrollY || window.pageYOffset || 0;

    document.documentElement.classList.add("modal-open");
    document.body.classList.add("modal-open");
    elements.mainContent?.setAttribute("aria-hidden", "true");
  }

  if (copyFeedbackTimeout) {
    clearTimeout(copyFeedbackTimeout);
    copyFeedbackTimeout = null;
  }
  if (elements.reviewModalShare) {
    elements.reviewModalShare.classList.remove("is-copied");
    elements.reviewModalShare.setAttribute("aria-label", "Share review link");
  }

  if (elements.reviewModalId) {
    elements.reviewModalId.textContent = identifier;
  }
  if (elements.reviewModalTitle) {
    elements.reviewModalTitle.textContent = `${game.title} — Review`;
  }
  if (elements.reviewModalBody) {
    cleanupActiveEmbeds();
    cleanupActiveReviewImages();
    resetIframeCursorState();
    elements.reviewModalBody.querySelectorAll("iframe").forEach((frame) => {
      try {
        frame.src = "about:blank";
      } catch { }
    });
    elements.reviewModalBody.replaceChildren();
    const reviewContent = extractSteamReviewShortcode(game.description);
    elements.reviewModalBody.innerHTML = renderReviewMarkdown(reviewContent.markdown);
    renderSteamReviewShortcode(elements.reviewModalBody, reviewContent.steamReview);
    elements.reviewModalBody.scrollTop = 0;
    setupReviewEmbeds(elements.reviewModalBody);
    setupReviewImages(elements.reviewModalBody);
  }

  if (elements.reviewModalBackdrop) {
    if (!isModalOpen) {
      elements.reviewModalBackdrop.hidden = false;
      elements.reviewModalBackdrop.removeAttribute("aria-hidden");
      requestAnimationFrame(() => {
        elements.reviewModalBackdrop.classList.add("is-open");
        elements.reviewModalClose?.focus();
        window.__updatePageNav?.();
      });
    } else {
      elements.reviewModalClose?.focus();
      window.__updatePageNav?.();
    }
  }
}

function closeReviewModal(fromPopstate = false) {
  if (!elements.reviewModalBackdrop || elements.reviewModalBackdrop.hidden) return;

  cleanupActiveEmbeds();
  cleanupActiveReviewImages();
  resetIframeCursorState();

  if (reviewCloseTimeout) {
    clearTimeout(reviewCloseTimeout);
    reviewCloseTimeout = null;
  }

  if (!fromPopstate) {
    const restoreUrl = previousSearchUrl || `${window.location.pathname}${buildSearchQueryString()}${window.location.hash}`;
    safeHistoryUpdate(() => {
      window.history.replaceState({ type: "search" }, "", restoreUrl);
    });
  }
  previousSearchUrl = null;
  activeReviewSlug = null;
  currentReviewGame = null;

  elements.reviewModalBackdrop.classList.remove("is-open");
  document.documentElement.classList.remove("modal-open");
  document.body.classList.remove("modal-open");
  elements.mainContent?.removeAttribute("aria-hidden");

  window.scrollTo(0, savedScrollY);
  window.__updatePageNav?.();

  reviewCloseTimeout = setTimeout(() => {
    reviewCloseTimeout = null;
    elements.reviewModalBackdrop.hidden = true;
    elements.reviewModalBackdrop.setAttribute("aria-hidden", "true");
    cleanupActiveEmbeds();
    cleanupActiveReviewImages();
    if (elements.reviewModalBody) {
      elements.reviewModalBody.innerHTML = "";
    }
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
    window.__updatePageNav?.();
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
      const cleanUrl = `${window.location.pathname}${buildSearchQueryString()}${window.location.hash}`;
      safeHistoryUpdate(() => {
        window.history.replaceState({ type: "search" }, "", cleanUrl);
      });
    }
  } catch (err) {
    console.warn("[GameWall] Error checking initial review slug:", err);
  }
}

function navigateToReview(slug, fromPopstate = false, triggerElement = null) {
  if (!slug) return;
  const trimmed = slug.trim().toLowerCase();

  if (!state.initialized) return;

  const targetGame = state.games.find((g) => g.id.toLowerCase() === trimmed);
  if (targetGame && targetGame.description) {
    const gameIndex = state.games.indexOf(targetGame);
    const identifier = `GW-${String(gameIndex + 1).padStart(3, "0")}`;
    openReviewModal(targetGame, identifier, triggerElement, fromPopstate);
  } else {
    if (elements.reviewModalBackdrop && !elements.reviewModalBackdrop.hidden) {
      closeReviewModal(fromPopstate);
    }
  }
}

function handleUrlChange(fromHistory = false) {
  if (isHandlingUrlChange || !state.initialized) return;

  const currentParams = new URLSearchParams(window.location.search);
  const reviewSlug = currentParams.get("review");

  if (reviewSlug) {
    const normalizedSlug = reviewSlug.trim().toLowerCase();
    if (activeReviewSlug?.toLowerCase() !== normalizedSlug) {
      safeHistoryUpdate(() => {
        navigateToReview(normalizedSlug, true);
      });
    }
  } else {
    if (isSpoilerWarningOpen) {
      closeSpoilerWarning(true);
      pendingReviewRequest = null;
    }
    if (elements.reviewModalBackdrop && !elements.reviewModalBackdrop.hidden) {
      safeHistoryUpdate(() => {
        closeReviewModal(true);
      });
    }
  }
}

function hookHistoryNavigation() {
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  window.history.pushState = function (...args) {
    const result = originalPushState.apply(this, args);
    handleUrlChange(true);
    return result;
  };

  window.history.replaceState = function (...args) {
    const result = originalReplaceState.apply(this, args);
    handleUrlChange(true);
    return result;
  };
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
    if (event.key === "Escape") {
      if (isSpoilerWarningOpen && elements.spoilerModalBackdrop && !elements.spoilerModalBackdrop.hidden) {
        event.preventDefault();
        event.stopPropagation();
        handleSpoilerBack();
        return;
      }
      if (elements.reviewModalBackdrop && !elements.reviewModalBackdrop.hidden) {
        closeReviewModal(false);
      }
    }
  }, true);

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

  document.addEventListener("click", (event) => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }

    const link = event.target.closest("a");
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href) return;

    try {
      const url = new URL(href, window.location.href);
      if (url.origin === window.location.origin && url.searchParams.has("review")) {
        const targetSlug = url.searchParams.get("review");
        if (targetSlug && state.initialized) {
          event.preventDefault();
          navigateToReview(targetSlug, false, link);
        }
      }
    } catch { }
  });
}

window.addEventListener("popstate", () => {
  const currentParams = new URLSearchParams(window.location.search);
  const reviewSlug = currentParams.get("review");

  if (reviewSlug) {
    handleUrlChange(true);
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

function initPageNavigation() {
  const navBtn = elements.pageNavBtn || document.querySelector("#page-nav-btn");
  if (!navBtn) return;

  const SCROLL_THRESHOLD = 300;

  const updateState = () => {
    if (!state.initialized) {
      navBtn.hidden = true;
      return;
    }

    const isModalOpen = document.documentElement.classList.contains("modal-open") ||
      (elements.reviewModalBackdrop && !elements.reviewModalBackdrop.hidden && elements.reviewModalBackdrop.classList.contains("is-open"));

    if (isModalOpen) {
      navBtn.hidden = true;
      return;
    }

    navBtn.hidden = false;

    const scrollY = window.scrollY || window.pageYOffset || 0;
    if (scrollY > SCROLL_THRESHOLD) {
      if (!navBtn.classList.contains("is-top")) {
        navBtn.classList.remove("is-bottom");
        navBtn.classList.add("is-top");
        navBtn.setAttribute("aria-label", "Go to top");
        navBtn.setAttribute("title", "Go to top");
      }
    } else {
      if (!navBtn.classList.contains("is-bottom")) {
        navBtn.classList.remove("is-top");
        navBtn.classList.add("is-bottom");
        navBtn.setAttribute("aria-label", "Go to bottom");
        navBtn.setAttribute("title", "Go to bottom");
      }
    }
  };

  navBtn.addEventListener("click", () => {
    const behavior = !animationsEnabled ? "auto" : "smooth";

    if (navBtn.classList.contains("is-top")) {
      window.scrollTo({ top: 0, behavior });
    } else {
      const scrollHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      window.scrollTo({ top: scrollHeight, behavior });
    }
  });

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateState();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  window.__updatePageNav = updateState;
}

function isFinePointerDevice() {
  if (typeof window === "undefined" || !window.matchMedia) return false;

  const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
  const canHover = window.matchMedia("(hover: hover)").matches;
  const isCoarseOnly = window.matchMedia("(pointer: coarse) and not (pointer: fine)").matches;

  if (!hasFinePointer || !canHover || isCoarseOnly) {
    return false;
  }

  if (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0 && !hasFinePointer) {
    return false;
  }

  return true;
}

let isBooting = true;
let customCursorActive = false;
let cursorInitialized = false;
let isPointerOverIframe = false;
let lastPointerX = null;
let lastPointerY = null;

function deactivateCursorForIframe() {
  if (isPointerOverIframe) return;
  isPointerOverIframe = true;

  document.documentElement.classList.remove("has-custom-cursor");
  const cursor = elements.gwCursor || document.querySelector("#gw-cursor");
  if (cursor) {
    cursor.classList.remove("is-active", "is-hover", "is-danger-hover");
    cursor.style.display = "none";
  }
}

function activateCursorFromIframe(e) {
  if (!isPointerOverIframe) return;
  isPointerOverIframe = false;

  const cursor = elements.gwCursor || document.querySelector("#gw-cursor");
  if (e && typeof e.clientX === "number" && typeof e.clientY === "number") {
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    if (cursor) {
      cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    }
  }

  if (customCursorActive && !isBooting) {
    document.documentElement.classList.add("has-custom-cursor");
    if (cursor) {
      cursor.style.display = "";
      cursor.style.opacity = "";
      cursor.classList.add("is-active");
    }
    window.__updateCursorProgress?.();
  }
}

function resetIframeCursorState() {
  if (!isPointerOverIframe) return;
  isPointerOverIframe = false;
  if (customCursorActive && !isBooting) {
    document.documentElement.classList.add("has-custom-cursor");
    const cursor = elements.gwCursor || document.querySelector("#gw-cursor");
    if (cursor) {
      cursor.style.display = "";
      cursor.style.opacity = "";
    }
    window.__updateCursorProgress?.();
  }
}

function setCustomCursorEnabled(enabled) {
  const cursor = elements.gwCursor || document.querySelector("#gw-cursor");
  const isSupported = isFinePointerDevice();
  const shouldBeActive = Boolean(enabled && isSupported);

  customCursorActive = shouldBeActive;

  if (isBooting) {
    return;
  }

  if (shouldBeActive) {
    if (!isPointerOverIframe) {
      if (cursor) {
        cursor.classList.remove("is-loading");
        cursor.style.display = "";
        cursor.style.opacity = "";
      }
      if (lastPointerX !== null && lastPointerY !== null) {
        if (cursor) {
          cursor.style.transform = `translate3d(${lastPointerX}px, ${lastPointerY}px, 0)`;
          cursor.classList.add("is-active");
          const interactiveSelector = `
            a, button, input, select, textarea, label,
            [role="button"], [role="link"], [role="tab"],
            .game-card, .poster-link, .review-button, .view-game,
            .filter-chip, .filter-chip-btn, .page-nav-btn,
            .review-modal-close, .review-modal-share, .review-modal-close-btn,
            .anim-toggle-btn
          `;
          try {
            const hoveredElem = document.elementFromPoint(lastPointerX, lastPointerY);
            if (hoveredElem && hoveredElem.closest && hoveredElem.closest(interactiveSelector)) {
              cursor.classList.add("is-hover");
            } else {
              cursor.classList.remove("is-hover");
            }
          } catch { }
        }
        document.documentElement.classList.add("has-custom-cursor");
      } else {
        document.documentElement.classList.remove("has-custom-cursor");
        if (cursor) {
          cursor.classList.remove("is-active");
        }
      }
      window.__updateCursorProgress?.();
    }
  } else {
    document.documentElement.classList.remove("has-custom-cursor");
    if (cursor) {
      cursor.classList.remove("is-active", "is-hover", "is-danger-hover");
      cursor.style.display = "none";
      cursor.style.opacity = "0";
    }
  }
}

function getElementRotation(element) {
  try {
    const st = window.getComputedStyle(element);
    const tr = st.transform || st.webkitTransform;
    if (!tr || tr === "none") return 0;
    if (tr.startsWith("matrix3d")) {
      const values = tr.slice(9, -1).split(",");
      const a = parseFloat(values[0]);
      const b = parseFloat(values[1]);
      let deg = Math.atan2(b, a) * (180 / Math.PI);
      if (deg < 0) deg += 360;
      return deg;
    }
    if (tr.startsWith("matrix")) {
      const values = tr.slice(7, -1).split(",");
      const a = parseFloat(values[0]);
      const b = parseFloat(values[1]);
      let deg = Math.atan2(b, a) * (180 / Math.PI);
      if (deg < 0) deg += 360;
      return deg;
    }
    return 0;
  } catch {
    return 0;
  }
}

let fanStartupDone = false;
let fanStartupTimeouts = [];
let fanActiveAnimations = [];
let fanReadyForDecelResolve = null;
const fanReadyForDecelPromise = new Promise((resolve) => {
  fanReadyForDecelResolve = resolve;
});
let fanHighSpeedAnimation = null;
let fanHighSpeedStartTime = 0;
let fanTransitionRequested = false;
let fanDecelerating = false;
let fanDecelerationPromise = null;

function cancelCursorFanStartup() {
  fanStartupTimeouts.forEach((t) => clearTimeout(t));
  fanStartupTimeouts = [];

  fanActiveAnimations.forEach((anim) => {
    try {
      anim.cancel();
    } catch { }
  });
  fanActiveAnimations = [];

  if (fanHighSpeedAnimation) {
    try {
      fanHighSpeedAnimation.cancel();
    } catch { }
    fanHighSpeedAnimation = null;
  }

  fanStartupDone = true;
  if (fanReadyForDecelResolve) {
    fanReadyForDecelResolve();
  }

  const fan = document.querySelector(".gw-cursor-fan");
  if (fan) {
    fan.style.transform = "";
    const deploys = fan.querySelectorAll(".gw-blade-deploy");
    deploys.forEach((d) => (d.style.transform = "scale(1)"));
    const greys = fan.querySelectorAll(".gw-blade-grey");
    greys.forEach((g) => (g.style.opacity = "0"));
    const neons = fan.querySelectorAll(".gw-blade-neon");
    neons.forEach((n) => (n.style.opacity = "1"));
  }
  const hubCore = document.querySelector(".gw-cursor-hub-core");
  if (hubCore) {
    hubCore.style.opacity = "1";
    hubCore.style.filter = "drop-shadow(0 0 2px #00f0ff)";
  }
}

function initCursorFanStartup() {
  if (fanStartupDone) return;

  const fan = document.querySelector(".gw-cursor-fan");
  if (!fan) {
    fanStartupDone = true;
    if (fanReadyForDecelResolve) fanReadyForDecelResolve();
    return;
  }

  const bladeWraps = Array.from(fan.querySelectorAll(".gw-blade-wrap"));
  const hubCore = document.querySelector(".gw-cursor-hub-core");

  // Phase A - Staggered mechanical blade assembly
  const bladeDeployDuration = 320;
  const bladeStaggerDelay = 110;

  bladeWraps.forEach((wrap, i) => {
    const deployGroup = wrap.querySelector(".gw-blade-deploy");
    if (!deployGroup) return;

    const t = setTimeout(() => {
      if (fanStartupDone || fanDecelerating) return;
      const anim = deployGroup.animate(
        [
          { transform: "scale(0)" },
          { transform: "scale(1)" }
        ],
        {
          duration: bladeDeployDuration,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "forwards"
        }
      );
      fanActiveAnimations.push(anim);
      anim.finished.then(() => {
        if (!fanStartupDone && !fanDecelerating) {
          deployGroup.style.transform = "scale(1)";
          try { anim.cancel(); } catch { }
          const idx = fanActiveAnimations.indexOf(anim);
          if (idx !== -1) fanActiveAnimations.splice(idx, 1);
        }
      }).catch(() => { });
    }, i * bladeStaggerDelay);
    fanStartupTimeouts.push(t);
  });

  // Phase B - Power-on illumination
  const illuminationStart = (bladeWraps.length - 1) * bladeStaggerDelay + 200;
  const illuminationStagger = 80;
  const fadeDuration = 260;

  bladeWraps.forEach((wrap, i) => {
    const greyUse = wrap.querySelector(".gw-blade-grey");
    const neonUse = wrap.querySelector(".gw-blade-neon");
    if (!greyUse || !neonUse) return;

    const t = setTimeout(() => {
      if (fanStartupDone || fanDecelerating) return;
      const greyAnim = greyUse.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: fadeDuration, easing: "ease-in-out", fill: "forwards" }
      );
      const neonAnim = neonUse.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: fadeDuration, easing: "ease-in-out", fill: "forwards" }
      );
      fanActiveAnimations.push(greyAnim, neonAnim);

      Promise.all([greyAnim.finished, neonAnim.finished]).then(() => {
        if (!fanStartupDone && !fanDecelerating) {
          greyUse.style.opacity = "0";
          neonUse.style.opacity = "1";
          try { greyAnim.cancel(); } catch { }
          try { neonAnim.cancel(); } catch { }
          const gIdx = fanActiveAnimations.indexOf(greyAnim);
          if (gIdx !== -1) fanActiveAnimations.splice(gIdx, 1);
          const nIdx = fanActiveAnimations.indexOf(neonAnim);
          if (nIdx !== -1) fanActiveAnimations.splice(nIdx, 1);
        }
      }).catch(() => { });
    }, illuminationStart + i * illuminationStagger);
    fanStartupTimeouts.push(t);
  });

  const tHub = setTimeout(() => {
    if (fanStartupDone || fanDecelerating || !hubCore) return;
    const hubAnim = hubCore.animate(
      [
        { opacity: 0.4, filter: "none" },
        { opacity: 1, filter: "drop-shadow(0 0 2px #00f0ff)" }
      ],
      { duration: 360, easing: "ease-in-out", fill: "forwards" }
    );
    fanActiveAnimations.push(hubAnim);
  }, illuminationStart);
  fanStartupTimeouts.push(tHub);

  // Phase C - Accelerate rotation to maximum speed
  const accelStart = illuminationStart + 300;
  const accelDuration = 700;

  const tAccel = setTimeout(() => {
    if (fanStartupDone || fanDecelerating) return;

    const accelAnim = fan.animate(
      [
        { transform: "rotate(0deg)" },
        { transform: "rotate(1080deg)" }
      ],
      {
        duration: accelDuration,
        easing: "cubic-bezier(0.4, 0, 1, 1)",
        fill: "forwards"
      }
    );
    fanActiveAnimations.push(accelAnim);

    accelAnim.finished.then(() => {
      if (fanStartupDone || fanDecelerating) return;

      try { accelAnim.cancel(); } catch { }
      const aIdx = fanActiveAnimations.indexOf(accelAnim);
      if (aIdx !== -1) fanActiveAnimations.splice(aIdx, 1);

      fanHighSpeedAnimation = fan.animate(
        [
          { transform: "rotate(0deg)" },
          { transform: "rotate(360deg)" }
        ],
        {
          duration: 180,
          iterations: Infinity,
          easing: "linear"
        }
      );
      fanHighSpeedStartTime = performance.now();

      if (fanReadyForDecelResolve) {
        fanReadyForDecelResolve();
      }
    }).catch(() => { });
  }, accelStart);
  fanStartupTimeouts.push(tAccel);
}

async function decelerateCursorFan() {
  if (fanDecelerationPromise) return fanDecelerationPromise;

  fanDecelerationPromise = (async () => {
    const cursor = elements.gwCursor || document.querySelector("#gw-cursor");
    const fan = document.querySelector(".gw-cursor-fan");
    const isDesktopPointer = isFinePointerDevice();

    fanTransitionRequested = true;

    await Promise.race([
      fanReadyForDecelPromise,
      new Promise((r) => setTimeout(r, 4000))
    ]);

    if (fanStartupDone) {
      document.documentElement.classList.remove("gw-booting");
      isBooting = false;
      return;
    }

    if (fanHighSpeedStartTime > 0) {
      const elapsed = performance.now() - fanHighSpeedStartTime;
      const minCruisingTime = 200;
      if (elapsed < minCruisingTime) {
        await new Promise((r) => setTimeout(r, minCruisingTime - elapsed));
      }
    }

    if (!fan || !cursor) {
      cancelCursorFanStartup();
      document.documentElement.classList.remove("gw-booting");
      isBooting = false;
      return;
    }

    fanDecelerating = true;
    fanStartupTimeouts.forEach((t) => clearTimeout(t));
    fanStartupTimeouts = [];

    const decelDuration = 750;

    let currentAngle = 0;
    if (fanHighSpeedAnimation && typeof fanHighSpeedAnimation.currentTime === "number") {
      currentAngle = ((fanHighSpeedAnimation.currentTime % 180) / 180) * 360;
    } else {
      currentAngle = getElementRotation(fan);
    }
    if (fanHighSpeedAnimation) {
      try {
        fanHighSpeedAnimation.cancel();
      } catch { }
      fanHighSpeedAnimation = null;
    }

    // High speed: 2000 deg/s. Final idle speed: 138.46 deg/s. Average: 1069.23 deg/s.
    // Over 0.75s, distance = 1069.23 * 0.75 = 801.9 deg.
    const deltaAngle = 802;
    const targetAngle = currentAngle + deltaAngle;
    const finalAngle = (targetAngle % 360 + 360) % 360;

    // Easing with non-zero exit slope matching idle speed (0.13)
    const decelAnim = fan.animate(
      [
        { transform: `rotate(${currentAngle}deg)` },
        { transform: `rotate(${targetAngle}deg)` }
      ],
      {
        duration: decelDuration,
        easing: "cubic-bezier(0.2, 0.75, 0.5, 0.935)",
        fill: "forwards"
      }
    );

    let cursorAnim = null;
    let targetX = null;
    let targetY = null;
    const hasKnownPointer = (lastPointerX !== null && lastPointerY !== null);
    const shouldEnableCustomCursor = Boolean(animationsEnabled && isDesktopPointer);

    const currentRect = cursor.getBoundingClientRect();
    const startX = currentRect.left + currentRect.width / 2;
    const startY = currentRect.top + currentRect.height / 2;

    if (shouldEnableCustomCursor) {
      targetX = hasKnownPointer ? lastPointerX : startX;
      targetY = hasKnownPointer ? lastPointerY : startY;

      const currentWidth = currentRect.width || 200;
      const scaleRatio = 44 / currentWidth;

      cursorAnim = cursor.animate(
        [
          { transform: `translate3d(${startX}px, ${startY}px, 0) scale(1)` },
          { transform: `translate3d(${targetX}px, ${targetY}px, 0) scale(${scaleRatio})` }
        ],
        {
          duration: decelDuration,
          easing: "cubic-bezier(0.2, 0.8, 0.4, 1)",
          fill: "forwards"
        }
      );

      if (elements.loadingScreen) {
        elements.loadingScreen.classList.add("is-fading");
      }
    } else {
      if (elements.loadingScreen) {
        elements.loadingScreen.classList.add("is-fading");
      }
      cursorAnim = cursor.animate(
        [
          { opacity: 1 },
          { opacity: 0 }
        ],
        {
          duration: decelDuration,
          easing: "ease-out",
          fill: "forwards"
        }
      );
    }

    try {
      const promises = [decelAnim.finished];
      if (cursorAnim) promises.push(cursorAnim.finished);
      await Promise.all(promises);
    } catch { }

    // Establish final visual states BEFORE removing boot-state class
    fan.style.setProperty("--gw-fan-start-angle", `${finalAngle.toFixed(2)}deg`);

    if (shouldEnableCustomCursor) {
      cursor.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      cursor.style.display = "";
      cursor.style.opacity = "";
      cursor.classList.remove("is-loading");
      document.documentElement.classList.remove("gw-booting");
      isBooting = false;
      fanStartupDone = true;

      try { cursorAnim?.cancel(); } catch { }
      try { decelAnim.cancel(); } catch { }
      fan.style.transform = "";

      if (hasKnownPointer) {
        cursor.classList.add("is-active");
        if (!isPointerOverIframe) {
          document.documentElement.classList.add("has-custom-cursor");
        }
        customCursorActive = true;
        const interactiveSelector = `
          a, button, input, select, textarea, label,
          [role="button"], [role="link"], [role="tab"],
          .game-card, .poster-link, .review-button, .view-game,
          .filter-chip, .filter-chip-btn, .page-nav-btn,
          .review-modal-close, .review-modal-share, .review-modal-close-btn,
          .anim-toggle-btn, .help-btn, .toolbar-btn
        `;
        try {
          const hovered = document.elementFromPoint(targetX, targetY);
          if (hovered && hovered.closest && hovered.closest(interactiveSelector)) {
            cursor.classList.add("is-hover");
          } else {
            cursor.classList.remove("is-hover");
          }
        } catch { }
      } else {
        cursor.classList.remove("is-active");
        document.documentElement.classList.remove("has-custom-cursor");
        customCursorActive = true;
      }
    } else {
      document.documentElement.classList.remove("gw-booting", "has-custom-cursor");
      cursor.classList.remove("is-loading", "is-active", "is-hover", "is-danger-hover");
      cursor.style.display = "none";
      cursor.style.opacity = "0";
      isBooting = false;
      fanStartupDone = true;
      customCursorActive = false;

      try { cursorAnim?.cancel(); } catch { }
      try { decelAnim.cancel(); } catch { }
      fan.style.transform = "";
    }

    fanActiveAnimations.forEach((a) => {
      try { a.cancel(); } catch { }
    });
    fanActiveAnimations = [];

    const deploys = fan.querySelectorAll(".gw-blade-deploy");
    deploys.forEach((d) => (d.style.transform = ""));
    const greys = fan.querySelectorAll(".gw-blade-grey");
    greys.forEach((g) => (g.style.opacity = ""));
    const neons = fan.querySelectorAll(".gw-blade-neon");
    neons.forEach((n) => (n.style.opacity = ""));
    const hubCore = document.querySelector(".gw-cursor-hub-core");
    if (hubCore) {
      hubCore.style.opacity = "";
      hubCore.style.filter = "";
    }

    if (elements.loadingScreen) {
      elements.loadingScreen.classList.remove("is-fading");
      elements.loadingScreen.classList.add("is-hidden");
    }
    document.documentElement.classList.remove("background-entering");
    document.documentElement.classList.add("background-ready");
    window.__resumeCanvasAnimations?.();
    window.__updateCursorProgress?.();
  })();

  return fanDecelerationPromise;
}

function initCustomCursor() {
  if (cursorInitialized) return;
  cursorInitialized = true;

  const cursor = elements.gwCursor || document.querySelector("#gw-cursor");
  const progressFill = elements.gwCursorProgressFill || document.querySelector("#gw-cursor-progress-fill");
  if (!cursor || !progressFill) return;

  const pathLength = 307.88;
  progressFill.style.strokeDasharray = `${pathLength} ${pathLength}`;
  progressFill.style.strokeDashoffset = `${pathLength}`;

  let lastProgressOffset = pathLength;
  const updateScrollProgress = () => {
    if (!customCursorActive || isBooting) return;
    const scroll = window.scrollY || window.pageYOffset || 0;
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );
    const winHeight = window.innerHeight || 1;
    const maxScroll = docHeight - winHeight;
    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scroll / maxScroll)) : 0;
    const newOffset = (pathLength * (1 - progress)).toFixed(2);
    if (newOffset !== lastProgressOffset) {
      lastProgressOffset = newOffset;
      progressFill.style.strokeDashoffset = newOffset;
    }
  };

  window.__updateCursorProgress = updateScrollProgress;
  updateScrollProgress();

  let scrollTicking = false;
  const onScroll = () => {
    if (!customCursorActive || isBooting) return;
    if (!scrollTicking) {
      window.requestAnimationFrame(() => {
        updateScrollProgress();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;

    if (e.target && e.target.tagName === "IFRAME") {
      deactivateCursorForIframe();
      return;
    }

    if (isPointerOverIframe) {
      activateCursorFromIframe(e);
    }

    lastPointerX = e.clientX;
    lastPointerY = e.clientY;

    if (isBooting) return;

    if (!customCursorActive) return;

    cursor.style.display = "";
    cursor.style.opacity = "";
    cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    if (!cursor.classList.contains("is-active")) {
      cursor.classList.add("is-active");
    }
    if (!document.documentElement.classList.contains("has-custom-cursor")) {
      document.documentElement.classList.add("has-custom-cursor");
    }
  }, { passive: true });

  window.addEventListener("pointerleave", () => {
    if (isBooting || !customCursorActive) return;
    cursor.classList.remove("is-active");
  }, { passive: true });

  window.addEventListener("pointerenter", (e) => {
    if (e.pointerType === "touch") return;
    if (e.target && e.target.tagName === "IFRAME") {
      deactivateCursorForIframe();
      return;
    }
    if (isPointerOverIframe) {
      activateCursorFromIframe(e);
    }
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;

    if (isBooting || !customCursorActive) return;

    cursor.style.display = "";
    cursor.style.opacity = "";
    cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    cursor.classList.add("is-active");
    if (!document.documentElement.classList.contains("has-custom-cursor")) {
      document.documentElement.classList.add("has-custom-cursor");
    }
  }, { passive: true });

  window.addEventListener("blur", () => {
    if (!customCursorActive) return;
    cursor.classList.remove("is-active");
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && customCursorActive) {
      cursor.classList.remove("is-active");
    }
  });

  const interactiveSelector = `
    a, button, input, select, textarea, label,
    [role="button"], [role="link"], [role="tab"],
    .game-card, .poster-link, .review-button, .view-game,
    .filter-chip, .filter-chip-btn, .page-nav-btn,
    .review-modal-close, .review-modal-share, .review-modal-close-btn,
    .anim-toggle-btn, .help-btn, .search-clear-btn
  `;
  const dangerSelector = "#reset-filters-btn, .search-clear-btn, #search-clear-btn, #spoiler-btn-ok, .spoiler-btn-ok";

  document.addEventListener("pointerover", (e) => {
    if (e.pointerType === "touch") return;
    if (e.target && e.target.tagName === "IFRAME") {
      deactivateCursorForIframe();
      return;
    }
    if (isBooting || !customCursorActive || isPointerOverIframe) return;
    if (e.target && e.target.closest) {
      if (e.target.closest(dangerSelector)) {
        cursor.classList.add("is-danger-hover", "is-hover");
      } else if (e.target.closest(interactiveSelector)) {
        cursor.classList.remove("is-danger-hover");
        cursor.classList.add("is-hover");
      }
    }
  }, { passive: true });

  document.addEventListener("pointerenter", (e) => {
    if (e.pointerType === "touch") return;
    if (e.target && e.target.tagName === "IFRAME") {
      deactivateCursorForIframe();
    }
  }, true);

  document.addEventListener("pointerout", (e) => {
    if (e.pointerType === "touch") return;
    if (e.target && e.target.tagName === "IFRAME") {
      if (e.relatedTarget && document.documentElement.contains(e.relatedTarget)) {
        activateCursorFromIframe(e);
      }
      return;
    }
    if (isBooting || !customCursorActive || isPointerOverIframe) return;
    if (e.target && e.target.closest) {
      const dangerEl = e.target.closest(dangerSelector);
      const interactiveEl = e.target.closest(interactiveSelector);
      const nextDanger = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(dangerSelector);
      const nextInteractive = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(interactiveSelector);

      if (dangerEl && !nextDanger) {
        cursor.classList.remove("is-danger-hover");
      }
      if (interactiveEl && !nextInteractive) {
        cursor.classList.remove("is-hover");
      }
    }
  }, { passive: true });

  document.addEventListener("pointerleave", (e) => {
    if (e.pointerType === "touch") return;
    if (e.target && e.target.tagName === "IFRAME") {
      if (e.relatedTarget && document.documentElement.contains(e.relatedTarget)) {
        activateCursorFromIframe(e);
      }
    }
  }, true);

  if (window.matchMedia) {
    try {
      window.matchMedia("(pointer: fine)").addEventListener("change", () => {
        setCustomCursorEnabled(animationsEnabled);
      });
      window.matchMedia("(hover: hover)").addEventListener("change", () => {
        setCustomCursorEnabled(animationsEnabled);
      });
    } catch { }
  }

  setCustomCursorEnabled(animationsEnabled);
  initCursorFanStartup();
}

function setAnimationsEnabled(enabled, persist = true) {
  animationsEnabled = enabled;
  if (persist) {
    try {
      localStorage.setItem(ANIMATION_STORAGE_KEY, enabled ? "on" : "off");
    } catch { }
  }

  const btn = elements.animToggleBtn || document.querySelector("#anim-toggle-btn");
  const textSpan = btn?.querySelector(".anim-toggle-text");
  if (btn) {
    btn.setAttribute("aria-pressed", String(enabled));
  }
  if (textSpan) {
    textSpan.textContent = enabled ? "ANIMATIONS: ON" : "ANIMATIONS: OFF";
  }

  if (enabled) {
    document.documentElement.classList.remove("no-animations");
    document.documentElement.classList.add("animations-unlocked");
    window.__updateCanvasAnimations?.(true);
  } else {
    document.documentElement.classList.add("no-animations");
    document.documentElement.classList.remove("animations-unlocked");
    window.__updateCanvasAnimations?.(false);
  }

  setCustomCursorEnabled(enabled);
  syncGlitchBadgesAnimationState();
}

function initAnimationToggle() {
  const btn = elements.animToggleBtn || document.querySelector("#anim-toggle-btn");
  if (!btn) return;

  btn.setAttribute("aria-pressed", String(animationsEnabled));
  const textSpan = btn.querySelector(".anim-toggle-text");
  if (textSpan) {
    textSpan.textContent = animationsEnabled ? "ANIMATIONS: ON" : "ANIMATIONS: OFF";
  }

  btn.addEventListener("click", () => {
    setAnimationsEnabled(!animationsEnabled, true);
  });

  if (window.matchMedia) {
    try {
      window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => {
        try {
          if (localStorage.getItem(ANIMATION_STORAGE_KEY) !== null) return;
        } catch { }
        setAnimationsEnabled(!e.matches, false);
      });
    } catch { }
  }
}


/* ==========================================================================
   Interactive Website Tutorial Tour
   ========================================================================== */
const tutorialSteps = [
  {
    target: ".title-lockup",
    title: "WELCOME TO GAMEWALL",
    desc: "Welcome to Parijat's personal game collection. Here you can explore the games I've played, check my ratings and progress, and read my reviews."
  },
  {
    target: ".stats",
    title: "COLLECTION OVERVIEW",
    desc: "An overview of the archive: total games cataloged, my average personal score, when the collection was last updated, and my highest-rated game."
  },
  {
    target: ".system-status",
    fallbackTarget: "#access-counter",
    title: "ARCHIVE ACCESS COUNTER",
    desc: "Shows the archive's access count, giving you an idea of how often the collection is visited."
  },
  {
    target: "#anim-toggle-btn",
    title: "VISUAL EFFECTS TOGGLE",
    desc: "Turn background effects and custom cursor animations on or off depending on your preference or device performance."
  },
  {
    target: "#game-search",
    title: "INSTANT SEARCH",
    desc: "Type any keyword to instantly filter the collection as you type. Use the clear button to reset your search."
  },
  {
    target: "#search-mode",
    title: "SEARCH SCOPES",
    desc: "Target your search by specific fields: game title, personal gameplay notes, written reviews, platform, or poster badges."
  },
  {
    target: "#filter-toggle-btn",
    title: "ADVANCED FILTERS",
    desc: "Narrow down games by platform (PC, Mobile, Console), completion status, review availability, personal rating range, or 100% completion."
  },
  {
    target: "#sort-games",
    title: "COLLECTION SORTING",
    desc: "Sort the collection by my personal rating, alphabetically by title, or by original data entry order."
  },
  {
    target: "#reset-filters-btn",
    title: "RESET FILTERS",
    desc: "Resets all active filters and sort options back to their defaults while keeping your current search query intact."
  },
  {
    target: ".poster-frame",
    fallbackTarget: ".library",
    title: "POSTER STATUS BADGES",
    desc: "Posters show quick status badges: green for completed games, red for dropped titles with my percentage reached, or custom labels like total playtime."
  },
  {
    target: ".poster-meta",
    fallbackTarget: ".library",
    title: "RATINGS & PLATFORMS",
    desc: "Check my personal rating out of 10 along with platform icons showing where I played each game."
  },
  {
    target: ".gameplay-row",
    fallbackTarget: ".library",
    title: "GAMEPLAY STATUS",
    desc: "My personal status note for each game, detailing my current playthrough progress or playstyle."
  },
  {
    target: ".card-actions",
    fallbackTarget: ".library",
    title: "OFFICIAL LINKS & REVIEWS",
    desc: "Click the poster or 'VIEW GAME' to open the game's official website. Click 'REVIEW' to read my thoughts, screenshots, and copy a direct link."
  },
  {
    target: "#page-nav-btn",
    title: "QUICK PAGE NAVIGATION",
    desc: "Use this button to quickly jump between the top and bottom of the collection."
  }
];

let tutorialCurrentStep = 0;
let isTutorialOpen = false;

function initTutorial() {
  const tutorialBtn = elements.tutorialBtn || document.querySelector("#tutorial-btn");
  const overlay = elements.tutorialOverlay || document.querySelector("#tutorial-overlay");
  const closeBtn = elements.tutorialCloseBtn || document.querySelector("#tutorial-close-btn");
  const prevBtn = elements.tutorialBtnPrev || document.querySelector("#tutorial-btn-prev");
  const nextBtn = elements.tutorialBtnNext || document.querySelector("#tutorial-btn-next");
  const dotsContainer = elements.tutorialDots || document.querySelector("#tutorial-dots");

  if (!tutorialBtn || !overlay) return;

  let currentTourScrollRaf = null;
  let currentTourTimer = null;

  function cancelTourAsync() {
    if (currentTourScrollRaf) {
      cancelAnimationFrame(currentTourScrollRaf);
      currentTourScrollRaf = null;
    }
    if (currentTourTimer) {
      clearTimeout(currentTourTimer);
      currentTourTimer = null;
    }
  }

  function renderDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = "";
    tutorialSteps.forEach((_, idx) => {
      const dot = document.createElement("span");
      dot.className = `tutorial-dot ${idx === tutorialCurrentStep ? "is-active" : ""}`;
      dot.setAttribute("role", "button");
      dot.setAttribute("aria-label", `Go to step ${idx + 1}`);
      dot.tabIndex = 0;
      dot.addEventListener("click", () => {
        positionTourStep(idx);
      });
      dot.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          positionTourStep(idx);
        }
      });
      dotsContainer.appendChild(dot);
    });
  }

  function updateSpotlightAndDialog(targetEl, stepIndex) {
    if (!isTutorialOpen) return;

    const step = tutorialSteps[stepIndex];
    if (!step) return;

    const cutout = elements.tutorialSpotlightCutout || document.querySelector("#tutorial-spotlight-cutout");
    const box = elements.tutorialSpotlightBox || document.querySelector("#tutorial-spotlight-box");
    const dialog = elements.tutorialDialog || document.querySelector("#tutorial-dialog");
    const badge = elements.tutorialStepBadge || document.querySelector("#tutorial-step-badge");
    const title = elements.tutorialStepTitle || document.querySelector("#tutorial-step-title");
    const desc = elements.tutorialStepDesc || document.querySelector("#tutorial-step-desc");
    const liveRegion = elements.tutorialLiveRegion || document.querySelector("#tutorial-live-region");

    if (badge) badge.textContent = `STEP ${String(stepIndex + 1).padStart(2, "0")} // ${String(tutorialSteps.length).padStart(2, "0")}`;
    if (title) title.textContent = step.title;
    if (desc) desc.textContent = step.desc;
    if (liveRegion) liveRegion.textContent = `${step.title}: ${step.desc}`;

    renderDots();

    if (prevBtn) {
      prevBtn.disabled = stepIndex === 0;
    }
    if (nextBtn) {
      nextBtn.textContent = stepIndex === tutorialSteps.length - 1 ? "FINISH" : "NEXT";
    }

    const rect = targetEl ? targetEl.getBoundingClientRect() : null;
    const pad = 6;

    if (rect && rect.width > 0 && rect.height > 0) {
      const top = Math.max(0, rect.top - pad);
      const left = Math.max(0, rect.left - pad);
      const width = rect.width + pad * 2;
      const height = rect.height + pad * 2;

      if (cutout) {
        cutout.setAttribute("x", String(left));
        cutout.setAttribute("y", String(top));
        cutout.setAttribute("width", String(width));
        cutout.setAttribute("height", String(height));
      }
      if (box) {
        box.style.display = "block";
        box.style.top = `${top}px`;
        box.style.left = `${left}px`;
        box.style.width = `${width}px`;
        box.style.height = `${height}px`;
      }

      if (dialog) {
        const dialogWidth = Math.min(390, window.innerWidth - 32);
        const dialogHeight = dialog.offsetHeight || 220;

        let dialogLeft = left + (width / 2) - (dialogWidth / 2);
        dialogLeft = Math.max(16, Math.min(window.innerWidth - dialogWidth - 16, dialogLeft));

        const spaceBelow = window.innerHeight - (top + height);
        const spaceAbove = top;
        let dialogTop;

        if (spaceBelow >= dialogHeight + 20) {
          dialogTop = top + height + 16;
        } else if (spaceAbove >= dialogHeight + 20) {
          dialogTop = top - dialogHeight - 16;
        } else {
          dialogTop = Math.max(16, Math.min(window.innerHeight - dialogHeight - 16, 16));
        }

        dialog.style.left = `${dialogLeft}px`;
        dialog.style.top = `${dialogTop}px`;
      }
    } else {
      if (cutout) {
        cutout.setAttribute("x", "0");
        cutout.setAttribute("y", "0");
        cutout.setAttribute("width", "0");
        cutout.setAttribute("height", "0");
      }
      if (box) box.style.display = "none";
      if (dialog) {
        dialog.style.left = `${Math.max(16, (window.innerWidth - Math.min(390, window.innerWidth - 32)) / 2)}px`;
        dialog.style.top = `${Math.max(16, (window.innerHeight - 220) / 2)}px`;
      }
    }
  }

  function positionTourStep(stepIndex) {
    const step = tutorialSteps[stepIndex];
    if (!step) return;

    cancelTourAsync();
    tutorialCurrentStep = stepIndex;

    let targetEl = document.querySelector(step.target);
    if (!targetEl && step.fallbackTarget) {
      targetEl = document.querySelector(step.fallbackTarget);
    }

    const wasNavBtnHidden = step.target === "#page-nav-btn" && elements.pageNavBtn?.hasAttribute("hidden");
    if (wasNavBtnHidden && elements.pageNavBtn) {
      elements.pageNavBtn.removeAttribute("hidden");
    }

    if (!targetEl) {
      updateSpotlightAndDialog(null, stepIndex);
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    const safetyPad = 60;
    const isFullyVisible = (
      rect.top >= safetyPad &&
      rect.bottom <= window.innerHeight - safetyPad
    );

    if (isFullyVisible) {
      updateSpotlightAndDialog(targetEl, stepIndex);
      return;
    }

    const targetY = window.scrollY + rect.top - (window.innerHeight / 2) + (rect.height / 2);
    const clampedY = Math.max(0, Math.min(document.documentElement.scrollHeight - window.innerHeight, targetY));

    const box = elements.tutorialSpotlightBox || document.querySelector("#tutorial-spotlight-box");
    if (box) box.style.display = "none";

    window.scrollTo({
      top: clampedY,
      behavior: "smooth"
    });

    let lastScrollY = window.scrollY;
    let stableFrames = 0;
    let maxFrames = 60;
    let frames = 0;

    function checkScrollSettled() {
      if (!isTutorialOpen) return;
      const currentScrollY = window.scrollY;
      if (Math.abs(currentScrollY - lastScrollY) < 1) {
        stableFrames++;
      } else {
        stableFrames = 0;
        lastScrollY = currentScrollY;
      }

      frames++;
      if (stableFrames >= 3 || frames >= maxFrames) {
        currentTourScrollRaf = null;
        updateSpotlightAndDialog(targetEl, stepIndex);
      } else {
        currentTourScrollRaf = requestAnimationFrame(checkScrollSettled);
      }
    }

    currentTourScrollRaf = requestAnimationFrame(checkScrollSettled);
  }

  function preventManualScroll(e) {
    if (!isTutorialOpen) return;
    const dialog = elements.tutorialDialog || document.querySelector("#tutorial-dialog");
    if (dialog && dialog.contains(e.target) && dialog.scrollHeight > dialog.clientHeight) {
      return;
    }
    e.preventDefault();
  }

  function onTourKeyDown(e) {
    if (!isTutorialOpen) return;

    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      closeTour();
      return;
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (tutorialCurrentStep < tutorialSteps.length - 1) {
        positionTourStep(tutorialCurrentStep + 1);
      } else {
        closeTour();
      }
      return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (tutorialCurrentStep > 0) {
        positionTourStep(tutorialCurrentStep - 1);
      }
      return;
    }

    if (e.key === "Enter") {
      const active = document.activeElement;
      if (active === closeBtn) {
        e.preventDefault();
        closeTour();
        return;
      }
      if (active === prevBtn) {
        e.preventDefault();
        if (tutorialCurrentStep > 0) {
          positionTourStep(tutorialCurrentStep - 1);
        }
        return;
      }
      e.preventDefault();
      if (tutorialCurrentStep < tutorialSteps.length - 1) {
        positionTourStep(tutorialCurrentStep + 1);
      } else {
        closeTour();
      }
      return;
    }

    const scrollKeys = ["PageUp", "PageDown", "Home", "End", " ", "ArrowUp", "ArrowDown"];
    if (scrollKeys.includes(e.key)) {
      const dialog = elements.tutorialDialog || document.querySelector("#tutorial-dialog");
      if (dialog && dialog.contains(e.target) && dialog.scrollHeight > dialog.clientHeight) {
        return;
      }
      e.preventDefault();
    }
  }

  function preventMiddleClick(e) {
    if (!isTutorialOpen) return;
    if (e.button === 1 || e.which === 2) {
      e.preventDefault();
    }
  }

  function openTour() {
    isTutorialOpen = true;
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("tutorial-open");

    window.addEventListener("wheel", preventManualScroll, { passive: false });
    window.addEventListener("touchmove", preventManualScroll, { passive: false });
    window.addEventListener("mousedown", preventMiddleClick, true);
    window.addEventListener("auxclick", preventMiddleClick, true);
    document.addEventListener("keydown", onTourKeyDown, true);

    positionTourStep(0);
    const dialog = elements.tutorialDialog || document.querySelector("#tutorial-dialog");
    if (dialog) {
      dialog.focus();
    }
  }

  function closeTour() {
    if (!isTutorialOpen) return;
    isTutorialOpen = false;

    cancelTourAsync();

    window.removeEventListener("wheel", preventManualScroll, { passive: false });
    window.removeEventListener("touchmove", preventManualScroll, { passive: false });
    window.removeEventListener("mousedown", preventMiddleClick, true);
    window.removeEventListener("auxclick", preventMiddleClick, true);
    document.removeEventListener("keydown", onTourKeyDown, true);

    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("tutorial-open");

    window.__updatePageNav?.();
    if (elements.gwCursor) {
      elements.gwCursor.classList.remove("is-hover", "is-danger-hover");
    }

    if (tutorialBtn && typeof tutorialBtn.focus === "function") {
      tutorialBtn.focus();
    }
  }

  tutorialBtn.addEventListener("click", () => {
    openTour();
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      closeTour();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (tutorialCurrentStep > 0) {
        positionTourStep(tutorialCurrentStep - 1);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (tutorialCurrentStep < tutorialSteps.length - 1) {
        positionTourStep(tutorialCurrentStep + 1);
      } else {
        closeTour();
      }
    });
  }

  window.addEventListener("resize", () => {
    if (isTutorialOpen) {
      const step = tutorialSteps[tutorialCurrentStep];
      let targetEl = step ? document.querySelector(step.target) : null;
      if (!targetEl && step?.fallbackTarget) {
        targetEl = document.querySelector(step.fallbackTarget);
      }
      updateSpotlightAndDialog(targetEl, tutorialCurrentStep);
    }
  }, { passive: true });
}

startPerformanceSampling();
initTutorial();
initAnimationToggle();
initUrlState();
initBackgroundCanvas();
initReviewModalEvents();
initSpoilerWarningEvents();
hookHistoryNavigation();
loadAccessCounter();
initPageNavigation();
initCustomCursor();

loadGames();


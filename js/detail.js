const TAB_FIELDS = ["background", "theme", "artistNote", "significance", "highlights"];
const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_ZOOM = 2.5;
const DOUBLE_TAP_MS = 300;

let els = {};
let currentList = [];
let currentIndex = -1;
let activeTab = "background";
let onBack = () => {};

let zoom = { scale: 1, tx: 0, ty: 0 };
let pinch = null;
let pan = null;
let lastTapTime = 0;

export function initDetail(callbacks) {
  onBack = callbacks.onBack || onBack;

  els.wrap = document.getElementById("detail-image-wrap");
  els.img = document.getElementById("detail-image");
  els.title = document.getElementById("detail-title");
  els.titleOriginal = document.getElementById("detail-title-original");
  els.meta = document.getElementById("detail-meta");
  els.tabs = document.getElementById("detail-tabs");
  els.tabContent = document.getElementById("detail-tab-content");
  els.backBtn = document.getElementById("detail-back");
  els.prevBtn = document.getElementById("detail-prev");
  els.nextBtn = document.getElementById("detail-next");

  els.img.style.transformOrigin = "center center";

  els.backBtn.addEventListener("click", () => onBack());
  els.prevBtn.addEventListener("click", () => step(-1));
  els.nextBtn.addEventListener("click", () => step(1));

  els.tabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".detail-tab-btn");
    if (!btn) return;
    activeTab = btn.dataset.tab;
    renderTabs();
  });

  bindZoomEvents();
}

export function showDetail(list, index) {
  currentList = list;
  currentIndex = index;
  activeTab = "background";
  resetZoom();
  render();
}

function step(delta) {
  const nextIndex = currentIndex + delta;
  if (nextIndex < 0 || nextIndex >= currentList.length) return;
  currentIndex = nextIndex;
  activeTab = "background";
  resetZoom();
  render();
}

function render() {
  const p = currentList[currentIndex];
  if (!p) return;

  els.img.src = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(p.imageFile)}?width=1200`;
  els.img.alt = p.titleJa;
  els.title.textContent = p.titleJa;
  els.titleOriginal.textContent = p.titleOriginal;
  els.meta.textContent = `${p.artistJa}(${p.artistLife}) / ${p.year} / ${p.movement} / ${p.technique} / ${p.size} / ${p.museum}`;

  els.prevBtn.disabled = currentIndex <= 0;
  els.nextBtn.disabled = currentIndex >= currentList.length - 1;
  els.prevBtn.style.opacity = els.prevBtn.disabled ? 0.3 : 1;
  els.nextBtn.style.opacity = els.nextBtn.disabled ? 0.3 : 1;

  renderTabs();
}

function renderTabs() {
  const p = currentList[currentIndex];
  if (!p) return;

  for (const btn of els.tabs.querySelectorAll(".detail-tab-btn")) {
    btn.classList.toggle("is-active", btn.dataset.tab === activeTab);
  }
  const text = p[activeTab] || "";
  els.tabContent.textContent = text;
}

/* ===== ピンチズーム / ダブルタップ ===== */

function bindZoomEvents() {
  els.wrap.addEventListener("touchstart", onTouchStart, { passive: false });
  els.wrap.addEventListener("touchmove", onTouchMove, { passive: false });
  els.wrap.addEventListener("touchend", onTouchEnd);
  els.wrap.addEventListener("touchcancel", onTouchEnd);
  els.wrap.addEventListener("dblclick", (e) => {
    toggleZoomAt(e.offsetX, e.offsetY);
  });
}

function resetZoom() {
  zoom = { scale: 1, tx: 0, ty: 0 };
  pinch = null;
  pan = null;
  applyTransform();
}

function applyTransform() {
  clampPan();
  els.img.style.transform = `scale(${zoom.scale}) translate(${zoom.tx}px, ${zoom.ty}px)`;
}

function clampPan() {
  if (zoom.scale <= MIN_SCALE) {
    zoom.tx = 0;
    zoom.ty = 0;
    return;
  }
  const rect = els.wrap.getBoundingClientRect();
  const maxX = (rect.width * (zoom.scale - 1)) / (2 * zoom.scale);
  const maxY = (rect.height * (zoom.scale - 1)) / (2 * zoom.scale);
  zoom.tx = Math.max(-maxX, Math.min(maxX, zoom.tx));
  zoom.ty = Math.max(-maxY, Math.min(maxY, zoom.ty));
}

function distance(t1, t2) {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function onTouchStart(e) {
  if (e.touches.length === 2) {
    e.preventDefault();
    pan = null;
    pinch = {
      startDist: distance(e.touches[0], e.touches[1]),
      startScale: zoom.scale,
    };
  } else if (e.touches.length === 1) {
    const now = Date.now();
    if (now - lastTapTime < DOUBLE_TAP_MS) {
      const rect = els.wrap.getBoundingClientRect();
      toggleZoomAt(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
      lastTapTime = 0;
      pan = null;
      return;
    }
    lastTapTime = now;

    if (zoom.scale > MIN_SCALE) {
      pan = { lastX: e.touches[0].clientX, lastY: e.touches[0].clientY };
    }
  }
}

function onTouchMove(e) {
  if (e.touches.length === 2 && pinch) {
    e.preventDefault();
    const dist = distance(e.touches[0], e.touches[1]);
    const ratio = dist / pinch.startDist;
    zoom.scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, pinch.startScale * ratio));
    applyTransform();
  } else if (e.touches.length === 1 && pan) {
    e.preventDefault();
    const dx = (e.touches[0].clientX - pan.lastX) / zoom.scale;
    const dy = (e.touches[0].clientY - pan.lastY) / zoom.scale;
    zoom.tx += dx;
    zoom.ty += dy;
    pan.lastX = e.touches[0].clientX;
    pan.lastY = e.touches[0].clientY;
    applyTransform();
  }
}

function onTouchEnd(e) {
  if (e.touches.length < 2) pinch = null;
  if (e.touches.length < 1) pan = null;
  if (zoom.scale <= MIN_SCALE + 0.02) resetZoom();
}

function toggleZoomAt() {
  if (zoom.scale > MIN_SCALE) {
    resetZoom();
  } else {
    zoom.scale = DOUBLE_TAP_ZOOM;
    zoom.tx = 0;
    zoom.ty = 0;
    applyTransform();
  }
}

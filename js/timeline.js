import { loadMovements, paintingsInChronologicalOrder, paintingThumbUrl } from "./data.js";
import { getTimelineProgress, saveTimelineProgress, clearTimelineProgress } from "./storage.js";
import { escapeHtml } from "./gallery.js";

let sequence = [];
let paintingList = [];
let currentPos = 0;
let onOpenDetail = () => {};
let els = {};

export async function initTimeline(callbacks) {
  onOpenDetail = callbacks.onOpenDetail || onOpenDetail;

  els.intro = document.getElementById("timeline-intro");
  els.startBtn = document.getElementById("timeline-start");
  els.resumeBtn = document.getElementById("timeline-resume");
  els.player = document.getElementById("timeline-player");
  els.progressBar = document.getElementById("timeline-progress-bar");
  els.card = document.getElementById("timeline-card");
  els.prevBtn = document.getElementById("timeline-prev");
  els.nextBtn = document.getElementById("timeline-next");
  els.position = document.getElementById("timeline-position");

  const [movements, paintings] = await Promise.all([loadMovements(), paintingsInChronologicalOrder()]);
  buildSequence(movements, paintings);

  const saved = getTimelineProgress();
  els.resumeBtn.hidden = !saved || saved.index >= sequence.length;

  els.startBtn.addEventListener("click", () => {
    clearTimelineProgress();
    startPlayer(0);
  });
  els.resumeBtn.addEventListener("click", () => {
    const progress = getTimelineProgress();
    startPlayer(progress ? progress.index : 0);
  });
  els.prevBtn.addEventListener("click", () => move(-1));
  els.nextBtn.addEventListener("click", () => move(1));
}

function buildSequence(movements, paintings) {
  sequence = [];
  paintingList = paintings;
  let lastMovement = null;
  paintings.forEach((p, idx) => {
    if (p.movement !== lastMovement) {
      const movement = movements.find((m) => m.nameJa === p.movement);
      if (movement) sequence.push({ type: "movement", movement });
      lastMovement = p.movement;
    }
    sequence.push({ type: "painting", painting: p, paintingIndex: idx });
  });
}

function startPlayer(index) {
  els.intro.hidden = true;
  els.player.hidden = false;
  currentPos = Math.min(index, sequence.length - 1);
  render();
}

function move(delta) {
  const next = currentPos + delta;
  if (next < 0 || next >= sequence.length) return;
  currentPos = next;
  render();
}

function render() {
  const item = sequence[currentPos];
  saveTimelineProgress(currentPos);

  els.progressBar.style.width = `${Math.round(((currentPos + 1) / sequence.length) * 100)}%`;
  els.position.textContent = `${currentPos + 1} / ${sequence.length}`;
  els.prevBtn.disabled = currentPos <= 0;
  els.nextBtn.disabled = currentPos >= sequence.length - 1;
  els.nextBtn.textContent = currentPos >= sequence.length - 1 ? "学習完了" : "次へ ›";

  els.card.innerHTML = "";
  if (item.type === "movement") {
    els.card.appendChild(buildMovementCard(item.movement));
  } else {
    els.card.appendChild(buildPaintingCard(item.painting));
  }
}

function buildMovementCard(m) {
  const div = document.createElement("div");
  div.className = "movement-card";
  div.innerHTML = `
    <h3>${escapeHtml(m.nameJa)}</h3>
    <p class="detail-title-original">${escapeHtml(m.nameOriginal)} / ${escapeHtml(m.period)}</p>
    <p>${escapeHtml(m.description)}</p>
  `;
  return div;
}

function buildPaintingCard(p) {
  const div = document.createElement("button");
  div.className = "painting-card";
  div.style.width = "100%";
  div.innerHTML = `
    <div class="painting-card-image-wrap" style="aspect-ratio: 4/3;">
      <img src="${paintingThumbUrl(p)}" alt="${escapeHtml(p.titleJa)}" loading="lazy">
    </div>
    <div class="painting-card-body">
      <p class="painting-card-title" style="font-size:16px;">${escapeHtml(p.titleJa)}</p>
      <p class="painting-card-artist">${escapeHtml(p.artistJa)} / ${escapeHtml(p.year)}</p>
      <span class="painting-card-badge">${escapeHtml(p.movement)}</span>
    </div>
  `;
  div.addEventListener("click", () => {
    const idx = paintingList.findIndex((x) => x.id === p.id);
    onOpenDetail(paintingList, idx);
  });
  return div;
}

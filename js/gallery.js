import { loadPaintings, loadMovements, paintingThumbUrl, parseYear } from "./data.js";

let allPaintings = [];
let movementOrder = [];

const els = {};

export async function initGallery(onOpenDetail) {
  els.grid = document.getElementById("gallery-grid");
  els.search = document.getElementById("search-input");
  els.movementFilter = document.getElementById("filter-movement");
  els.genreFilter = document.getElementById("filter-genre");
  els.sortSelect = document.getElementById("sort-select");
  els.resultCount = document.getElementById("result-count");

  const [paintings, movements] = await Promise.all([loadPaintings(), loadMovements()]);
  allPaintings = paintings;
  movementOrder = movements.map((m) => m.nameJa);

  populateSelect(els.movementFilter, movementOrder);
  const genres = [...new Set(paintings.map((p) => p.genre))].sort();
  populateSelect(els.genreFilter, genres);

  els.search.addEventListener("input", render);
  els.movementFilter.addEventListener("change", render);
  els.genreFilter.addEventListener("change", render);
  els.sortSelect.addEventListener("change", render);

  els.grid.addEventListener("click", (e) => {
    const card = e.target.closest(".painting-card");
    if (!card) return;
    const id = card.dataset.id;
    const list = getFilteredSorted();
    const index = list.findIndex((p) => p.id === id);
    onOpenDetail(list, index);
  });

  render();
}

function populateSelect(select, values) {
  for (const v of values) {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    select.appendChild(opt);
  }
}

function getFilteredSorted() {
  const query = els.search.value.trim().toLowerCase();
  const movement = els.movementFilter.value;
  const genre = els.genreFilter.value;
  const sortBy = els.sortSelect.value;

  let list = allPaintings.filter((p) => {
    if (movement && p.movement !== movement) return false;
    if (genre && p.genre !== genre) return false;
    if (query) {
      const haystack = `${p.titleJa} ${p.titleOriginal} ${p.artistJa} ${p.artistOriginal}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  if (sortBy === "chronological") {
    list.sort((a, b) => {
      const oa = movementOrder.indexOf(a.movement);
      const ob = movementOrder.indexOf(b.movement);
      if (oa !== ob) return oa - ob;
      return parseYear(a.year) - parseYear(b.year);
    });
  } else if (sortBy === "title") {
    list.sort((a, b) => a.titleJa.localeCompare(b.titleJa, "ja"));
  } else if (sortBy === "artist") {
    list.sort((a, b) => a.artistJa.localeCompare(b.artistJa, "ja"));
  }

  return list;
}

function render() {
  const list = getFilteredSorted();
  els.resultCount.textContent = `${list.length}件`;
  els.grid.innerHTML = "";

  if (list.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "該当する作品が見つかりませんでした";
    els.grid.appendChild(empty);
    return;
  }

  const frag = document.createDocumentFragment();
  for (const p of list) {
    frag.appendChild(buildCard(p));
  }
  els.grid.appendChild(frag);
}

function buildCard(p) {
  const card = document.createElement("button");
  card.className = "painting-card";
  card.dataset.id = p.id;

  const imgWrap = document.createElement("div");
  imgWrap.className = "painting-card-image-wrap";
  const img = document.createElement("img");
  img.loading = "lazy";
  img.src = paintingThumbUrl(p);
  img.alt = p.titleJa;
  imgWrap.appendChild(img);

  const body = document.createElement("div");
  body.className = "painting-card-body";
  body.innerHTML = `
    <p class="painting-card-title">${escapeHtml(p.titleJa)}</p>
    <p class="painting-card-artist">${escapeHtml(p.artistJa)}</p>
    <span class="painting-card-badge">${escapeHtml(p.movement)}</span>
  `;

  card.appendChild(imgWrap);
  card.appendChild(body);
  return card;
}

export function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

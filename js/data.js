let paintingsCache = null;
let movementsCache = null;

export async function loadPaintings() {
  if (paintingsCache) return paintingsCache;
  const res = await fetch("data/paintings.json");
  paintingsCache = await res.json();
  return paintingsCache;
}

export async function loadMovements() {
  if (movementsCache) return movementsCache;
  const res = await fetch("data/movements.json");
  movementsCache = await res.json();
  return movementsCache;
}

export function commonsImageUrl(imageFile, width = 1200) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageFile)}?width=${width}`;
}

export function paintingThumbUrl(painting) {
  return commonsImageUrl(painting.imageFile, 400);
}

export function paintingFullUrl(painting) {
  return commonsImageUrl(painting.imageFile, 1200);
}

// movements.jsonの並び順(=年代順)に従って作品をソートするための時代インデックス
export async function movementOrderMap() {
  const movements = await loadMovements();
  const map = {};
  movements.forEach((m, i) => { map[m.nameJa] = i; });
  return map;
}

export async function paintingsInChronologicalOrder() {
  const [paintings, orderMap] = await Promise.all([loadPaintings(), movementOrderMap()]);
  return [...paintings].sort((a, b) => {
    const oa = orderMap[a.movement] ?? 999;
    const ob = orderMap[b.movement] ?? 999;
    if (oa !== ob) return oa - ob;
    return parseYear(a.year) - parseYear(b.year);
  });
}

export function parseYear(yearStr) {
  const match = String(yearStr).match(/-?\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

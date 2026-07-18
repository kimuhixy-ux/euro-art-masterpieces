import { initGallery } from "./gallery.js";
import { initDetail, showDetail } from "./detail.js";
import { initTimeline } from "./timeline.js";
import { initQuiz } from "./quiz.js";

let returnView = "gallery";

function switchView(name) {
  for (const view of document.querySelectorAll(".view")) {
    view.classList.toggle("is-active", view.id === `view-${name}`);
  }
  for (const btn of document.querySelectorAll(".tab-btn")) {
    btn.classList.toggle("is-active", btn.dataset.view === name);
  }
}

function openDetail(from, list, index) {
  returnView = from;
  showDetail(list, index);
  switchView("detail");
}

async function main() {
  document.getElementById("tab-nav").addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    switchView(btn.dataset.view);
  });

  initDetail({ onBack: () => switchView(returnView) });

  await Promise.all([
    initGallery((list, index) => openDetail("gallery", list, index)),
    initTimeline({ onOpenDetail: (list, index) => openDetail("timeline", list, index) }),
    initQuiz(),
  ]);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

main();

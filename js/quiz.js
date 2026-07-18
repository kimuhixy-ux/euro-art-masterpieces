import { loadPaintings, paintingThumbUrl } from "./data.js";
import { pickQuizQueue, recordAnswer, getQuizStats, shuffle } from "./storage.js";
import { escapeHtml } from "./gallery.js";

const QUESTIONS_PER_ROUND = 10;
const QUESTION_TYPES = ["title", "artist", "fact"];

let allPaintings = [];
let paintingsById = {};
let questions = [];
let currentQ = 0;
let roundCorrect = 0;
let answered = false;
let els = {};

export async function initQuiz() {
  els.intro = document.getElementById("quiz-intro");
  els.stats = document.getElementById("quiz-stats");
  els.startBtn = document.getElementById("quiz-start");
  els.player = document.getElementById("quiz-player");
  els.quitBtn = document.getElementById("quiz-quit");
  els.progressLabel = document.getElementById("quiz-progress-label");
  els.question = document.getElementById("quiz-question");
  els.choices = document.getElementById("quiz-choices");
  els.feedback = document.getElementById("quiz-feedback");
  els.nextBtn = document.getElementById("quiz-next");
  els.result = document.getElementById("quiz-result");

  allPaintings = await loadPaintings();
  paintingsById = Object.fromEntries(allPaintings.map((p) => [p.id, p]));

  renderIntroStats();

  els.startBtn.addEventListener("click", startRound);
  els.quitBtn.addEventListener("click", quitRound);
  els.nextBtn.addEventListener("click", nextQuestion);
}

function renderIntroStats() {
  const s = getQuizStats();
  els.stats.innerHTML = `
    <div><strong>${s.seenCount}</strong>出題済み</div>
    <div><strong>${s.mastered}</strong>習得済み</div>
    <div><strong>${s.accuracy}%</strong>正答率</div>
  `;
}

function startRound() {
  const ids = pickQuizQueue(allPaintings.map((p) => p.id), QUESTIONS_PER_ROUND);
  questions = ids.map((id) => buildQuestion(paintingsById[id]));
  currentQ = 0;
  roundCorrect = 0;
  answered = false;

  els.intro.hidden = true;
  els.result.hidden = true;
  els.player.hidden = false;
  renderQuestion();
}

function quitRound() {
  els.player.hidden = true;
  els.result.hidden = true;
  els.intro.hidden = false;
  renderIntroStats();
}

function buildQuestion(painting) {
  const type = QUESTION_TYPES[Math.floor(Math.random() * QUESTION_TYPES.length)];
  const distractorPool = shuffle(allPaintings.filter((p) => p.id !== painting.id)).slice(0, 3);

  if (type === "artist") {
    const choices = shuffle([painting.artistJa, ...distractorPool.map((p) => p.artistJa)]);
    return {
      type,
      painting,
      prompt: "この絵の作者は誰でしょう?",
      showImage: true,
      choices,
      correct: painting.artistJa,
    };
  }

  if (type === "fact") {
    const fact = painting.quizFacts[Math.floor(Math.random() * painting.quizFacts.length)];
    const choices = shuffle([painting.titleJa, ...distractorPool.map((p) => p.titleJa)]);
    return {
      type,
      painting,
      prompt: `次の説明に当てはまる作品はどれでしょう?\n「${fact}」`,
      showImage: false,
      choices,
      correct: painting.titleJa,
    };
  }

  const choices = shuffle([painting.titleJa, ...distractorPool.map((p) => p.titleJa)]);
  return {
    type: "title",
    painting,
    prompt: "この絵の作品名は?",
    showImage: true,
    choices,
    correct: painting.titleJa,
  };
}

function renderQuestion() {
  const q = questions[currentQ];
  answered = false;

  els.progressLabel.textContent = `${currentQ + 1} / ${questions.length}`;
  els.feedback.hidden = true;
  els.nextBtn.hidden = true;

  els.question.innerHTML = `
    ${q.showImage ? `<img src="${paintingThumbUrl(q.painting)}" alt="">` : ""}
    <p class="quiz-question-text">${escapeHtml(q.prompt).replace(/\n/g, "<br>")}</p>
  `;

  els.choices.innerHTML = "";
  for (const choice of q.choices) {
    const btn = document.createElement("button");
    btn.className = "quiz-choice-btn";
    btn.textContent = choice;
    btn.addEventListener("click", () => selectChoice(btn, choice));
    els.choices.appendChild(btn);
  }
}

function selectChoice(btn, choice) {
  if (answered) return;
  answered = true;

  const q = questions[currentQ];
  const correct = choice === q.correct;
  if (correct) roundCorrect += 1;
  recordAnswer(q.painting.id, correct);

  for (const b of els.choices.querySelectorAll(".quiz-choice-btn")) {
    b.disabled = true;
    if (b.textContent === q.correct) b.classList.add("is-correct");
    else if (b === btn) b.classList.add("is-wrong");
  }

  els.feedback.hidden = false;
  els.feedback.textContent = correct
    ? `正解!「${q.painting.titleJa}」(${q.painting.artistJa})`
    : `不正解。正解は「${q.correct}」でした。`;
  els.nextBtn.hidden = false;
  els.nextBtn.textContent = currentQ >= questions.length - 1 ? "結果を見る" : "次の問題へ";
}

function nextQuestion() {
  currentQ += 1;
  if (currentQ >= questions.length) {
    showResult();
    return;
  }
  renderQuestion();
}

function showResult() {
  els.player.hidden = true;
  els.result.hidden = false;
  const s = getQuizStats();
  els.result.innerHTML = `
    <h2>結果</h2>
    <p class="result-score">${roundCorrect} / ${questions.length}</p>
    <p>全体の正答率: ${s.accuracy}% / 習得済み: ${s.mastered}点</p>
    <button id="quiz-again" class="primary-btn">もう一度挑戦する</button>
    <button id="quiz-back" class="secondary-btn">クイズ画面に戻る</button>
  `;
  document.getElementById("quiz-again").addEventListener("click", startRound);
  document.getElementById("quiz-back").addEventListener("click", quitRound);
}

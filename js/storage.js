const QUIZ_KEY = "euroart_quiz_v1";
const TIMELINE_KEY = "euroart_timeline_v1";

const BOX_INTERVAL_DAYS = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };
const MAX_BOX = 5;

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function defaultQuizState() {
  return { cards: {}, totalAnswered: 0, totalCorrect: 0 };
}

export function getQuizState() {
  return readJSON(QUIZ_KEY, defaultQuizState());
}

function saveQuizState(state) {
  writeJSON(QUIZ_KEY, state);
}

function cardFor(state, id) {
  if (!state.cards[id]) {
    state.cards[id] = { box: 1, nextReview: 0 };
  }
  return state.cards[id];
}

export function recordAnswer(id, correct) {
  const state = getQuizState();
  const card = cardFor(state, id);
  const now = Date.now();
  if (correct) {
    card.box = Math.min(card.box + 1, MAX_BOX);
  } else {
    card.box = 1;
  }
  card.nextReview = now + BOX_INTERVAL_DAYS[card.box] * 86400000;
  card.lastSeen = now;
  state.totalAnswered += 1;
  if (correct) state.totalCorrect += 1;
  saveQuizState(state);
  return card;
}

// 出題対象を選ぶ: 復習期限が来ているカードを優先し、足りなければ未出題の作品で補う
export function pickQuizQueue(allIds, count) {
  const state = getQuizState();
  const now = Date.now();
  const due = [];
  const unseen = [];
  const notDue = [];

  for (const id of allIds) {
    const card = state.cards[id];
    if (!card) {
      unseen.push(id);
    } else if (card.nextReview <= now) {
      due.push({ id, box: card.box });
    } else {
      notDue.push(id);
    }
  }

  due.sort((a, b) => a.box - b.box);
  const queue = due.map((d) => d.id);

  shuffle(unseen);
  for (const id of unseen) {
    if (queue.length >= count) break;
    queue.push(id);
  }

  shuffle(notDue);
  for (const id of notDue) {
    if (queue.length >= count) break;
    queue.push(id);
  }

  return shuffle(queue).slice(0, count);
}

export function getQuizStats() {
  const state = getQuizState();
  const boxes = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const id in state.cards) {
    boxes[state.cards[id].box] += 1;
  }
  return {
    totalAnswered: state.totalAnswered,
    totalCorrect: state.totalCorrect,
    accuracy: state.totalAnswered ? Math.round((state.totalCorrect / state.totalAnswered) * 100) : 0,
    seenCount: Object.keys(state.cards).length,
    mastered: boxes[5],
    boxes,
  };
}

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ===== 学習(タイムライン)モードの進捗 =====

export function getTimelineProgress() {
  return readJSON(TIMELINE_KEY, null);
}

export function saveTimelineProgress(index) {
  writeJSON(TIMELINE_KEY, { index, updatedAt: Date.now() });
}

export function clearTimelineProgress() {
  localStorage.removeItem(TIMELINE_KEY);
}

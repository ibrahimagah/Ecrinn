const chapters = [
  { name: "İlk ışık", start: 10, goal: 14, flowers: [6], open: [6, 7, 8, 11, 12, 13, 14, 16, 17] },
  { name: "Bahçe yolu", start: 20, goal: 24, flowers: [16, 11], open: [6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22, 23, 24] },
  { name: "Eve dönüş", start: 0, goal: 24, flowers: [7, 16], open: [0, 1, 2, 5, 7, 11, 12, 16, 17, 18, 23, 24] },
];

const board = document.querySelector("#board");
const status = document.querySelector("#status");
const bloomCount = document.querySelector("#bloom-count");
const levelName = document.querySelector("#level-name");
const levelTabs = [...document.querySelectorAll(".level-tab")];
const ending = document.querySelector("#ending");
let chapterIndex = 0;
let trail = [];
let unlocked = 0;
let drawing = false;
let finished = false;

const flowerIcon = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 15c-5-1-7-7-3-9 3-2 5 3 3 9Zm0 0c1-5 7-7 9-3 2 3-3 5-9 3Zm0 0c5 1 7 7 3 9-3 2-5-3-3-9Zm0 0c-1 5-7 7-9 3-2-3 3-5 9-3Z"/><circle cx="16" cy="16" r="2.5"/></svg>';
const gateIcon = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 28V12a10 10 0 0 1 20 0v16h-4V12a6 6 0 0 0-12 0v16H6Z"/><path d="M3 28h26v3H3zM11 18h10v2H11z"/></svg>';
const houseIcon = '<svg viewBox="0 0 36 36" aria-hidden="true"><path d="M3 17 18 4l15 13-2 2-2-2v15H7V17l-2 2-2-2Zm7 11h7v-9h7v9h3V14L18 8l-8 7v13Z"/><path d="M19 19h5v9h-5z"/></svg>';

function chapter() {
  return chapters[chapterIndex];
}

function updateTabs() {
  levelTabs.forEach((tab, index) => {
    tab.disabled = index > unlocked;
    tab.setAttribute("aria-selected", String(index === chapterIndex));
  });
}

function updateFlowers() {
  const collected = chapter().flowers.filter((flower) => trail.includes(flower)).length;
  bloomCount.textContent = `${collected} / ${chapter().flowers.length}`;
}

function updateTrail() {
  const path = new Map(trail.map((cell, index) => [cell, index + 1]));
  board.querySelectorAll(".tile").forEach((tile) => {
    const index = path.get(Number(tile.dataset.cell));
    tile.classList.toggle("trail", index !== undefined);
    tile.querySelector(".step-number")?.remove();
    if (index !== undefined && index > 1 && !tile.classList.contains("flower") && !tile.classList.contains("goal")) {
      const number = document.createElement("span");
      number.className = "step-number";
      number.textContent = String(index - 1);
      tile.append(number);
    }
  });
  updateFlowers();
}

function renderBoard() {
  const current = chapter();
  board.replaceChildren();
  board.setAttribute("aria-label", `${current.name} bahçe yolu bulmacası`);
  levelName.textContent = current.name;

  for (let cell = 0; cell < 25; cell += 1) {
    const tile = document.createElement("button");
    const isOpen = current.open.includes(cell) || cell === current.start || cell === current.goal;
    tile.type = "button";
    tile.className = `tile${isOpen ? "" : " wall"}`;
    tile.dataset.cell = String(cell);
    tile.setAttribute("role", "gridcell");

    if (!isOpen) {
      tile.setAttribute("aria-label", "Bahçe duvarı");
    } else if (cell === current.start) {
      tile.classList.add("start");
      tile.setAttribute("aria-label", "Başlangıç kapısı");
      tile.innerHTML = `<span class="tile-symbol">${gateIcon}</span>`;
    } else if (cell === current.goal) {
      tile.classList.add("goal");
      tile.setAttribute("aria-label", "Küçük ev");
      tile.innerHTML = `<span class="tile-symbol">${houseIcon}</span>`;
    } else if (current.flowers.includes(cell)) {
      tile.classList.add("flower");
      tile.setAttribute("aria-label", "Kır çiçeği");
      tile.innerHTML = `<span class="tile-symbol">${flowerIcon}</span>`;
    } else {
      tile.setAttribute("aria-label", "Bahçe yolu");
    }

    tile.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || finished) return;
      drawing = true;
      stepTo(cell);
    });
    tile.addEventListener("pointerenter", () => {
      if (drawing && !finished) stepTo(cell);
    });
    tile.addEventListener("click", (event) => {
      if (event.detail === 0 && !finished) stepTo(cell);
    });
    board.append(tile);
  }

  trail = [current.start];
  updateTrail();
  updateTabs();
  status.textContent = "Yolu takip et, bütün çiçekleri topla.";
}

function completeChapter() {
  if (chapterIndex === chapters.length - 1) {
    finished = true;
    ending.hidden = false;
    return;
  }
  unlocked = Math.max(unlocked, chapterIndex + 1);
  updateTabs();
  status.textContent = chapterIndex === 0 ? "Ne güzel bir başlangıç. Bahçe yolu açıldı." : "Bütün çiçekler tamam. Eve giden yol açık.";
}

function stepTo(cell) {
  const current = chapter();
  const last = trail.at(-1);
  if (cell === last || (!current.open.includes(cell) && cell !== current.goal && cell !== current.start)) return;

  if (trail.length > 1 && cell === trail.at(-2)) {
    trail.pop();
    updateTrail();
    status.textContent = "Biraz geri dönmek de yolculuğun parçası.";
    return;
  }

  const distance = Math.abs((cell % 5) - (last % 5)) + Math.abs(Math.floor(cell / 5) - Math.floor(last / 5));
  if (distance !== 1 || trail.includes(cell)) return;

  const hasAllFlowers = current.flowers.every((flower) => trail.includes(flower));
  if (cell === current.goal && !hasAllFlowers) {
    status.textContent = "Bahçede hâlâ seni bekleyen çiçekler var.";
    return;
  }

  trail.push(cell);
  updateTrail();
  if (cell === current.goal) completeChapter();
}

function moveByKey(event) {
  const deltas = { ArrowUp: -5, ArrowDown: 5, ArrowLeft: -1, ArrowRight: 1 };
  const delta = deltas[event.key];
  if (delta === undefined || finished) return;
  event.preventDefault();
  const next = trail.at(-1) + delta;
  if ((event.key === "ArrowLeft" && next % 5 === 4) || (event.key === "ArrowRight" && next % 5 === 0)) return;
  stepTo(next);
  board.querySelector(`[data-cell="${next}"]`)?.focus();
}

board.addEventListener("pointerup", () => { drawing = false; });
board.addEventListener("pointercancel", () => { drawing = false; });
document.addEventListener("pointerup", () => { drawing = false; });
board.addEventListener("keydown", moveByKey);

levelTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    if (tab.disabled) return;
    chapterIndex = Number(tab.dataset.level);
    renderBoard();
  });
});

document.querySelector("#restart").addEventListener("click", renderBoard);
document.querySelector("#play-again").addEventListener("click", () => {
  chapterIndex = 0;
  unlocked = 0;
  finished = false;
  ending.hidden = true;
  renderBoard();
});

const moodMessages = {
  güneşli: "Bugün biraz güneşli, biraz da tatlı bir iyimserlik taşıyor.",
  sakin: "Bugün daha sakin bir nefes bırakmak iyi gelir; her şeyin yoluna gireceği bir gün.",
  mutlu: "İçinde bir küçük mutluluk kıvılcımı var ve o yeterli.",
  maceralı: "Bugün biraz risk alıp yeni bir rota denemek için doğru zaman."
};

const moodButton = document.querySelector("#mood-button");
const moodMessage = document.querySelector("#mood-message");
const moodPills = [...document.querySelectorAll(".mood-pill")];

function updateMood(mood) {
  const nextMood = moodMessages[mood] ?? moodMessages.güneşli;
  moodMessage.textContent = nextMood;
  moodPills.forEach((pill) => {
    const isActive = pill.dataset.mood === mood;
    pill.classList.toggle("is-active", isActive);
    pill.setAttribute("aria-pressed", String(isActive));
  });
}

moodPills.forEach((pill) => {
  pill.addEventListener("click", () => updateMood(pill.dataset.mood));
});

moodButton.addEventListener("click", () => {
  const currentMood = moodPills.find((pill) => pill.classList.contains("is-active"))?.dataset.mood ?? "güneşli";
  const moods = Object.keys(moodMessages);
  const currentIndex = moods.indexOf(currentMood);
  const nextMood = moods[(currentIndex + 1) % moods.length];
  updateMood(nextMood);
});

renderBoard();
updateMood("güneşli");

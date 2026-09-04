let songs = [];

async function loadSongs() {
  const response = await fetch("songs.json");
  if (!response.ok) {
    throw new Error(`Could not load songs.json (${response.status})`);
  }

  return await response.json();
}
const segment_lengths = [1, 1, 1, 2, 3, 5];
const total_preview_length = segment_lengths.reduce((a, b) => a + b, 0);

let answer = null;
let turn = 0;
let guessHistory = [];
let revealedSeconds = 0;
let audio = null;
let isFinished = false;

const inputEl = document.getElementById("autoComplete");
const listboxEl = document.getElementById("autoComplete_list_1");
const progressTrackEl = document.querySelector(
  ".h-3.w-full.relative.overflow-hidden"
);
const progressFillOuter = progressTrackEl?.querySelector(
  ".h-full.absolute.bg-custom-mg"
);
const progressFillInner = progressFillOuter?.querySelector(
  ".h-full.absolute.bg-custom-positive"
);
const guessRows = Array.from(
  document.querySelectorAll(
    ".p-3 .p-2.mb-2.border.border-custom-mg.flex.items-center"
  )
);
const borderSections = document.querySelectorAll(".border-t.border-custom-line");
const controlsBar = borderSections && borderSections.length > 1 ? borderSections[1] : null;
const playButton = controlsBar ? controlsBar.querySelector(".flex.justify-center button") : null;
const skipButton = Array.from(document.querySelectorAll("button"))
  .find((b) => b.textContent && b.textContent.trim().startsWith("Skip"));
const submitButton = Array.from(document.querySelectorAll("button"))
  .find((b) => b.textContent && b.textContent.trim() == "Submit");
const centerCol = document.querySelector(
  ".max-w-screen-sm.w-full.mx-auto.h-full.flex.flex-col.justify-between.overflow-auto"
);
function fmt(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
(function initStaticTimers() {
  const timeLabels = document.querySelectorAll(
    ".border-t .flex.justify-between.items-center > div"
  );
  if (timeLabels[0]) timeLabels[0].textContent = fmt(0);
  if (timeLabels[timeLabels.length - 1])
    timeLabels[timeLabels.length - 1].textContent = fmt(total_preview_length);
})();

function pickSong() {
  const n = songs.length;
  if (!n) return undefined;
  const today = new Date();
  const dayNumber = getLocalDayNumber(today);
  const cycle = Math.floor(dayNumber / n);
  const pos = dayNumber % n;
  const order = shuffledOrder(n, seedForCycle(cycle));
  return songs[order[pos]];
}

function getLocalDayNumber(d) {
  let y = d.getFullYear();
  let m = d.getMonth() + 1;
  let day = d.getDate();
  y -= m <= 2 ? 1 : 0;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const mp = m + (m > 2 ? -3 : 9);
  const doy = Math.floor((153 * mp + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}
function seedForCycle(cycle) {
  const SALT = 0x9e3779b1 >>> 0;
  let s = (cycle ^ SALT) >>> 0;
  const mix = mulberry32(s)();
  return Math.floor(mix * 0xffffffff) >>> 0;
}
function shuffledOrder(n, seed) {
  const rng = mulberry32(seed);
  const arr = Array.from({
    length: n
  }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function setupAudio() {
  const src = `previews/${answer[0]}.mp3`;
  audio = new Audio();
  audio.preload = "auto";
  audio.src = src;
  audio.addEventListener("error", () => {
    console.warn("Preview failed to load (check /previews path or filename):", src);
  });
 
  audio.addEventListener("ended", () => {
    if (!isFinished) {
      audio.currentTime = 0;
    }
  });
}
function updateProgress() {
  const pct = (revealedSeconds / total_preview_length) * 100;
  if (progressFillOuter) progressFillOuter.style.width = `${pct}%`;
  if (progressFillInner) {
   
    progressFillInner.style.width = `0%`;
    progressFillInner.style.opacity = "0";
  }
}
function revealMore() {
  if (turn < segment_lengths.length) {
    revealedSeconds = segment_lengths.slice(0, turn + 1).reduce((a, b) => a + b, 0);
    updateProgress();
   
  }
}
function playPreview() {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  const endAt = revealedSeconds;
 
  if (progressFillInner) {
    progressFillInner.style.opacity = "1";
    progressFillInner.style.transition = "opacity 120ms linear";
    progressFillInner.style.width = `0%`;
  }
  const tick = () => {
    if (!audio || isFinished) return;
    const t = audio.currentTime;
   
    if (progressFillInner && endAt > 0) {
      const pct = Math.max(0, Math.min(100, (t / endAt) * 100));
      progressFillInner.style.width = `${pct}%`;
    }
    if (t >= endAt - 0.01) {
      audio.pause();
      audio.currentTime = 0;
      if (progressFillInner) {
        progressFillInner.style.opacity = "0";
        progressFillInner.style.width = `0%`;
      }
      return;
    }
    requestAnimationFrame(tick);
  };
  audio.play()
    .then(() => requestAnimationFrame(tick))
    .catch(() => {
      if (progressFillInner) {
        progressFillInner.style.opacity = "0";
        progressFillInner.style.width = `0%`;
      }
    });
}
function renderGuessRow(idx, text, correct) {
  const row = guessRows[idx];
  if (!row) return;
  row.innerHTML = "";
  const icon = document.createElement("div");
  icon.className = "w-5 h-5 mr-2 flex items-center justify-center";
  icon.innerHTML = correct ?
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' :
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  const label = document.createElement("div");
  label.textContent = text;
  row.appendChild(icon);
  row.appendChild(label);
}
function renderGuessSegments(guessesUsed) {
  const segments = Array.from({
      length: 6
    }, (_, i) =>
    `<div class="w-4 h-1 m-0.5 ${i < guessesUsed ? "bg-custom-positive" : "bg-custom-fg"}"></div>`
  ).join("");
  return `<div class="flex justify-center my-2">${segments}</div>`;
}
function getWinCopy(guessesUsed) {
  const labels = [
    "1st guess - Wow!",
    "2nd guess - Incredible!",
    "3rd guess - Nicely done!",
    "4th guess - Solid!",
    "5th guess - Clutch!",
    "6th guess - Right on time!",
  ];
  return labels[Math.min(guessesUsed - 1, labels.length - 1)];
}
function startCountdown(el) {
  const tz = "America/New_York";
  function nextMidnightET() {
    const now = new Date();
   
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    const parts = Object.fromEntries(fmt.formatToParts(now).map(p => [p.type, p.value]));
    const etNow = new Date(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`);
    const target = new Date(etNow);
    target.setDate(target.getDate() + 1);
    target.setHours(0, 0, 0, 0);
    return target.getTime() - etNow.getTime();
  }
  function fmt(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  }
  let remain = nextMidnightET();
  el.textContent = fmt(remain);
  const id = setInterval(() => {
    remain -= 1000;
    if (remain <= 0) {
      clearInterval(id);
      el.textContent = "00:00:00";
      return;
    }
    el.textContent = fmt(remain);
  }, 1000);
}
function daysSince(isoDate) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) throw new Error("Expected date in YYYY-MM-DD format");
  const y = Number(m[1]),
    mo = Number(m[2]),
    d = Number(m[3]);
 
  const input = new Date(y, mo - 1, d);
 
  if (
    input.getFullYear() !== y ||
    input.getMonth() !== mo - 1 ||
    input.getDate() !== d
  ) {
    throw new Error("Invalid calendar date");
  }
 
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  input.setHours(0, 0, 0, 0);
  const MS_PER_DAY = 86_400_000;
  return Math.floor((today - input) / MS_PER_DAY);
}
function buildShareText(didWin, guessesUsed) {
  while (guessesUsed.length < 6) guessesUsed.push("unused");
  const boxes = Array.from({
    length: 6
  }, (_, i) => (guessesUsed[i] == "correct") ? "🟩" : (guessesUsed[i] == "incorrect") ? "🟥" : (guessesUsed[i] == "skipped") ? "⬛" : "⬜").join("");
  return `Egg Hunt Heardle #${daysSince("2025-10-17") + 1}\n${didWin ? "🔊" : "🔇"}${boxes}\n${window.location}`;
}
function renderGuessSegmentsFromHistory(hist) {
 
  const full = [...hist];
  while (full.length < 6) full.push("unused");
  const box = (status) => {
   
    if (status == "correct") {
      return `<div class="w-4 h-1 m-0.5 bg-custom-positive"></div>`;
    }
    if (status == "incorrect") {
      return `<div class="w-4 h-1 m-0.5" style="background:#dc2626;"></div>`;
    }
    if (status == "skipped") {
      return `<div class="w-4 h-1 m-0.5" style="background:#9f9f9f;"></div>`;
    }
   
    return `<div class="w-4 h-1 m-0.5" style="background:#fff;border:1px solid rgba(255,255,255,0.6);"></div>`;
  };
  return `<div class="flex justify-center my-2">${full.map(box).join("")}</div>`;
}
function hideGameUIOnFinish() {
 
  document.querySelectorAll(".border-t.border-custom-line").forEach(el => {
    el.style.display = "none";
  });
 
  document.querySelectorAll(".text-center.p-3.flex.flex-col.items-center.text-sm.text-custom-line")
    .forEach(el => {
      el.style.display = "none";
    });
 
 
  document.querySelectorAll(".p-3").forEach(el => {
    if (el.querySelector(".p-2.mb-2.border")) el.style.display = "none";
  });
 
  document.querySelectorAll(".m-3.mt-0").forEach(el => {
    el.style.display = "none";
  });
 
  const allButtons = Array.from(document.querySelectorAll("button"));
  allButtons.forEach(btn => {
    const label = (btn.textContent || "").trim().toLowerCase();
    if (label.startsWith("skip") || label == "submit") {
      const parent = btn.closest(".m-3, .mx-3, .px-3, .flex");
      if (parent) parent.style.display = "none";
    }
  });
}
function shareBlocksFromHistory(hist) {
 
 
  const full = [...hist];
  while (full.length < 6) full.push("unused");
  return full.map(s => {
    if (s == "correct") return "🟩";
    if (s == "incorrect") return "🟥";
    if (s == "skipped") return "⬛️";
    return "⬜️";
  }).join("");
}
function finish(didWin) {
  isFinished = true;
  if (audio) audio.pause();
  hideGameUIOnFinish();
 
  playButton?.setAttribute("disabled", "true");
  skipButton?.setAttribute("disabled", "true");
  submitButton?.setAttribute("disabled", "true");
  inputEl.setAttribute("disabled", "true");
  const [id, title, artist, yt] = answer;
  const guessesUsed = didWin ? (turn + 1) : 6;
  const unlockedSeconds = revealedSeconds;
 
  document.querySelectorAll(".border-t.border-custom-line").forEach(el => {
    el.style.display = "none";
  });
 
  if (centerCol) {
    centerCol.innerHTML = `
      <div class="p-3 pb-0 flex-col items-evenly">
        <div class="aspect-video w-full">
          <iframe class="w-full" style="height: 56.25vw; max-height: 60vh;"
            src="https://www.youtube.com/embed/${yt}?autoplay=1"
            title="${title} - ${artist}"
            frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen>
          </iframe>
        </div>
      </div>
      <div class="text-center px-3">
        ${renderGuessSegmentsFromHistory(guessHistory)}
        <p class="py-1">You ${didWin ? "got" : "didn't get"} today's Egg Hunt Heardle${didWin ? ` within ${unlockedSeconds} second${unlockedSeconds==1?"":"s"}.` : `.`}</p>
        <div class="flex flex-col justify-center items-center pt-3">
          <button id="share-btn" class="px-2 py-2 uppercase tracking-widest border-none flex items-center font-semibold text-sm svelte-1r54uzk bg-custom-positive">
            Share
            <svg class="inline-block ml-2" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
          </button>
        </div>
      </div>
      <div class="flex flex-col justify-center items-center mb-6 mx-3">
    <div class="text-center text-custom-line text-sm">Next Egg Hunt Heardle in:</div>
    <div id="countdown" class="tracking-widest text-lg">--:--:--</div>
  </div>
    `;
  }
  const shareBtn = document.getElementById("share-btn");
  shareBtn?.addEventListener("click", async () => {
    const txt = buildShareText(didWin, guessHistory);
    try {
      await navigator.clipboard.writeText(txt);
      shareBtn.textContent = "Copied!";
      setTimeout(() => (shareBtn.textContent = "Share"), 1500);
    } catch {
      alert(txt);
    }
  });
 
  const cd = document.getElementById("countdown");
  if (cd) startCountdown(cd);
}

let filtered = [];
let highlightedIndex = -1;
function normalize(str) {
  return String(str ?? "").toLowerCase();
}
function idFromTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, "")
    .trim()
    .replace(/\s+/g, "_");
}
function openListbox(items) {
  listboxEl.hidden = false;
  listboxEl.innerHTML = items
    .map(
      (s, i) => `
      <li id="ac_${i}" role="option" class="px-3 py-2 cursor-pointer hover:bg-custom-mg ${
        i == highlightedIndex ? "bg-custom-mg" : ""
      }">${s[2]} <span class="text-custom-line">- ${s[1]}</span> (${s[4]})</li>`
    )
    .join("");
}
function closeListbox() {
  listboxEl.hidden = true;
  listboxEl.innerHTML = "";
  highlightedIndex = -1;
}
function updateAutocomplete() {
  const q = normalize(inputEl.value);
  if (!q) {
    closeListbox();
    return;
  }
  filtered = songs.filter(
    (s) => s != null && (normalize(s[1]).includes(q) || normalize(s[2]).includes(q) || normalize(s[4]).includes(q))
  ).slice(0, 8);
  if (filtered.length) openListbox(filtered);
  else closeListbox();
}
listboxEl?.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (!li) return;
  const idx = Array.from(listboxEl.children).indexOf(li);
  if (idx >= 0) {
    inputEl.value = filtered[idx][1];
    closeListbox();
  }
});
inputEl.addEventListener("input", updateAutocomplete);
inputEl.addEventListener("keydown", (e) => {
  if (listboxEl.hidden) return;
  const max = filtered.length - 1;
  if (e.key == "ArrowDown") {
    e.preventDefault();
    highlightedIndex = Math.min(max, highlightedIndex + 1);
    openListbox(filtered);
  } else if (e.key == "ArrowUp") {
    e.preventDefault();
    highlightedIndex = Math.max(0, highlightedIndex - 1);
    openListbox(filtered);
  } else if (e.key == "Enter") {
    if (highlightedIndex >= 0) {
      e.preventDefault();
      inputEl.value = filtered[highlightedIndex][1];
      closeListbox();
    }
  } else if (e.key == "Escape") {
    closeListbox();
  }
});
document.addEventListener("click", (e) => {
  if (!listboxEl.contains(e.target) && e.target !== inputEl) closeListbox();
});

function handlePlay() {
  if (isFinished) return;
  if (!audio) return;
  const ensurePlay = () => playPreview();
 
  if (audio.readyState < 2) {
    audio.addEventListener("loadedmetadata", ensurePlay, {
      once: true
    });
    try {
      audio.load();
    } catch (_) {}
  } else {
    ensurePlay();
  }
}
function handleSkip() {
  if (isFinished) return;
  renderGuessRow(turn, "(skipped)", false);
  guessHistory[turn] = "skipped";
  advanceTurn();
}
function handleSubmit() {
  if (isFinished) return;
  const guessText = inputEl.value.trim();
  if (!guessText) return;
 
  const guessId = idFromTitle(guessText);
  const correct = guessId == answer[0] || normalize(guessText) == normalize(answer[1]);
  guessHistory[turn] = correct ? "correct" : "incorrect";
  renderGuessRow(turn, guessText, correct);
  if (correct) {
    finish(true);
  } else {
    advanceTurn();
  }
}
function advanceTurn() {
  inputEl.value = "";
  closeListbox();
  if (turn < segment_lengths.length - 1) {
    turn += 1;
    revealMore();
  } else {
    finish(false);
  }
}

async function init() {
  try {
    songs = await loadSongs();
    answer = pickSong();
  } catch (error) {
    console.error("Heardle could not start:", error);
    inputEl.setAttribute("disabled", "true");
    inputEl.setAttribute("placeholder", "Songs failed to load");
    return;
  }

  setupAudio();
  updateProgress();
 
  revealMore();
 
  playButton?.addEventListener("click", handlePlay);
  skipButton?.addEventListener("click", handleSkip);
  submitButton?.addEventListener("click", handleSubmit);
  inputEl.addEventListener("keydown", (e) => {
   
    if (e.key == "Enter" && (!listboxEl || listboxEl.hidden)) {
      e.preventDefault();
      handleSubmit();
    }
  });
}
window.addEventListener("load", init);

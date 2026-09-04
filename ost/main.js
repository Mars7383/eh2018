let songs = [];

async function loadSongs() {
  const response = await fetch("../heardle/songs.json");
  if (!response.ok) {
    throw new Error(`Could not load songs.json (${response.status})`);
  }

  return await response.json();
}

const form = document.getElementById("guess-form");
const input = document.getElementById("song-input");
const listbox = document.getElementById("song-list");
const playOverlay = document.getElementById("play-overlay");
const liveTimer = document.getElementById("live-timer");
const lastTrack = document.getElementById("last-track");
const game = document.querySelector(".game");
const results = document.getElementById("results");
const resultsBody = results.querySelector("tbody");
const totalTime = document.getElementById("total-time");
const finalTimeSummary = document.getElementById("final-time-summary");
const totalDelta = document.getElementById("total-delta");
const sumOfBest = document.getElementById("sum-of-best");
const unshuffle = document.getElementById("unshuffle");
const bestTimesStorageKey = "egg-hunt-ost-best-times";

let playlist = [];
let currentIndex = 0;
let songStartedAt = 0;
let totalStartedAt = 0;
let filteredSongs = [];
let highlightedIndex = -1;
let audio = null;
let hasStarted = false;
let timings = [];
let feedbackTimer = null;
let timerFrame = null;
let comparisonBestTimes = null;
let finishSound = null;

function shuffle(items) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function normalize(value) {
  return String(value ?? "").trim().toLocaleLowerCase();
}

function formatTime(milliseconds) {
  const totalSeconds = milliseconds / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(2).padStart(5, "0");
  return `${minutes}:${seconds}`;
}

function formatDelta(milliseconds) {
  if (!Number.isFinite(milliseconds)) return "";
  if (milliseconds === 0) return "0:00.00";
  const sign = milliseconds > 0 ? "+" : "−";
  return `${sign}${formatTime(Math.abs(milliseconds))}`;
}

function loadBestTimes() {
  let bestTimes = {
    version: 1,
    tracks: {},
    total: null
  };

  try {
    const stored = JSON.parse(localStorage.getItem(bestTimesStorageKey));
    if (stored && stored.version === 1) {
      bestTimes = {
        version: 1,
        tracks: stored.tracks && typeof stored.tracks === "object" ? stored.tracks : {},
        total: Number.isFinite(stored.total) ? stored.total : null
      };
    }
  } catch (error) {
    console.warn("Could not load best times:", error);
  }

  return bestTimes;
}

function storeBestTimes(total, previousBestTimes) {
  const bestTimes = {
    version: 1,
    tracks: { ...previousBestTimes.tracks },
    total: previousBestTimes.total
  };

  timings.forEach(({ song, elapsed }) => {
    const previous = bestTimes.tracks[song[0]];
    if (!Number.isFinite(previous) || elapsed < previous) {
      bestTimes.tracks[song[0]] = elapsed;
    }
  });

  if (!Number.isFinite(bestTimes.total) || total < bestTimes.total) {
    bestTimes.total = total;
  }

  try {
    localStorage.setItem(bestTimesStorageKey, JSON.stringify(bestTimes));
  } catch (error) {
    console.warn("Could not store best times:", error);
  }

  return bestTimes;
}

function setDelta(element, difference, isBestSegment = false) {
  element.textContent = formatDelta(difference);
  element.className = "delta";
  element.style.removeProperty("--delta-color");

  if (!Number.isFinite(difference)) {
    element.classList.add("no-comparison");
  } else if (isBestSegment) {
    element.classList.add("best-segment");
  } else if (difference <= 0) {
    element.classList.add("ahead");
  } else {
    element.classList.add("behind");
  }

  if (Number.isFinite(difference)) {
    const strength = Math.min(Math.abs(difference) / 10000, 1);
    const saturation = Math.round(45 + strength * 55);
    const lightness = Math.round(58 - strength * 12);
    const hue = difference <= 0 ? 136 : 5;
    element.style.setProperty("--delta-color", `hsl(${hue} ${saturation}% ${lightness}%)`);
  }
}

function updateLiveTimer() {
  liveTimer.textContent = formatTime(performance.now() - totalStartedAt);
  timerFrame = requestAnimationFrame(updateLiveTimer);
}

function startLiveTimer() {
  cancelAnimationFrame(timerFrame);
  liveTimer.textContent = formatTime(performance.now() - totalStartedAt);
  timerFrame = requestAnimationFrame(updateLiveTimer);
}

function handlePlaybackFailure() {
  hasStarted = false;
  cancelAnimationFrame(timerFrame);
  liveTimer.classList.remove("running");
  playOverlay.hidden = false;
}

function loadCurrentSong() {
  if (audio) {
    audio.pause();
  }

  const song = playlist[currentIndex];
  audio = new Audio(`../heardle/previews/${song[0]}.mp3`);
  audio.loop = true;
  audio.preload = "auto";
  songStartedAt = performance.now();

  return audio.play().catch(handlePlaybackFailure);
}

function startGame() {
  if (hasStarted) return Promise.resolve();
  hasStarted = true;
  liveTimer.classList.add("running");
  if (!totalStartedAt) {
    totalStartedAt = performance.now();
  }
  startLiveTimer();

  if (!audio) {
    return loadCurrentSong();
  }

  songStartedAt = performance.now();
  return audio.play().catch(handlePlaybackFailure);
}

function closeListbox() {
  listbox.hidden = true;
  listbox.innerHTML = "";
  input.setAttribute("aria-expanded", "false");
  highlightedIndex = -1;
}

function renderListbox() {
  listbox.innerHTML = "";

  filteredSongs.forEach((song, index) => {
    const option = document.createElement("li");
    option.id = `song-option-${index}`;
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", String(index === highlightedIndex));
    option.dataset.index = String(index);
    option.append(document.createTextNode(`${song[2]} - ${song[1]} `));

    const detail = document.createElement("span");
    detail.className = "song-detail";
    detail.textContent = `(${song[4]})`;
    option.append(detail);
    listbox.append(option);
  });

  listbox.hidden = filteredSongs.length === 0;
  input.setAttribute("aria-expanded", String(filteredSongs.length > 0));
}

function getMatchPriority(song, query) {
  if (normalize(song[1]).includes(query)) return 0;
  if (normalize(song[2]).includes(query)) return 1;
  if (normalize(song[4]).includes(query)) return 2;
  return -1;
}

function updateAutocomplete() {
  const query = normalize(input.value);
  if (!query) {
    closeListbox();
    return;
  }

  filteredSongs = songs
    .map((song, index) => ({
      song,
      index,
      priority: getMatchPriority(song, query)
    }))
    .filter((match) => match.priority >= 0)
    .sort((a, b) => a.priority - b.priority || a.index - b.index)
    .slice(0, 8)
    .map((match) => match.song);
  highlightedIndex = -1;
  renderListbox();
}

function selectSong(index) {
  const song = filteredSongs[index];
  if (!song) return;
  input.value = song[1];
  closeListbox();
  input.focus();
}

function showFeedback(state) {
  clearTimeout(feedbackTimer);
  input.classList.remove("incorrect", "correct");
  void input.offsetWidth;
  input.classList.add(state);
  feedbackTimer = setTimeout(() => {
    input.classList.remove(state);
  }, 300);
}

function renderResultsRows() {
  resultsBody.innerHTML = "";
  const songOrder = new Map(songs.map((song, index) => [song[0], index]));
  const displayedTimings = unshuffle.checked
    ? [...timings].sort((a, b) => songOrder.get(a.song[0]) - songOrder.get(b.song[0]))
    : timings;

  displayedTimings.forEach((result, index) => {
    const row = resultsBody.insertRow();
    row.insertCell().textContent = String(index + 1);

    const songCell = row.insertCell();
    songCell.append(document.createTextNode(result.song[1]));
    const delta = document.createElement("span");
    const previous = comparisonBestTimes.tracks[result.song[0]];
    const difference = Number.isFinite(previous) ? result.elapsed - previous : null;
    setDelta(delta, difference, Number.isFinite(previous) && difference < 0);
    songCell.append(delta);

    const timeCell = row.insertCell();
    timeCell.className = "split-time";
    timeCell.textContent = formatTime(result.elapsed);
  });
}

function playFinishSound(isPersonalBest) {
  finishSound = new Audio(
    isPersonalBest ? "sounds/collect_special.mp3" : "sounds/collect.mp3"
  );
  finishSound.play().catch((error) => {
    console.warn("Could not play finish sound:", error);
  });
}

function celebratePersonalBest() {
  if (typeof window.confetti !== "function") return;
  const rect = finalTimeSummary.getBoundingClientRect();
  const origin = {
    x: (rect.left + rect.width / 2) / window.innerWidth,
    y: (rect.top + rect.height / 2) / window.innerHeight
  };

  window.confetti({
    particleCount: 160,
    spread: 160,
    startVelocity: 60,
    origin,
    colors: ["#fc007e", "#ff7300", "#057dfe", "#00cb0a"], // main egg hunt world colors!
    disableForReducedMotion: true,
    ticks: 200,
  });
}

function showResults() {
  if (audio) audio.pause();
  cancelAnimationFrame(timerFrame);
  game.hidden = true;
  const total = performance.now() - totalStartedAt;
  comparisonBestTimes = loadBestTimes();
  renderResultsRows();

  const formattedTotal = formatTime(total);
  totalTime.textContent = formattedTotal;
  finalTimeSummary.textContent = formattedTotal;
  const totalDifference = Number.isFinite(comparisonBestTimes.total)
    ? total - comparisonBestTimes.total
    : null;
  const isPersonalBest = !Number.isFinite(comparisonBestTimes.total)
    || totalDifference < 0;
  setDelta(totalDelta, totalDifference);

  const updatedBestTimes = storeBestTimes(total, comparisonBestTimes);
  const bestSegmentsTotal = songs.reduce((sum, song) => {
    const best = updatedBestTimes.tracks[song[0]];
    return sum + (Number.isFinite(best) ? best : 0);
  }, 0);
  sumOfBest.textContent = formatTime(bestSegmentsTotal);
  results.hidden = false;
  playFinishSound(isPersonalBest);
  if (isPersonalBest) {
    requestAnimationFrame(celebratePersonalBest);
  }
}

function submitGuess() {
  const guess = normalize(input.value);
  if (!guess) return;
  if (!hasStarted) startGame();

  const answer = playlist[currentIndex];
  if (guess !== normalize(answer[1])) {
    showFeedback("incorrect");
    input.value = "";
    closeListbox();
    return;
  }

  timings.push({
    song: answer,
    elapsed: performance.now() - songStartedAt
  });
  lastTrack.textContent = `Last track: ${answer[1]}`;
  showFeedback("correct");
  currentIndex += 1;
  input.value = "";
  closeListbox();

  if (currentIndex >= playlist.length) {
    showResults();
    return;
  }

  loadCurrentSong();
  input.focus();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  submitGuess();
});

input.addEventListener("input", () => {
  startGame();
  updateAutocomplete();
});

input.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown" && !listbox.hidden) {
    event.preventDefault();
    highlightedIndex = Math.min(filteredSongs.length - 1, highlightedIndex + 1);
    renderListbox();
  } else if (event.key === "ArrowUp" && !listbox.hidden) {
    event.preventDefault();
    highlightedIndex = Math.max(0, highlightedIndex - 1);
    renderListbox();
  } else if (event.key === "Enter") {
    event.preventDefault();
    if (!listbox.hidden && filteredSongs.length > 0) {
      selectSong(highlightedIndex >= 0 ? highlightedIndex : 0);
    } else {
      submitGuess();
    }
  } else if (event.key === "Escape") {
    closeListbox();
  }
});

listbox.addEventListener("mousedown", (event) => {
  const option = event.target.closest("li");
  if (!option) return;
  event.preventDefault();
  selectSong(Number(option.dataset.index));
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".autocomplete")) closeListbox();
});

unshuffle.addEventListener("change", renderResultsRows);

playOverlay.addEventListener("click", async () => {
  await startGame();
  if (!hasStarted) return;
  playOverlay.hidden = true;
  input.focus();
});

async function init() {
  input.disabled = true;
  playOverlay.disabled = true;
  unshuffle.checked = false;

  try {
    songs = await loadSongs();
    playlist = shuffle(songs);
    input.disabled = false;
    playOverlay.disabled = false;
  } catch (error) {
    console.error("OST game could not start:", error);
    input.placeholder = "Songs failed to load";
    playOverlay.textContent = "Songs failed to load";
  }
}

init();

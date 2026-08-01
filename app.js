import {
  getAudioUrl,
  getCurrentUser,
  isSupabaseConfigured,
  loadSessionsFromSupabase,
  saveSessionToSupabase,
  signOut
} from "./supabase.js";

/*
  Replace each storagePath with your own Supabase Storage filename.
  Until then, the interface still works; the timer will run without audio.
*/

async function requireAuthenticatedUser() {
  if (!isSupabaseConfigured) {
    document.body.innerHTML = `
      <main style="
        min-height:100vh;
        display:grid;
        place-items:center;
        padding:24px;
        color:#f7f8fb;
        background:#070b13;
        font-family:system-ui,sans-serif;
      ">
        <section style="
          width:min(100%,520px);
          padding:34px;
          border:1px solid rgba(255,255,255,.1);
          border-radius:24px;
          background:rgba(255,255,255,.055);
        ">
          <h1 style="margin-top:0">Connect Supabase first</h1>
          <p style="color:#9aa7ba;line-height:1.6">
            Add your Supabase project URL and anon key inside
            <code>supabase.js</code>, then create an account.
          </p>
          <a
            href="./signup.html"
            style="color:#f7f8fb"
          >Return to signup</a>
        </section>
      </main>
    `;

    throw new Error("Supabase is not configured.");
  }

  const user = await getCurrentUser();

  if (!user) {
    window.location.replace("./login.html");
    throw new Error("Authentication required.");
  }

  return user;
}

const vibes = {
  sleep: {
    label: "Sleep",
    title: "Rainy Drift",
    description:
      "Soft pads, distant rain, and low-frequency textures for a quieter mind.",
    accent: "#769cff",
    background: "#08111f",
    tracks: [
      {
        id: "rainy-drift",
        title: "Rainy Drift",
        subtitle: "Rain + ambient pads",
        storagePath: "audio/rain/rain1.mp3"
      },
      {
        id: "dark-ocean",
        title: "Dark Ocean",
        subtitle: "Slow waves + deep noise",
        storagePath: "sleep/dark-ocean.mp3"
      },
      {
        id: "room-tone",
        title: "Quiet Room",
        subtitle: "Fan texture + warm air",
        storagePath: "sleep/quiet-room.mp3"
      }
    ]
  },

  study: {
    label: "Study",
    title: "Deep Library",
    description:
      "Steady textures and restrained rhythm designed to make distractions fade.",
    accent: "#59c6b4",
    background: "#071817",
    tracks: [
      {
        id: "deep-library",
        title: "Deep Library",
        subtitle: "Brown noise + soft pulse",
        storagePath: "study/deep-library.mp3"
      },
      {
        id: "rainy-window",
        title: "Rainy Window",
        subtitle: "Rain + quiet room tone",
        storagePath: "study/rainy-window.mp3"
      },
      {
        id: "night-desk",
        title: "Night Desk",
        subtitle: "Minimal synth atmosphere",
        storagePath: "study/night-desk.mp3"
      }
    ]
  },

  create: {
    label: "Create",
    title: "Neon Canvas",
    description:
      "An open, cinematic environment for writing, designing, and making something new.",
    accent: "#c07bff",
    background: "#130a1f",
    tracks: [
      {
        id: "neon-canvas",
        title: "Neon Canvas",
        subtitle: "Airy synths + distant rhythm",
        storagePath: "create/neon-canvas.mp3"
      },
      {
        id: "blank-page",
        title: "Blank Page",
        subtitle: "Warm pads + tape texture",
        storagePath: "create/blank-page.mp3"
      },
      {
        id: "blue-hour",
        title: "Blue Hour",
        subtitle: "Emotional ambient motion",
        storagePath: "create/blue-hour.mp3"
      }
    ]
  },

  workout: {
    label: "Workout",
    title: "Afterburn",
    description:
      "Forward motion, clean percussion, and enough intensity to keep you moving.",
    accent: "#ff765f",
    background: "#1a0d0a",
    tracks: [
      {
        id: "afterburn",
        title: "Afterburn",
        subtitle: "Driving electronic rhythm",
        storagePath: "workout/afterburn.mp3"
      },
      {
        id: "second-wind",
        title: "Second Wind",
        subtitle: "Percussion + rising energy",
        storagePath: "workout/second-wind.mp3"
      },
      {
        id: "redline",
        title: "Redline",
        subtitle: "Fast pulse + heavy texture",
        storagePath: "workout/redline.mp3"
      }
    ]
  },

  calm: {
    label: "Calm",
    title: "Soft Rain",
    description:
      "Gentle water, open space, and slow movement to help your body release tension.",
    accent: "#61b8e8",
    background: "#07151d",
    tracks: [
      {
        id: "soft-rain",
        title: "Soft Rain",
        subtitle: "Rain + distant room tone",
        storagePath: "calm/soft-rain.mp3"
      },
      {
        id: "open-water",
        title: "Open Water",
        subtitle: "Slow waves + soft wind",
        storagePath: "calm/open-water.mp3"
      },
      {
        id: "morning-air",
        title: "Morning Air",
        subtitle: "Birds + gentle ambience",
        storagePath: "calm/morning-air.mp3"
      }
    ]
  },

  learn: {
    label: "Learn",
    title: "Clear Mind",
    description:
      "A bright, alert sound environment for reading, lessons, and retaining information.",
    accent: "#e6bf5a",
    background: "#171306",
    tracks: [
      {
        id: "clear-mind",
        title: "Clear Mind",
        subtitle: "Light pulse + open ambience",
        storagePath: "learn/clear-mind.mp3"
      },
      {
        id: "curious-state",
        title: "Curious State",
        subtitle: "Soft rhythm + harmonic motion",
        storagePath: "learn/curious-state.mp3"
      },
      {
        id: "memory-room",
        title: "Memory Room",
        subtitle: "Steady noise + subtle tone",
        storagePath: "learn/memory-room.mp3"
      }
    ]
  }
};

const state = {
  vibe: "sleep",
  trackIndex: 0,
  durationMinutes: 20,
  elapsedSeconds: 0,
  timerId: null,
  playing: false,
  soundEnabled: true,
  favorites: loadLocal("aura-favorites", []),
  sessions: loadLocal("aura-sessions", [])
};

const elements = {
  body: document.body,
  views: document.querySelectorAll(".view"),
  navItems: document.querySelectorAll(".nav-item"),
  vibeCards: document.querySelectorAll(".vibe-card"),

  sessionTitle: document.querySelector("#session-title"),
  sessionDescription: document.querySelector("#session-description"),
  durationSelect: document.querySelector("#duration-select"),
  trackSelect: document.querySelector("#track-select"),

  audio: document.querySelector("#audio-player"),
  playButton: document.querySelector("#play-button"),
  resetButton: document.querySelector("#reset-button"),
  favoriteButton: document.querySelector("#favorite-button"),
  volumeSlider: document.querySelector("#volume-slider"),

  elapsedTime: document.querySelector("#elapsed-time"),
  remainingTime: document.querySelector("#remaining-time"),
  progressTrack: document.querySelector("#progress-track"),
  progressFill: document.querySelector("#progress-fill"),

  soundToggle: document.querySelector("#sound-toggle"),
  soundToggleIcon: document.querySelector("#sound-toggle-icon"),
  soundToggleLabel: document.querySelector("#sound-toggle-label"),

  statusMessage: document.querySelector("#status-message"),
  weeklyMinutes: document.querySelector("#weekly-minutes"),
  favoriteVibe: document.querySelector("#favorite-vibe"),
  currentStreak: document.querySelector("#current-streak"),

  historyList: document.querySelector("#history-list"),
  favoritesList: document.querySelector("#favorites-list"),
  clearHistoryButton: document.querySelector("#clear-history-button"),

  profileName: document.querySelector("#profile-name"),
  profilePlan: document.querySelector("#profile-plan"),
  signOutButton: document.querySelector("#sign-out-button")
};

function loadLocal(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatTime(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getCurrentVibe() {
  return vibes[state.vibe];
}

function getCurrentTrack() {
  return getCurrentVibe().tracks[state.trackIndex];
}

function setStatus(message, isError = false) {
  elements.statusMessage.textContent = message;
  elements.statusMessage.classList.toggle("status-message--error", isError);
}

function setTheme(vibeKey) {
  const vibe = vibes[vibeKey];

  document.documentElement.style.setProperty("--accent", vibe.accent);
  document.documentElement.style.setProperty(
    "--accent-soft",
    `${vibe.accent}2e`
  );
  document.documentElement.style.setProperty(
    "--accent-glow",
    `${vibe.accent}55`
  );
  document.documentElement.style.setProperty("--background", vibe.background);

  elements.body.dataset.vibe = vibeKey;
}

function populateTrackSelect() {
  const vibe = getCurrentVibe();

  elements.trackSelect.innerHTML = vibe.tracks
    .map(
      (track, index) => `
        <option value="${index}">
          ${track.title} — ${track.subtitle}
        </option>
      `
    )
    .join("");

  elements.trackSelect.value = String(state.trackIndex);
}

function updateSessionContent() {
  const vibe = getCurrentVibe();
  const track = getCurrentTrack();

  elements.sessionTitle.textContent = track.title || vibe.title;
  elements.sessionDescription.textContent = vibe.description;

  populateTrackSelect();
  updateFavoriteButton();
  loadAudioTrack();
}

function loadAudioTrack() {
  const track = getCurrentTrack();
  const audioUrl = `/${track.storagePath}`;

  elements.audio.pause();
  elements.audio.src = audioUrl;
  elements.audio.volume = Number(elements.volumeSlider.value);
  elements.audio.muted = !state.soundEnabled;

  if (state.playing) {
    elements.audio.play().catch(() => {
      setStatus(
        "The timer is running, but this audio file is not available yet.",
        true
      );
    });
  }
}

function selectVibe(vibeKey) {
  if (!vibes[vibeKey]) {
    return;
  }

  pauseSession();

  state.vibe = vibeKey;
  state.trackIndex = 0;
  state.elapsedSeconds = 0;

  elements.vibeCards.forEach((card) => {
    card.classList.toggle(
      "vibe-card--active",
      card.dataset.vibe === vibeKey
    );
  });

  setTheme(vibeKey);
  updateSessionContent();
  updateTimerUI();
  setStatus(`${vibes[vibeKey].label} mode selected.`);
}

function updateTimerUI() {
  const totalSeconds = state.durationMinutes * 60;
  const remainingSeconds = totalSeconds - state.elapsedSeconds;
  const progress =
    totalSeconds > 0 ? (state.elapsedSeconds / totalSeconds) * 100 : 0;

  elements.elapsedTime.textContent = formatTime(state.elapsedSeconds);
  elements.remainingTime.textContent = formatTime(remainingSeconds);
  elements.progressFill.style.width = `${Math.min(progress, 100)}%`;
}

function startSession() {
  if (state.playing) {
    return;
  }

  state.playing = true;
  elements.playButton.textContent = "Ⅱ";
  elements.playButton.setAttribute("aria-label", "Pause session");

  if (state.soundEnabled) {
    elements.audio.play().catch(() => {
      setStatus(
        "Session started. Add the matching audio file to Supabase Storage to hear sound.",
        true
      );
    });
  }

  state.timerId = window.setInterval(() => {
    state.elapsedSeconds += 1;
    updateTimerUI();

    if (state.elapsedSeconds >= state.durationMinutes * 60) {
      completeSession();
    }
  }, 1000);

  setStatus(`${getCurrentTrack().title} is playing.`);
}

function pauseSession() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }

  state.playing = false;
  elements.audio.pause();
  elements.playButton.textContent = "▶";
  elements.playButton.setAttribute("aria-label", "Play session");
}

function toggleSession() {
  if (state.playing) {
    pauseSession();
    setStatus("Session paused.");
  } else {
    startSession();
  }
}

async function completeSession() {
  pauseSession();

  const track = getCurrentTrack();
  const session = {
    id: crypto.randomUUID(),
    vibe: state.vibe,
    trackId: track.id,
    trackTitle: track.title,
    durationMinutes: state.durationMinutes,
    completedSeconds: state.elapsedSeconds,
    createdAt: new Date().toISOString()
  };

  state.sessions.unshift(session);
  state.sessions = state.sessions.slice(0, 100);

  saveLocal("aura-sessions", state.sessions);
  renderHistory();
  renderInsights();

  try {
    await saveSessionToSupabase(session);
    setStatus("Session complete. Your progress has been saved.");
  } catch (error) {
    console.error(error);
    setStatus(
      "Session saved locally, but Supabase could not save it.",
      true
    );
  }

  state.elapsedSeconds = 0;
  updateTimerUI();
}

function resetSession() {
  pauseSession();
  state.elapsedSeconds = 0;
  elements.audio.currentTime = 0;
  updateTimerUI();
  setStatus("Session reset.");
}

function seekSession(event) {
  const rect = elements.progressTrack.getBoundingClientRect();
  const percentage = (event.clientX - rect.left) / rect.width;
  const totalSeconds = state.durationMinutes * 60;

  state.elapsedSeconds = Math.round(
    Math.max(0, Math.min(1, percentage)) * totalSeconds
  );

  updateTimerUI();
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  elements.audio.muted = !state.soundEnabled;

  elements.soundToggleIcon.textContent = state.soundEnabled ? "◉" : "○";
  elements.soundToggleLabel.textContent = state.soundEnabled
    ? "Sound on"
    : "Sound off";

  if (state.playing && state.soundEnabled) {
    elements.audio.play().catch(() => {});
  }
}

function toggleFavorite() {
  const track = getCurrentTrack();
  const index = state.favorites.findIndex(
    (favorite) => favorite.trackId === track.id
  );

  if (index >= 0) {
    state.favorites.splice(index, 1);
    setStatus(`${track.title} removed from favorites.`);
  } else {
    state.favorites.unshift({
      trackId: track.id,
      trackTitle: track.title,
      vibe: state.vibe
    });
    setStatus(`${track.title} added to favorites.`);
  }

  saveLocal("aura-favorites", state.favorites);
  updateFavoriteButton();
  renderFavorites();
}

function updateFavoriteButton() {
  const track = getCurrentTrack();
  const isFavorite = state.favorites.some(
    (favorite) => favorite.trackId === track.id
  );

  elements.favoriteButton.textContent = isFavorite ? "♥" : "♡";
  elements.favoriteButton.classList.toggle(
    "favorite-button--active",
    isFavorite
  );
}

function changeView(viewName) {
  elements.views.forEach((view) => {
    view.classList.toggle(
      "view--active",
      view.id === `${viewName}-view`
    );
  });

  elements.navItems.forEach((item) => {
    item.classList.toggle(
      "nav-item--active",
      item.dataset.view === viewName
    );
  });

  if (viewName === "history") {
    renderHistory();
  }

  if (viewName === "favorites") {
    renderFavorites();
  }
}

function renderHistory() {
  if (!state.sessions.length) {
    elements.historyList.innerHTML = `
      <div class="empty-state">
        Complete your first session and it will appear here.
      </div>
    `;
    return;
  }

  elements.historyList.innerHTML = state.sessions
    .map((session) => {
      const date = new Date(session.createdAt).toLocaleString();
      const completedMinutes = Math.max(
        1,
        Math.round(session.completedSeconds / 60)
      );

      return `
        <article class="history-item">
          <div class="history-item__main">
            <strong>${escapeHtml(session.trackTitle)}</strong>
            <span>
              ${completedMinutes} min completed · ${escapeHtml(date)}
            </span>
          </div>

          <span class="history-item__badge">
            ${escapeHtml(session.vibe)}
          </span>
        </article>
      `;
    })
    .join("");
}

function renderFavorites() {
  if (!state.favorites.length) {
    elements.favoritesList.innerHTML = `
      <div class="empty-state">
        Tap the heart on an environment to save it here.
      </div>
    `;
    return;
  }

  elements.favoritesList.innerHTML = state.favorites
    .map(
      (favorite) => `
        <article class="favorite-item">
          <div class="favorite-item__main">
            <strong>${escapeHtml(favorite.trackTitle)}</strong>
            <span>Saved environment</span>
          </div>

          <span class="favorite-item__badge">
            ${escapeHtml(favorite.vibe)}
          </span>
        </article>
      `
    )
    .join("");
}

function renderInsights() {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const recentSessions = state.sessions.filter(
    (session) => new Date(session.createdAt).getTime() >= sevenDaysAgo
  );

  const weeklySeconds = recentSessions.reduce(
    (sum, session) => sum + session.completedSeconds,
    0
  );

  elements.weeklyMinutes.textContent =
    `${Math.round(weeklySeconds / 60)} min`;

  const vibeCounts = state.sessions.reduce((counts, session) => {
    counts[session.vibe] = (counts[session.vibe] || 0) + 1;
    return counts;
  }, {});

  const topVibe = Object.entries(vibeCounts).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];

  elements.favoriteVibe.textContent = topVibe
    ? vibes[topVibe].label
    : "Sleep";

  elements.currentStreak.textContent =
    `${calculateStreak(state.sessions)} days`;
}

function calculateStreak(sessions) {
  if (!sessions.length) {
    return 0;
  }

  const uniqueDays = new Set(
    sessions.map((session) =>
      new Date(session.createdAt).toISOString().slice(0, 10)
    )
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (true) {
    const key = cursor.toISOString().slice(0, 10);

    if (!uniqueDays.has(key)) {
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value);
  return div.innerHTML;
}

async function loadUserAndRemoteSessions() {
  const user = await getCurrentUser();

  if (!user) {
    window.location.replace("./login.html");
    return;
  }

  const displayName =
    user.user_metadata?.display_name ||
    user.email?.split("@")[0] ||
    "Member";

  elements.profileName.textContent = displayName;
  elements.profilePlan.textContent = "Premium";

  try {
    const remoteSessions = await loadSessionsFromSupabase();

    if (remoteSessions.length) {
      const merged = [...remoteSessions, ...state.sessions];
      const byId = new Map(merged.map((session) => [session.id, session]));
      state.sessions = [...byId.values()].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      saveLocal("aura-sessions", state.sessions);
      renderHistory();
      renderInsights();
    }
  } catch (error) {
    console.error("Could not load Supabase sessions:", error);
  }
}

function bindEvents() {
  elements.vibeCards.forEach((card) => {
    card.addEventListener("click", () => {
      selectVibe(card.dataset.vibe);
    });
  });

  elements.navItems.forEach((item) => {
    item.addEventListener("click", () => {
      changeView(item.dataset.view);
    });
  });

  elements.durationSelect.addEventListener("change", () => {
    state.durationMinutes = Number(elements.durationSelect.value);
    state.elapsedSeconds = 0;
    updateTimerUI();
  });

  elements.trackSelect.addEventListener("change", () => {
    state.trackIndex = Number(elements.trackSelect.value);
    state.elapsedSeconds = 0;
    updateSessionContent();
    updateTimerUI();
    setStatus(`${getCurrentTrack().title} selected.`);
  });

  elements.playButton.addEventListener("click", toggleSession);
  elements.resetButton.addEventListener("click", resetSession);
  elements.favoriteButton.addEventListener("click", toggleFavorite);
  elements.soundToggle.addEventListener("click", toggleSound);
  elements.progressTrack.addEventListener("click", seekSession);

  elements.volumeSlider.addEventListener("input", () => {
    elements.audio.volume = Number(elements.volumeSlider.value);
  });

  elements.clearHistoryButton.addEventListener("click", () => {
    state.sessions = [];
    saveLocal("aura-sessions", state.sessions);
    renderHistory();
    renderInsights();
  });

  elements.signOutButton.addEventListener("click", async () => {
    try {
      await signOut();
      window.location.replace("./login.html");
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  window.addEventListener("beforeunload", () => {
    if (state.playing && state.elapsedSeconds > 0) {
      const track = getCurrentTrack();

      const session = {
        id: crypto.randomUUID(),
        vibe: state.vibe,
        trackId: track.id,
        trackTitle: track.title,
        durationMinutes: state.durationMinutes,
        completedSeconds: state.elapsedSeconds,
        createdAt: new Date().toISOString()
      };

      state.sessions.unshift(session);
      saveLocal("aura-sessions", state.sessions);
    }
  });
}

async function initialize() {
  await requireAuthenticatedUser();
  bindEvents();
  setTheme(state.vibe);
  updateSessionContent();
  updateTimerUI();
  renderHistory();
  renderFavorites();
  renderInsights();
  await loadUserAndRemoteSessions();

  if (!elements.audio.src) {
    setStatus("Your account is ready. Add audio files when you have them.");
  }
}

initialize();

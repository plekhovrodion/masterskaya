const gameVideos = [...document.querySelectorAll("video[data-game-video]")];

const ICONS = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" fill="currentColor"/></svg>',
  pause:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4.2" height="14" rx="1.4" fill="currentColor"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.4" fill="currentColor"/></svg>',
  expand:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  shrink:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function makeButton(className, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.setAttribute("aria-label", label);
  return button;
}

function requestFullscreen(player, video) {
  const target = player.requestFullscreen || player.webkitRequestFullscreen;
  if (target) return target.call(player);
  if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
  return undefined;
}

function fullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function buildPlayer(video) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const player = document.createElement("div");
  player.className = "player is-paused";
  player.tabIndex = 0;
  player.setAttribute("role", "group");
  player.setAttribute("aria-label", video.getAttribute("aria-label") || "Видеоплеер");

  video.removeAttribute("controls");
  video.replaceWith(player);

  const big = makeButton("player__big", "Смотреть");
  big.innerHTML = ICONS.play;

  const bar = document.createElement("div");
  bar.className = "player__bar";

  const toggle = makeButton("player__btn", "Воспроизвести");
  const current = document.createElement("span");
  current.className = "player__time";
  current.textContent = "0:00";
  const seek = document.createElement("input");
  seek.className = "player__seek";
  seek.type = "range";
  seek.min = "0";
  seek.max = "1000";
  seek.step = "1";
  seek.value = "0";
  seek.setAttribute("aria-label", "Перемотка");
  const total = document.createElement("span");
  total.className = "player__time";
  total.textContent = "0:00";
  const full = makeButton("player__btn", "Открыть на весь экран");

  bar.append(toggle, current, seek, total, full);
  player.append(video, big, bar);

  let userPaused = false;
  let hideTimer = 0;

  const syncPlayback = () => {
    const playing = !video.paused;
    player.classList.toggle("is-paused", !playing);
    toggle.innerHTML = playing ? ICONS.pause : ICONS.play;
    toggle.setAttribute("aria-label", playing ? "Пауза" : "Воспроизвести");
  };

  const syncFullscreen = () => {
    const active = fullscreenElement() === player;
    full.innerHTML = active ? ICONS.shrink : ICONS.expand;
    full.setAttribute("aria-label", active ? "Выйти из полноэкранного режима" : "Открыть на весь экран");
    player.classList.toggle("is-fullscreen", active);
  };

  const syncProgress = () => {
    const duration = video.duration || 0;
    const ratio = duration ? video.currentTime / duration : 0;
    seek.value = String(Math.round(ratio * 1000));
    seek.style.setProperty("--p", `${ratio * 100}%`);
    current.textContent = formatTime(video.currentTime);
    total.textContent = formatTime(duration);
  };

  const wake = () => {
    player.classList.add("is-active");
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      if (!video.paused) player.classList.remove("is-active");
    }, 2600);
  };

  const play = () => {
    userPaused = false;
    video.play().catch(() => {});
  };

  const pause = () => {
    userPaused = true;
    video.pause();
  };

  const togglePlayback = () => (video.paused ? play() : pause());

  const toggleFullscreen = () => {
    if (fullscreenElement() === player) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      return;
    }
    play();
    const request = requestFullscreen(player, video);
    if (request && request.catch) request.catch(() => {});
  };

  toggle.addEventListener("click", togglePlayback);
  big.addEventListener("click", play);
  video.addEventListener("click", togglePlayback);
  video.addEventListener("dblclick", toggleFullscreen);
  full.addEventListener("click", toggleFullscreen);

  seek.addEventListener("input", () => {
    const duration = video.duration || 0;
    if (!duration) return;
    video.currentTime = (Number(seek.value) / 1000) * duration;
    seek.style.setProperty("--p", `${Number(seek.value) / 10}%`);
  });

  player.addEventListener("pointermove", wake);
  player.addEventListener("pointerdown", wake);
  player.addEventListener("focusin", wake);
  player.addEventListener("keydown", (event) => {
    if (event.target !== player && event.target.tagName === "INPUT") return;
    const keys = {
      " ": togglePlayback,
      k: togglePlayback,
      f: toggleFullscreen,
      ArrowRight: () => {
        video.currentTime = Math.min(video.duration || 0, video.currentTime + 5);
      },
      ArrowLeft: () => {
        video.currentTime = Math.max(0, video.currentTime - 5);
      },
    };
    const action = keys[event.key];
    if (!action) return;
    event.preventDefault();
    action();
    wake();
  });

  ["play", "pause", "ended"].forEach((name) => video.addEventListener(name, syncPlayback));
  video.addEventListener("play", wake);
  video.addEventListener("pause", () => player.classList.add("is-active"));
  ["timeupdate", "loadedmetadata", "durationchange"].forEach((name) =>
    video.addEventListener(name, syncProgress),
  );
  video.addEventListener("waiting", () => player.classList.add("is-loading"));
  ["playing", "canplay", "pause"].forEach((name) =>
    video.addEventListener(name, () => player.classList.remove("is-loading")),
  );

  document.addEventListener("fullscreenchange", syncFullscreen);
  document.addEventListener("webkitfullscreenchange", syncFullscreen);

  syncPlayback();
  syncFullscreen();
  syncProgress();

  return {
    video,
    wantsPlayback: () => !userPaused && !reducedMotion.matches,
    isFullscreen: () => fullscreenElement() === player,
  };
}

function startGameVideos() {
  if (!gameVideos.length) return;
  const players = new Map(gameVideos.map((video) => [video, buildPlayer(video)]));

  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        const state = players.get(target);
        if (isIntersecting) {
          if (state.wantsPlayback()) target.play().catch(() => {});
        } else if (!state.isFullscreen()) {
          target.pause();
        }
      });
    },
    { threshold: 0.25, rootMargin: "0px 200px 0px 200px" },
  );
  gameVideos.forEach((video) => observer.observe(video));
}

startGameVideos();

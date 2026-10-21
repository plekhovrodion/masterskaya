const heroVideo = document.querySelector("video.hero__photo-img");
const heroSoundButton = document.querySelector("[data-hero-sound]");

function startHeroVideo() {
  if (!heroVideo) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const label = heroSoundButton && heroSoundButton.querySelector(".hero__sound-label");

  const syncSound = () => {
    if (!heroSoundButton) return;
    const soundOn = !heroVideo.muted && !heroVideo.paused;
    heroSoundButton.setAttribute("aria-pressed", String(soundOn));
    const text = soundOn ? "Выключить звук" : "Включить звук";
    heroSoundButton.setAttribute("aria-label", text);
    if (label) label.textContent = text;
  };

  if (reducedMotion.matches) {
    heroVideo.removeAttribute("autoplay");
    heroVideo.pause();
  }

  if (heroSoundButton) {
    heroSoundButton.addEventListener("click", () => {
      if (heroVideo.paused) {
        heroVideo.muted = false;
        heroVideo.play().catch(() => {});
      } else {
        heroVideo.muted = !heroVideo.muted;
      }
      syncSound();
    });
  }

  const fullscreenButton = document.querySelector("[data-hero-fullscreen]");
  const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;
  let enteredByButton = false;

  if (fullscreenButton) {
    fullscreenButton.addEventListener("click", () => {
      enteredByButton = true;
      heroVideo.muted = false;
      heroVideo.controls = true;
      heroVideo.play().catch(() => {});
      const request = heroVideo.requestFullscreen
        ? heroVideo.requestFullscreen()
        : heroVideo.webkitRequestFullscreen
          ? heroVideo.webkitRequestFullscreen()
          : heroVideo.webkitEnterFullscreen && heroVideo.webkitEnterFullscreen();
      if (request && request.catch) request.catch(() => {});
    });
  }

  const leaveFullscreen = () => {
    if (fullscreenElement() || !enteredByButton) return;
    enteredByButton = false;
    heroVideo.controls = false;
    heroVideo.muted = true;
    syncSound();
  };
  document.addEventListener("fullscreenchange", leaveFullscreen);
  document.addEventListener("webkitfullscreenchange", leaveFullscreen);
  heroVideo.addEventListener("webkitendfullscreen", leaveFullscreen);

  ["volumechange", "play", "pause"].forEach((name) => heroVideo.addEventListener(name, syncSound));

  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          heroVideo.play().catch(() => {});
        } else {
          heroVideo.pause();
          heroVideo.muted = true;
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(heroVideo);
  }

  syncSound();
}

startHeroVideo();

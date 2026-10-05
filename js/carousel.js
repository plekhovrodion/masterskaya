const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function startGamesScroll() {
  const section = document.querySelector(".games");
  const pin = document.querySelector(".games__pin");
  const track = document.querySelector("[data-games-track]");
  if (!section || !pin || !track) return;

  const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

  const pinAnchor = () => section.offsetTop + parseFloat(getComputedStyle(section).paddingTop);

  const scrolled = () => {
    const travel = distance();
    return Math.min(Math.max(window.scrollY - pinAnchor(), 0), travel);
  };

  const render = () => {
    track.style.transform = `translate3d(${-scrolled()}px, 0, 0)`;
  };

  const measure = () => {
    if (reducedMotion.matches) {
      section.style.height = "";
      track.style.transform = "";
      return;
    }
    const paddingTop = parseFloat(getComputedStyle(section).paddingTop);
    section.style.height = `${paddingTop + pin.offsetHeight + distance()}px`;
    render();
  };

  measure();
  window.addEventListener("scroll", () => {
    if (reducedMotion.matches) return;
    render();
  }, { passive: true });
  window.addEventListener("resize", measure);
  reducedMotion.addEventListener("change", measure);
  track.querySelectorAll("img").forEach((img) => {
    if (!img.complete) img.addEventListener("load", measure, { once: true });
  });
  if (document.fonts) document.fonts.ready.then(measure);
}

startGamesScroll();

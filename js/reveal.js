const revealMotion = window.matchMedia("(prefers-reduced-motion: no-preference)");

const REVEAL_GROUPS = [
  { selector: ".why .section-title", kind: "up" },
  { selector: ".why-card", kind: "up", step: 0.12 },
  { selector: ".skills .section-title", kind: "up" },
  { selector: ".skills .blob", kind: "pop", step: 0.1, group: ".skills__scene" },
  { selector: ".offer__heading", kind: "up" },
  { selector: ".offer .btn", kind: "up", delay: 0.15 },
  { selector: ".offer__cloud--left", kind: "from-left" },
  { selector: ".offer__cloud--right", kind: "from-right" },
  { selector: ".footer__row", kind: "up" },
  { selector: ".mascot", kind: "rise" },
];

function startReveal() {
  if (!revealMotion.matches || !("IntersectionObserver" in window)) {
    document.documentElement.classList.remove("js");
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
  );

  REVEAL_GROUPS.forEach(({ selector, kind, step = 0, delay = 0, group }) => {
    document.querySelectorAll(selector).forEach((el, index) => {
      el.dataset.reveal = kind;
      el.style.setProperty("--d", `${delay + index * step}s`);
      const trigger = group ? el.closest(group) : el;
      if (trigger) observer.observe(trigger);
    });
  });
}

startReveal();

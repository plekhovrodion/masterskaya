const stage = document.querySelector(".cast-scale");
const cast = document.querySelector(".hero__cast");
const heroReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const CRUISE_SPEED = 43;
const SETTLE_RATE = 2.5;

function startHeroMarquee() {
  if (!stage || !cast || heroReducedMotion.matches) return;

  const originals = [...cast.querySelectorAll(".hero-slot")];
  originals.forEach((slot) => {
    slot.dataset.set = "0";
  });

  const measurePeriod = () => {
    const gap = parseFloat(getComputedStyle(cast).columnGap) || 0;
    return originals.reduce((sum, slot) => sum + slot.offsetWidth + gap, 0);
  };

  let period = measurePeriod();

  const fill = () => {
    period = measurePeriod();
    const needed = Math.ceil(window.innerWidth / period) + 1;
    let sets = cast.children.length / originals.length;
    while (sets < needed) {
      originals.forEach((slot) => {
        const copy = slot.cloneNode(true);
        copy.dataset.set = String(sets);
        cast.append(copy);
      });
      sets += 1;
    }
  };

  let offset = 0;
  let velocity = CRUISE_SPEED;
  let hovering = false;
  let dragging = false;
  let lastX = 0;
  let lastTime = 0;
  let dragVelocity = 0;
  let frameTime = performance.now();

  const render = () => {
    const wrapped = ((offset % period) + period) % period;
    cast.style.transform = `translate3d(${wrapped}px, 0, 0)`;
  };

  const tick = (now) => {
    const dt = Math.min((now - frameTime) / 1000, 0.05);
    frameTime = now;
    if (!dragging) {
      const target = hovering ? 0 : CRUISE_SPEED;
      velocity += (target - velocity) * (1 - Math.exp(-SETTLE_RATE * dt));
      offset += velocity * dt;
    }
    render();
    requestAnimationFrame(tick);
  };

  stage.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragging = true;
    lastX = event.clientX;
    lastTime = performance.now();
    dragVelocity = 0;
    stage.classList.add("is-dragging");
    stage.setPointerCapture(event.pointerId);
  });

  stage.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = event.clientX - lastX;
    const dt = Math.max((now - lastTime) / 1000, 0.001);
    offset += dx;
    dragVelocity = dx / dt;
    lastX = event.clientX;
    lastTime = now;
  });

  const release = (event) => {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove("is-dragging");
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    const idle = performance.now() - lastTime > 80;
    velocity = idle ? 0 : Math.max(-2000, Math.min(2000, dragVelocity));
  };

  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);

  stage.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") hovering = true;
  });
  stage.addEventListener("pointerleave", () => {
    hovering = false;
  });

  fill();
  window.addEventListener("resize", fill);
  requestAnimationFrame(tick);
}

startHeroMarquee();

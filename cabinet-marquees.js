(() => {
  const marquees = [...document.querySelectorAll(".cabinet-marquee")];
  if (!marquees.length) return;

  const motion = document.createElement("button");
  motion.type = "button";
  motion.className = "marquee-motion-toggle";
  motion.textContent = "Pause title motion";
  motion.setAttribute("aria-pressed", "false");
  document.querySelector(".library-options")?.append(motion);
  motion.addEventListener("click", () => {
    const paused = document.body.classList.toggle("marquees-paused");
    motion.setAttribute("aria-pressed", String(paused));
    motion.textContent = paused ? "Resume title motion" : "Pause title motion";
  });
  function syncVisibility() {
    document.body.classList.toggle("marquees-hidden", document.hidden);
  }
  document.addEventListener("visibilitychange", syncVisibility);
  syncVisibility();

  for (const marquee of marquees) {
    const title = marquee.getAttribute("aria-label") || marquee.textContent.trim();
    const window = document.createElement("span");
    window.className = "marquee-window";
    window.setAttribute("aria-hidden", "true");
    const track = document.createElement("span");
    track.className = "marquee-track";
    for (let copy = 0; copy < 2; copy += 1) {
      const text = document.createElement("span");
      text.textContent = title;
      track.append(text);
    }
    window.append(track);
    marquee.setAttribute("aria-label", title);
    marquee.replaceChildren(window);
  }

  function measure(marquee) {
    const window = marquee.firstElementChild;
    const track = window.firstElementChild;
    const textWidth = track.firstElementChild.getBoundingClientRect().width;
    const available = window.clientWidth;
    const overflows = available > 0 && textWidth > available + 1;
    marquee.classList.toggle("is-scrolling", overflows);
    if (overflows) {
      const distance = textWidth + parseFloat(getComputedStyle(track).columnGap);
      marquee.style.setProperty("--marquee-distance", distance + "px");
      marquee.style.setProperty("--marquee-duration", Math.max(8, distance / 22) + "s");
    }
  }

  const resize = new ResizeObserver(entries => {
    for (const { target } of entries) measure(target);
  });
  const visible = new IntersectionObserver(entries => {
    for (const entry of entries) entry.target.classList.toggle("is-visible", entry.isIntersecting);
  });
  for (const marquee of marquees) {
    resize.observe(marquee);
    visible.observe(marquee);
  }
  document.fonts.ready.then(() => marquees.forEach(measure));
})();

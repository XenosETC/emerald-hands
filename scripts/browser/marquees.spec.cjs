const { test, expect } = require("@playwright/test");

test("long cabinet titles can pause through filtering, resizing and motion preference changes", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");
  const title = page.locator('[data-cabinet="galaxy"] .cabinet-marquee');
  await title.scrollIntoViewIfNeeded();
  await expect(title).toHaveClass(/is-scrolling/);
  await expect(title).toHaveClass(/is-visible/);
  const track = title.locator(".marquee-track");
  const playState = () => track.evaluate(node => getComputedStyle(node).animationPlayState);
  await expect.poll(playState).toBe("running");

  const pause = page.getByRole("button", { name: "Pause title motion" });
  await pause.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Resume title motion" })).toHaveAttribute("aria-pressed", "true");
  await title.scrollIntoViewIfNeeded();
  await expect.poll(playState).toBe("paused");

  await page.getByRole("searchbox", { name: "Search games" }).fill("galactic heroes");
  await page.setViewportSize({ width: 390, height: 844 });
  // System font metrics differ between Windows and Linux. The title should
  // scroll exactly when its rendered text exceeds the available machine screen.
  await expect.poll(() => title.evaluate(node => {
    const window = node.querySelector(".marquee-window");
    const textWidth = node.querySelector(".marquee-track > span").getBoundingClientRect().width;
    const overflows = window.clientWidth > 0 && textWidth > window.clientWidth + 1;
    return node.classList.contains("is-scrolling") === overflows;
  })).toBe(true);
  await page.setViewportSize({ width: 320, height: 720 });
  await expect(title).toHaveClass(/is-scrolling/);
  await title.scrollIntoViewIfNeeded();
  await expect.poll(playState).toBe("paused");
  await expect(title).toHaveAccessibleName("Emerald Galactic Heroes");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByRole("button", { name: "Resume title motion" })).toBeHidden();
  await expect.poll(() => track.evaluate(node => getComputedStyle(node).animationName)).toBe("none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const resume = page.getByRole("button", { name: "Resume title motion" });
  await expect(resume).toHaveAttribute("aria-pressed", "true");
  await expect.poll(playState).toBe("paused");
  await resume.click();
  await title.scrollIntoViewIfNeeded();
  await expect.poll(playState).toBe("running");
});

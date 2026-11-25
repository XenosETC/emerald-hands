const { test, expect } = require("@playwright/test");

const petKey = "emerald-arcade-pets-v1";
async function seedSanctuary(page) {
  await page.addInitScript(() => {
    if (localStorage.getItem("sanctuary-browser-seeded")) return;
    localStorage.setItem("sanctuary-browser-seeded", "1");
    localStorage.setItem("emerald-arcade-v1", JSON.stringify({
      schemaVersion: 3, wallet: { arcadeShards: 1000, lifetimeShards: 1000 },
    }));
    localStorage.setItem("emerald-arcade-pets-v1", JSON.stringify({
      schemaVersion: 2, selected: "pepe", unlocked: ["pepe", "wojak", "rumble-croakhound"],
      inventory: { bambooShoots: 2, bambooSticks: 1 },
    }));
  });
}

async function expectFits(page, viewport) {
  expect(await page.evaluate(() => ({
    width: document.documentElement.scrollWidth <= innerWidth,
    height: document.documentElement.scrollHeight <= innerHeight,
    top: scrollY,
  }))).toEqual({ width: true, height: true, top: 0 });
  for (const selector of [".sanctuary", ".pet-actions", "#openShop", "#openRoster"]) {
    const box = await page.locator(selector).boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThan(20);
    expect(box.height).toBeGreaterThan(20);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
  }
}

for (const viewport of [
  { width: 320, height: 568 }, { width: 390, height: 844 },
  { width: 844, height: 390 }, { width: 1440, height: 900 },
]) {
  test(`living sanctuary stays in one screen at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await seedSanctuary(page);
    await page.goto("/etc-pets.html");
    await expectFits(page, viewport);
    await expect(page.locator("#sanctuaryResidents button")).toHaveCount(3);
    await expect(page.locator(".pet-aura-ring")).toHaveCount(0);
    await expect(page.locator(".resident-name")).toHaveCount(0);
    await expect.poll(() => page.locator("main img").evaluateAll(nodes => nodes.every(node => node.complete && node.naturalWidth > 0))).toBe(true);
    for (const control of ["#openRoster", "#openShop", "#openDetails"]) {
      await page.locator(control).click();
      await expect(page.locator("#sanctuaryPanel")).toBeVisible();
      expect(await page.locator("#sanctuaryPanel").evaluate(node => {
        const box = node.getBoundingClientRect();
        return box.x >= 0 && box.y >= 0 && box.right <= innerWidth + 1 && box.bottom <= innerHeight + 1;
      })).toBe(true);
      await page.locator("#closePanel").click();
      await expect(page.locator(control)).toBeFocused();
      await expectFits(page, viewport);
    }
  });
}

test("unreadable pet saves explain blocked shop actions and recover without erasing ownership", async ({ page }) => {
  await seedSanctuary(page);
  await page.goto("/etc-pets.html");
  const original = await page.evaluate(key => localStorage.getItem(key), petKey);
  await page.evaluate(key => {
    localStorage.setItem(key, "{broken");
    dispatchEvent(new StorageEvent("storage", { key }));
  }, petKey);
  await page.locator("#openShop").click();
  await expect(page.locator("#panelStatus")).toContainText("cannot be read");
  await expect(page.locator('button[data-habitat="moonlit"]')).toBeDisabled();
  expect(await page.evaluate(key => localStorage.getItem(key), petKey)).toBe("{broken");
  expect(await page.evaluate(() => EmeraldArcade.arcadeShardBalance())).toBe(1000);
  await page.evaluate(({ key, original }) => {
    localStorage.setItem(key, original);
    dispatchEvent(new StorageEvent("storage", { key }));
  }, { key: petKey, original });
  await expect(page.locator("#panelStatus")).toContainText("readable again");
  await expect(page.locator('button[data-habitat="moonlit"]')).toBeEnabled();
  await expect(page.locator(".sanctuary-resident")).toHaveCount(3);
});

test("large supply counts keep the phone toolbar usable without losing exact accessible counts", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await seedSanctuary(page);
  await page.goto("/etc-pets.html");
  await page.evaluate(() => {
    const pets = ArcadePet.load();
    pets.inventory.bambooShoots = 123456789;
    pets.inventory.bambooSticks = 987654321;
    localStorage.setItem("emerald-arcade-pets-v1", JSON.stringify(pets));
    EmeraldArcade.awardArcadeShards(1000000000);
    dispatchEvent(new CustomEvent("arcadepet:change"));
  });
  await expectFits(page, { width: 320, height: 568 });
  await expect(page.locator("#bambooShootBalance")).toHaveAttribute("aria-label", /123,456,789 bamboo shoots/);
  await page.locator("#openShop").click();
  await expect(page.locator("#sanctuaryPanel")).toBeVisible();
});

test("habitat and decoration purchases persist and owned equipment is not charged twice", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedSanctuary(page);
  await page.goto("/etc-pets.html");
  await page.locator("#openShop").click();
  await page.locator('button[data-habitat="moonlit"]').click();
  await expect(page.locator(".sanctuary")).toHaveAttribute("data-habitat", "moonlit");
  await expect(page.locator(".sanctuary")).toHaveCSS("background-image", /habitat-moonlit-v1\.webp/);
  await expect.poll(() => page.evaluate(() => EmeraldArcade.arcadeShardBalance())).toBe(920);
  await page.locator('button[data-habitat="bamboo"]').click();
  await page.locator('button[data-habitat="moonlit"]').click();
  await expect.poll(() => page.evaluate(() => EmeraldArcade.arcadeShardBalance())).toBe(920);
  await page.locator('[data-decoration="lantern"]').click();
  await expect.poll(() => page.evaluate(() => EmeraldArcade.arcadeShardBalance())).toBe(900);
  await expect(page.locator('#sanctuaryDecorations [data-placed-decoration="lantern"]')).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".sanctuary")).toHaveAttribute("data-habitat", "moonlit");
  await expect.poll(() => page.evaluate(() => EmeraldArcade.arcadeShardBalance())).toBe(900);
  await expect(page.locator('#sanctuaryDecorations [data-placed-decoration="lantern"]')).toHaveCount(1);
  await page.locator("#openShop").click();
  await page.locator('button[data-habitat="bamboo"]').click();
  await page.locator('button[data-habitat="moonlit"]').click();
  await page.locator('[data-decoration="lantern"]').click();
  await page.locator('[data-decoration="lantern"]').click();
  await expect.poll(() => page.evaluate(() => EmeraldArcade.arcadeShardBalance())).toBe(900);
  await page.locator("#closePanel").click();
  await page.locator('#sanctuaryResidents button[data-resident="wojak"]').click();
  await expect(page.locator("#petName")).toHaveText("Pocket Wojak");
  const supplies = await page.evaluate(() => ArcadePet.load().inventory.bambooShoots);
  await page.locator('[data-action="feed"]').click();
  await expect.poll(() => page.evaluate(() => ArcadePet.load().inventory.bambooShoots)).toBe(supplies - 1);
  await page.reload();
  await expect(page.locator("#petName")).toHaveText("Pocket Wojak");
  expect(await page.evaluate(() => ArcadePet.load().inventory.bambooShoots)).toBe(supplies - 1);
});

test("unlocking a companion adds a separate resident without resetting the existing population", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seedSanctuary(page);
  await page.goto("/etc-pets.html");
  const positions = await page.locator(".sanctuary-resident").evaluateAll(nodes => nodes.map(node => ({
    id: node.dataset.resident, left: node.style.left, top: node.style.top,
  })));
  await page.locator("#openRoster").click();
  await page.locator('#petRoster button[data-pet="chad"]').click();
  await expect(page.locator("#sanctuaryResidents button")).toHaveCount(4);
  await expect.poll(() => page.evaluate(() => EmeraldArcade.arcadeShardBalance())).toBe(840);
  await expect(page.locator('#petRoster button[data-pet="chad"]')).toBeFocused();
  const updated = await page.locator(".sanctuary-resident").evaluateAll(nodes => nodes.map(node => ({
    id: node.dataset.resident, left: node.style.left, top: node.style.top,
  })));
  for (const previous of positions) expect(updated.find(item => item.id === previous.id)).toEqual(previous);
  const newcomer = updated.find(item => item.id === "chad");
  for (const previous of positions) {
    expect(Math.hypot(parseFloat(newcomer.left) - parseFloat(previous.left), parseFloat(newcomer.top) - parseFloat(previous.top))).toBeGreaterThan(1);
  }
  await page.locator("#closePanel").click();
  await expect(page.locator("#petName")).toHaveText("Mini Chad");
  await page.reload();
  await expect(page.locator("#sanctuaryResidents button")).toHaveCount(4);
});

test("owned residents wander without saving motion and stop for pause or reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await seedSanctuary(page);
  await page.goto("/etc-pets.html");
  const resident = page.locator('#sanctuaryResidents button[data-resident="pepe"]');
  await expect(resident).toBeVisible();
  const originalSave = await page.evaluate(key => localStorage.getItem(key), petKey);
  const origin = await resident.boundingBox();
  await expect.poll(async () => {
    const box = await resident.boundingBox();
    return Math.hypot(box.x - origin.x, box.y - origin.y);
  }, { timeout: 12000 }).toBeGreaterThan(3);
  expect(await page.evaluate(key => localStorage.getItem(key), petKey)).toBe(originalSave);
  await page.evaluate(() => EmeraldArcade.setPaused(true));
  await expect(page.locator("#sanctuaryResidents")).toHaveClass(/residents-paused/);
  await expect(resident.locator(".resident-sprite")).toHaveCSS("animation-play-state", "paused");
  const paused = await resident.boundingBox();
  await page.waitForTimeout(350);
  const stillPaused = await resident.boundingBox();
  expect(Math.hypot(stillPaused.x - paused.x, stillPaused.y - paused.y)).toBeLessThan(1);
  await page.evaluate(() => EmeraldArcade.setPaused(false));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(100);
  const reduced = await resident.boundingBox();
  await page.waitForTimeout(350);
  const stillReduced = await resident.boundingBox();
  expect(Math.hypot(stillReduced.x - reduced.x, stillReduced.y - reduced.y)).toBeLessThan(1);
  expect(await resident.evaluate(node => ({
    border: getComputedStyle(node).borderTopWidth,
    image: getComputedStyle(node).backgroundImage,
  }))).toEqual({ border: "0px", image: "none" });
  expect(await page.evaluate(key => localStorage.getItem(key), petKey)).toBe(originalSave);
});

test("the complete owned roster fits and can be selected from the sanctuary", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seedSanctuary(page);
  await page.goto("/etc-pets.html");
  await page.evaluate(() => {
    const data = ArcadePet.load();
    data.unlocked = ArcadePet.pets.map(pet => pet.id);
    localStorage.setItem("emerald-arcade-pets-v1", JSON.stringify(data));
  });
  await page.reload();
  await expect(page.locator("#sanctuaryResidents button")).toHaveCount(11);
  await expectFits(page, { width: 320, height: 568 });
  const croakhound = page.locator('[data-resident="rumble-croakhound"]');
  await croakhound.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#petName")).toHaveText("Croakhound");
  await expect(croakhound).toHaveAttribute("aria-pressed", "true");
});

for (const viewport of [{ width: 320, height: 568 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
  test(`crowded sanctuary keeps moving pets clear of residents and furnishings at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await seedSanctuary(page);
    await page.goto("/etc-pets.html");
    await page.evaluate(async () => {
      const data = ArcadePet.load();
      data.unlocked = ArcadePet.pets.map(pet => pet.id);
      localStorage.setItem("emerald-arcade-pets-v1", JSON.stringify(data));
      dispatchEvent(new CustomEvent("arcadepet:change"));
      for (const id of ["lantern", "pond", "crystals"]) await ArcadePet.perform("decoration", id);
    });
    await expect(page.locator(".sanctuary-resident")).toHaveCount(11);
    await expect.poll(() => page.locator("#sanctuaryDecorations img").evaluateAll(nodes => nodes.length === 3 && nodes.every(n => n.complete && n.naturalWidth > 0))).toBe(true);
    const saved = await page.evaluate(key => localStorage.getItem(key), petKey);
    const observation = await page.evaluate(async () => {
      const stage = document.querySelector("#sanctuaryResidents");
      let minPetClearance = Infinity, minPropClearance = Infinity, samples = 0;
      const origins = new Map(); let mostTravel = 0;
      for (let step = 0; step < 90; step++) {
        const bounds = stage.getBoundingClientRect();
        const size = parseFloat(stage.style.getPropertyValue("--resident-size"));
        const pets = [...stage.querySelectorAll(".sanctuary-resident")].map(node => {
          const y = parseFloat(node.style.top) / 100;
          return { id: node.dataset.resident, x: parseFloat(node.style.left) / 100 * bounds.width,
            y: y * bounds.height, radius: size * (.48 + y * .62) * (node.dataset.resident === "rumble-croakhound" ? .3 : .2) };
        });
        const props = [...stage.querySelectorAll("[data-placed-decoration]")].map(node => {
          const box = node.getBoundingClientRect();
          return { left: box.left - bounds.left + box.width * .1 - 8, right: box.right - bounds.left - box.width * .1 + 8,
            top: box.top - bounds.top + box.height * (node.dataset.placedDecoration === "pond" ? .4 : .72) - 8,
            bottom: box.bottom - bounds.top + 8 };
        });
        for (let i = 0; i < pets.length; i++) {
          const pet = pets[i];
          if (!origins.has(pet.id)) origins.set(pet.id, pet);
          const start = origins.get(pet.id);
          mostTravel = Math.max(mostTravel, Math.hypot(pet.x - start.x, pet.y - start.y));
          for (let j = i + 1; j < pets.length; j++) minPetClearance = Math.min(minPetClearance,
            Math.hypot(pet.x - pets[j].x, (pet.y - pets[j].y) * 1.45) - pet.radius - pets[j].radius);
          for (const prop of props) minPropClearance = Math.min(minPropClearance,
            Math.hypot(Math.max(prop.left - pet.x, 0, pet.x - prop.right), Math.max(prop.top - pet.y, 0, pet.y - prop.bottom) * 1.45) - pet.radius);
        }
        samples++;
        await new Promise(resolve => setTimeout(resolve, 70));
      }
      return { minPetClearance, minPropClearance, samples, mostTravel };
    });
    expect(observation.samples).toBe(90);
    expect(observation.minPetClearance).toBeGreaterThan(4);
    expect(observation.minPropClearance).toBeGreaterThan(1);
    expect(observation.mostTravel).toBeGreaterThan(3);
    expect(await page.evaluate(key => localStorage.getItem(key), petKey)).toBe(saved);
  });
}

const { test, expect } = require("@playwright/test");

test.use({ reducedMotion: "reduce" });

const gamePath = game => `/pepe-${game}/index.html`;
const screenName = page => page.getByLabel("Screen name");

function expectPrivateCards(page) {
  return Promise.all([
    expect(page.locator(".your-seat .card[role=img]")).toHaveCount(2),
    expect(page.locator('.your-seat [aria-label="Face-down card"]')).toHaveCount(0),
    expect(page.locator('.seat:not(.your-seat) [aria-label="Face-down card"]')).toHaveCount(2),
    expect(page.locator(".seat:not(.your-seat) .card[role=img]")).toHaveCount(2),
  ]);
}

test("Poker invite, mid-hand reconnect, and folded-card privacy", async ({ browser, context, page: host, baseURL }) => {
  const guestContext = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    reducedMotion: "reduce",
  });
  try {
    const guest = await guestContext.newPage();
    await host.goto(gamePath("poker"));
    await screenName(host).fill("Playtest host");
    await host.getByRole("button", { name: "Create table", exact: true }).click();
    await host.getByRole("button", { name: "Share invite" }).click();
    const link = new URL(await host.locator("#invite-link").inputValue());
    expect(link.origin).toBe(new URL(baseURL).origin);
    expect(link.pathname).toBe(gamePath("poker"));
    const roomURL = link.pathname + link.search;
    await host.getByRole("button", { name: "Done", exact: true }).click();

    await guest.goto(roomURL);
    await screenName(guest).fill("Playtest guest");
    await guest.getByRole("button", { name: "Join table", exact: true }).tap();
    await host.getByRole("button", { name: "Deal hand", exact: true }).click();
    await Promise.all([expectPrivateCards(host), expectPrivateCards(guest)]);

    await host.getByRole("button", { name: "Call 10", exact: true }).click();
    await guest.getByRole("button", { name: "Check", exact: true }).tap();
    await expect(guest.locator("#board img")).toHaveCount(3);
    await host.close();

    const returningHost = await context.newPage();
    await returningHost.goto(roomURL);
    await expect(returningHost.locator("#table-connection")).toContainText("Seat restored");
    await expect(returningHost.locator("#board img")).toHaveCount(3);
    await expectPrivateCards(returningHost);

    await guest.getByRole("button", { name: "Fold", exact: true }).tap();
    await returningHost.getByRole("button", { name: "Review last hand", exact: true }).click();
    await expect(returningHost.locator("#recap-board img")).toHaveCount(3);
    await expect(returningHost.locator("#recap-players img")).toHaveCount(0);
  } finally {
    await guestContext.close();
  }
});

test("Chess clears keyboard selection and reviews a restored local match", async ({ page }) => {
  await page.goto(gamePath("chess"));
  const square = name => page.locator(`[data-square="${name}"]`);
  await square("e2").click();
  await expect(square("e4")).toHaveAccessibleName("e4, empty, legal destination");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Escape");
  await expect(square("e3")).toBeFocused();
  await expect(square("e2")).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".board .legal")).toHaveCount(0);

  await square("e2").click();
  await square("e4").click();
  await expect(page.locator("#match-status")).toHaveText("Black to move.");
  await page.reload();
  await expect(square("e4")).toHaveAccessibleName("e4, White pawn");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(square("e2")).toHaveAccessibleName("e2, White pawn");
  await page.getByRole("button", { name: "Return to live", exact: true }).click();
  await expect(square("e4")).toHaveAccessibleName("e4, White pawn");
});

test.describe("Checkers phone", () => {
  test.use({ viewport: { width: 320, height: 568 }, hasTouch: true });

  test("forces a capture and keeps the reviewed board visible", async ({ page }) => {
    await page.goto(gamePath("checkers"));
    await page.locator("#mode").selectOption("local");
    const square = (name, description) => page.locator("#board")
      .getByRole("button", { name: new RegExp(`^${name}.*${description}`, "i") });
    await square("c3", "can move").tap();
    await square("d4", "legal destination").tap();
    await square("b6", "can move").tap();
    await square("c5", "legal destination").tap();
    await expect(page.locator("#board")).toHaveAttribute("data-forced-capture", "true");
    await square("d4", "can move").tap();
    await expect(page.locator("#board .target")).toHaveCount(1);
    await square("b6", "capture destination").tap();
    await expect(square("b6", "Emerald piece")).toBeVisible();
    await expect(square("c5", "empty")).toBeVisible();

    await page.locator("#move-log button").first().tap();
    await expect(page.getByRole("group", { name: "Review positions" })).toBeVisible();
    await expect(page.locator("#board")).toBeInViewport({ ratio: 1 });
    await expect(square("d4", "Emerald piece")).toBeVisible();
    await page.getByRole("button", { name: "Return to game" }).tap();
    await expect(square("b6", "Emerald piece")).toBeVisible();
  });
});

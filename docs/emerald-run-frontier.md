# Emerald Run: Corrupt Frontier and Volcanic Forge

Act Two still completes at world coordinate 33,600. The new frontier follows: Corrupt Frontier spans 33,600–42,000 and Volcanic Forge spans 42,000–50,400. Each has 8,400 units of road before Beyond the Forge becomes endless. The route HUD switches to a separate frontier progress meter without changing Act Two completion. Results name the actual region reached.

Two new generated backgrounds retain quiet lower thirds, so the existing road, hazards and collectibles stay readable. Violet dust and amber embers use a bounded particle count. The old four horizontal disco strokes are replaced by eight orbiting colored motes and rotating square facets with smoothly changing hues. Reduced motion fixes their position/color and disables particle motion; shield and magnet timers retain their gameplay duration.

Power pickups now follow authored regular intervals: gold statue every 8,400 units, crown and emerald statue every 16,800. Their original first appearances remain 1,600 / 5,200 / 13,200. Combined power pickups stay at least 3,200 units apart. Existing clear approaches and landing runways are preserved, as are protected rides, speed caps, optional bells and seeded retry behavior. These are deliberate spacing decisions; long-run balance still needs player feedback.

Sources: `pepecoin-route.js`, `pepecoin-run.js`, two WebPs and exact prompts in `assets/pepecoin-run/frontier-prompts-v1.json`. Focused tests cover equal spans, pickup cadence, pause/reset, bounded motes and reduced motion; browser checks load both real assets at 390px and 1440px and exercise frontier transitions, collision results and retry.

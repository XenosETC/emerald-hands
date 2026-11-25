(function () {
  "use strict";

  // Transparent sprite cells have different amounts of space below the feet.
  // Align the visible ground contact, rather than the bottom of the image cell.
  const footPadding = {
    pepe: [11.7, 15.3], wojak: [10.4, 14.9], chad: [6.3, 8.6], bogdanoff: [7.9, 11.7],
    "big-chain-pepe": [4.3, 14], "mecha-pepe": [5, 14.4], "berserk-tadpole": [6.3, 14.6], "fallen-crystal": [4.5, 14],
    "rumble-monkey": [8.1, 8.1], "rumble-croakhound": [8.1, 8.1], "rumble-frenix": [8.1, 8.1],
  };

  // Scene coordinates are presentation only; care, ownership and saves stay in ArcadePet.
  function create(stage, { onSelect = () => {} } = {}) {
    const residents = new Map();
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let selected;
    let frame;
    let lastTime;
    let destroyed = false;
    let packingPopulation = null;
    let fittedSize = Infinity;
    let layoutKey;
    let seed = 1907;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    function syncPause() {
      stage.classList.toggle("residents-paused", document.hidden || preference.matches || Boolean(window.EmeraldArcade?.isPaused?.()));
      lastTime = undefined;
    }
    window.addEventListener("emeraldarcade:pause", syncPause);
    document.addEventListener("visibilitychange", syncPause);
    preference.addEventListener("change", syncPause);
    syncPause();

    function draw(resident) {
      const depth = .48 + resident.y * .62;
      resident.button.style.left = `${resident.x * 100}%`;
      resident.button.style.top = `${resident.y * 100}%`;
      resident.button.style.zIndex = String(Math.round(resident.y * 100));
      resident.button.style.setProperty("--resident-depth", depth.toFixed(3));
      resident.button.style.setProperty("--resident-facing", resident.facing);
    }

    function obstacles() {
      const bounds = stage.getBoundingClientRect();
      const props = [...stage.querySelectorAll("[data-placed-decoration]")].map(node => {
        const rect = node.getBoundingClientRect();
        const groundFraction = node.dataset.placedDecoration === "pond" ? .4 : .72;
        return { left: rect.left - bounds.left + rect.width * .1 - 8,
          right: rect.right - bounds.left - rect.width * .1 + 8,
          top: rect.top - bounds.top + rect.height * groundFraction - 8,
          bottom: rect.bottom - bounds.top + 8 };
      });
      const scene = stage.closest(".sanctuary");
      if (scene?.dataset.habitat === "bamboo") {
        // Furniture painted into the original Den also occupies floor space.
        // Map source-image footprints through the same cover crop as the CSS background.
        const room = scene.getBoundingClientRect();
        const scale = Math.max(room.width / 1672, room.height / 941);
        const offsetX = room.left - bounds.left + (room.width - 1672 * scale) * .5;
        const offsetY = room.top - bounds.top + (room.height - 941 * scale) * .58;
        for (const [left, top, right, bottom] of [
          [0, 0, 1672, 580], // Back wall, above the floor.
          [0, 560, 415, 730], // Pet bed.
          [430, 550, 605, 640], // Feeding station.
          [930, 550, 1200, 640], // Training platform.
          [1250, 610, 1672, 820], // Toy chest.
        ]) props.push({ left: offsetX + left * scale, right: offsetX + right * scale,
          top: offsetY + top * scale, bottom: offsetY + bottom * scale });
      }
      return props;
    }

    function footprint(resident, point = resident) {
      const broad = resident.button.dataset.resident === "rumble-croakhound" ? .3 : .2;
      return parseFloat(stage.style.getPropertyValue("--resident-size")) * (.48 + point.y * .62) * broad;
    }

    function clearGround(point, props, resident) {
      const x = point.x * stage.clientWidth, y = point.y * stage.clientHeight;
      const radius = footprint(resident, point) + 3;
      if (props.some(rect => {
        const dx = Math.max(rect.left - x, 0, x - rect.right);
        const dy = Math.max(rect.top - y, 0, y - rect.bottom) * 1.45;
        return Math.hypot(dx, dy) < radius;
      })) return false;
      return !(packingPopulation || [...residents.values()]).some(other => other !== resident &&
        Math.hypot((other.x - point.x) * stage.clientWidth, (other.y - point.y) * stage.clientHeight * 1.45)
          < radius + footprint(other) + 3);
    }

    function findSpace(preferred, resident, props) {
      if (clearGround(preferred, props, resident)) return preferred;
      let best = null, bestDistance = Infinity;
      // A deterministic grid guarantees a useful fallback in a crowded phone habitat.
      for (let row = 0; row < 12; row++) {
        for (let column = 0; column < 25; column++) {
          const candidate = { x: .09 + column * .82 / 24, y: .46 + row * .52 / 11 };
          if (!clearGround(candidate, props, resident)) continue;
          const distance = Math.hypot((candidate.x - preferred.x) * stage.clientWidth,
            (candidate.y - preferred.y) * stage.clientHeight);
          if (distance < bestDistance) { best = candidate; bestDistance = distance; }
        }
      }
      return best;
    }

    function repairPopulation() {
      const props = obstacles();
      for (const resident of residents.values()) {
        const spot = findSpace(resident, resident, props);
        if (!spot || spot === resident) continue;
        resident.x = spot.x; resident.y = spot.y; resident.walk = null;
        resident.button.classList.remove("is-walking");
        draw(resident);
      }
      if ([...residents.values()].every(resident => clearGround(resident, props, resident))) return;
      // A fully furnished small room can need a fresh packing, rather than moving
      // one blocked pet into a gap that does not exist. Compact only as needed.
      const population = [...residents.values()].sort((a, b) => footprint(b) - footprint(a));
      const startingSize = parseFloat(stage.style.getPropertyValue("--resident-size"));
      for (let trialSize = startingSize; trialSize >= 44; trialSize = Math.max(44, trialSize - 4)) {
        stage.style.setProperty("--resident-size", `${trialSize}px`);
        packingPopulation = [];
        let fits = true;
        for (const resident of population) {
          const spot = findSpace({ x: .12, y: .98 }, resident, props);
          if (!spot) { fits = false; break; }
          resident.x = spot.x; resident.y = spot.y; resident.walk = null;
          resident.button.classList.remove("is-walking");
          packingPopulation.push(resident);
        }
        packingPopulation = null;
        if (fits) { fittedSize = trialSize; break; }
        if (trialSize === 44) break;
      }
      for (const resident of population) draw(resident);
    }

    function chooseWalk(resident) {
      const width = Math.max(1, stage.clientWidth), height = Math.max(1, stage.clientHeight);
      const margin = Math.min(.24, Math.max(.09, 42 / width));
      const props = obstacles();
      let target;
      for (let attempt = 0; attempt < 24; attempt++) {
        target = attempt < 12 ? {
          x: Math.max(margin, Math.min(1 - margin, resident.x + (random() - .5) * .4)),
          y: Math.max(.55, Math.min(.98, resident.y + (random() - .5) * .24)),
        } : { x: margin + random() * (1 - 2 * margin), y: .55 + random() * .43 };
        const samples = Math.max(2, Math.ceil(Math.hypot((target.x - resident.x) * width, (target.y - resident.y) * height) / 20));
        const clearPath = Array.from({ length: samples }, (_, index) => {
          const fraction = (index + 1) / samples;
          return clearGround({ x: resident.x + (target.x - resident.x) * fraction, y: resident.y + (target.y - resident.y) * fraction }, props, resident);
        }).every(Boolean);
        if (clearPath) break;
        target = null;
      }
      if (!target) { resident.idle = 1; return; }
      const distance = Math.hypot((target.x - resident.x) * width, (target.y - resident.y) * height);
      resident.walk = {
        fromX: resident.x, fromY: resident.y, ...target,
        elapsed: 0, blocked: 0, duration: Math.max(1.5, distance / (18 + random() * 14)),
      };
      resident.facing = target.x < resident.x ? -1 : 1;
      resident.button.classList.add("is-walking");
    }

    function tick(time) {
      if (destroyed) return;
      const dt = lastTime === undefined ? 0 : Math.min(.05, (time - lastTime) / 1000);
      lastTime = time;
      const paused = document.hidden || preference.matches || Boolean(window.EmeraldArcade?.isPaused?.());
      stage.classList.toggle("residents-paused", paused);
      if (!paused) {
        const props = obstacles();
        for (const resident of residents.values()) {
          if (resident.button === document.activeElement || resident.button.matches(":hover")) continue;
          if (resident.walk) {
            const walk = resident.walk;
            const elapsed = Math.min(walk.duration, walk.elapsed + dt);
            const progress = elapsed / walk.duration;
            const ease = progress * progress * (3 - 2 * progress);
            const next = { x: walk.fromX + (walk.x - walk.fromX) * ease,
              y: walk.fromY + (walk.y - walk.fromY) * ease };
            if (!clearGround(next, props, resident)) {
              walk.blocked += dt;
              if (walk.blocked > .35) {
                resident.walk = null; resident.idle = .3 + random() * .7;
                resident.button.classList.remove("is-walking");
              }
              continue;
            }
            walk.elapsed = elapsed; walk.blocked = 0;
            resident.x = next.x; resident.y = next.y;
            if (progress === 1) {
              resident.walk = null;
              resident.idle = 1.6 + random() * 4.4;
              resident.button.classList.remove("is-walking");
            }
            draw(resident);
          } else {
            resident.idle -= dt;
            if (resident.idle <= 0) chooseWalk(resident);
          }
        }
      }
      frame = window.requestAnimationFrame(tick);
    }

    function update(data, { excited = false } = {}) {
      if (destroyed) return;
      selected = data.selected;
      const owned = window.ArcadePet.pets.filter(pet => data.unlocked.includes(pet.id));
      const nextLayoutKey = `${stage.closest(".sanctuary")?.dataset.habitat}|${data.sanctuary?.decorations.join(",")}|${owned.length}`;
      if (layoutKey !== nextLayoutKey) { layoutKey = nextLayoutKey; fittedSize = Infinity; }
      stage.style.setProperty("--resident-size", `${Math.min(fittedSize, Math.max(54, Math.min(122, stage.clientWidth / Math.max(3.6, Math.sqrt(owned.length) * 1.45))))}px`);
      for (const [id, resident] of residents) {
        if (!owned.some(pet => pet.id === id)) {
          resident.button.remove();
          residents.delete(id);
        }
      }
      const initialPopulation = residents.size === 0;
      const props = obstacles();
      owned.forEach((pet, index) => {
        let resident = residents.get(pet.id);
        if (!resident) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "sanctuary-resident";
          button.dataset.resident = pet.id;
          button.setAttribute("aria-label", `Select ${pet.name}`);
          const shadow = document.createElement("span");
          shadow.className = "resident-shadow";
          const sprite = document.createElement("span");
          sprite.className = "resident-sprite";
          sprite.style.backgroundImage = `url("${pet.sheet}")`;
          button.append(shadow, sprite);
          button.addEventListener("click", () => onSelect(pet.id));
          stage.append(button);
          const columns = Math.min(4, owned.length);
          const rows = Math.ceil(owned.length / columns);
          let spawn = { x: (index % columns + 1) / (columns + 1),
            y: .6 + Math.floor(index / columns) * (.34 / Math.max(1, rows - 1)) };
          resident = { button, sprite, ...spawn,
            facing: index % 2 ? -1 : 1, idle: .5 + random() * 4, walk: null };
          if (!initialPopulation) {
            // New residents occupy a free space without shifting the existing population.
            const spot = findSpace(spawn, resident, props);
            if (spot) { resident.x = spot.x; resident.y = spot.y; }
          }
          residents.set(pet.id, resident);
          draw(resident);
        }
        resident.button.setAttribute("aria-pressed", String(pet.id === selected));
        resident.button.classList.toggle("is-selected", pet.id === selected);
        resident.button.classList.toggle("is-celebrating", excited && pet.id === selected);
        resident.sprite.style.setProperty("--foot-pad", `${footPadding[pet.id]?.[excited && pet.id === selected ? 1 : 0] || 0}%`);
        resident.sprite.style.backgroundPosition = window.ArcadePet.spritePosition(pet.id, excited && pet.id === selected);
      });
      // Prop placement and viewport changes must also respect stationary pets.
      repairPopulation();
    }

    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(() => {
      fittedSize = Infinity;
      stage.style.setProperty("--resident-size", `${Math.max(54, Math.min(122, stage.clientWidth / Math.max(3.6, Math.sqrt(residents.size) * 1.45)))}px`);
      repairPopulation();
    }) : null;
    observer?.observe(stage);
    frame = window.requestAnimationFrame(tick);
    return {
      update,
      destroy() {
        destroyed = true;
        window.cancelAnimationFrame(frame);
        observer?.disconnect();
        window.removeEventListener("emeraldarcade:pause", syncPause);
        document.removeEventListener("visibilitychange", syncPause);
        preference.removeEventListener("change", syncPause);
        for (const resident of residents.values()) resident.button.remove();
        residents.clear();
      },
    };
  }

  window.PetSanctuary = { create };
})();

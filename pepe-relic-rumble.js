(function () {
  const canvas = document.querySelector("#rumbleCanvas");
  const ctx = canvas.getContext("2d");
  const startButton = document.querySelector("#startButton");
  const overlay = document.querySelector("#rumbleOverlay");
  const overlayTitle = document.querySelector("#overlayTitle");
  const overlayText = document.querySelector("#overlayText");
  const p1Health = document.querySelector("#p1Health");
  const p2Health = document.querySelector("#p2Health");
  const p1Meter = document.querySelector("#p1Meter");
  const p2Meter = document.querySelector("#p2Meter");
  const roundLabel = document.querySelector("#roundLabel");
  const timerLabel = document.querySelector("#timerLabel");
  const stateLabel = document.querySelector("#stateLabel");

  const W = canvas.width;
  const H = canvas.height;
  const floorY = 594;
  const gravity = 0.9;
  const keys = new Set();
  const pressed = new Set();
  let lastTime = performance.now();
  let lastRenderTime = performance.now();
  let gameState = "idle";
  let round = 1;
  let roundTime = 60;
  let pauseTimer = 0;
  let winner = null;
  const sparks = [];
  const afterImages = [];
  const shardBlasts = [];
  const arenaImage = new Image();
  arenaImage.src = "assets/pepe-relic-rumble/pepe-arena.png";
  let cachedArena = null;
  const shieldSprites = {
    1: new Image(),
    2: new Image(),
  };
  shieldSprites[1].src = "assets/pepe-relic-rumble/shard-shield-green.png";
  shieldSprites[2].src = "assets/pepe-relic-rumble/shard-shield-red.png";
  const spriteSources = {
    idle: "assets/pepe-relic-rumble/pepe-brawler.png",
    punch: "assets/pepe-relic-rumble/pepe-punch.png",
    kick: "assets/pepe-relic-rumble/pepe-kick.png",
    block: "assets/pepe-relic-rumble/pepe-block.png",
    hurt: "assets/pepe-relic-rumble/pepe-hurt.png",
    special: "assets/pepe-relic-rumble/pepe-special.png",
    ko: "assets/pepe-relic-rumble/pepe-ko.png",
  };
  const pepeSprites = Object.fromEntries(
    Object.entries(spriteSources).map(([state, src]) => {
      const image = new Image();
      image.src = src;
      image.addEventListener("load", () => buildSpriteDrawCache());
      return [state, image];
    })
  );
  let spriteDrawCache = {};
  const spriteProfiles = {
    idle: { w: 276, h: 276, y: 14 },
    walk: { w: 276, h: 276, y: 14 },
    jump: { w: 282, h: 282, y: 10 },
    punch: { w: 302, h: 302, y: 18 },
    kick: { w: 338, h: 338, y: 36 },
    block: { w: 286, h: 286, y: 18 },
    hurt: { w: 318, h: 318, y: 34 },
    special: { w: 348, h: 348, y: 40 },
    ko: { w: 350, h: 350, y: 64 },
  };

  function buildSpriteDrawCache() {
    const nextCache = {};
    for (const [state, image] of Object.entries(pepeSprites)) {
      const profile = spriteProfiles[state] || spriteProfiles.idle;
      if (!image.complete || !image.naturalWidth) return;
      nextCache[state] = {
        normal: makeSizedSprite(image, profile.w, profile.h, null),
        corrupt: makeSizedSprite(image, profile.w, profile.h, "hue-rotate(245deg) saturate(1.7) brightness(0.98) contrast(1.08)"),
      };
    }
    spriteDrawCache = nextCache;
  }

  function makeSizedSprite(image, width, height, filter) {
    const buffer = document.createElement("canvas");
    buffer.width = width;
    buffer.height = height;
    const bctx = buffer.getContext("2d");
    if (filter) bctx.filter = filter;
    bctx.drawImage(image, 0, 0, width, height);
    if (filter) {
      bctx.filter = "none";
      bctx.globalCompositeOperation = "source-atop";
      bctx.fillStyle = "rgba(255, 32, 32, 0.08)";
      bctx.fillRect(0, 0, width, height);
      bctx.globalCompositeOperation = "source-over";
    }
    return buffer;
  }

  function makeFighter(id, x, controls, palette) {
    return {
      id,
      x,
      y: floorY,
      vx: 0,
      vy: 0,
      facing: id === 1 ? 1 : -1,
      health: 100,
      wins: 0,
      energy: 35,
      grounded: true,
      state: "idle",
      action: null,
      actionTime: 0,
      cooldown: 0,
      invuln: 0,
      hurtTime: 0,
      walkTime: 0,
      charging: false,
      block: false,
      specialReady: true,
      controls,
      palette,
      hitIds: new Set(),
    };
  }

  const fighters = [
    makeFighter(1, 390, { left: "KeyA", right: "KeyD", up: "KeyW", down: "KeyS", punch: "KeyF", kick: "KeyG", block: "KeyH" }, {
      body: "#35be5f",
      light: "#80ffb7",
      dark: "#12351d",
      trim: "#d8b45f",
    }),
    makeFighter(2, 890, { left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", down: "ArrowDown", punch: "KeyJ", kick: "KeyK", block: "KeyL" }, {
      body: "#a82323",
      light: "#ff4a4a",
      dark: "#351010",
      trim: "#ff8a5d",
      filter: "hue-rotate(245deg) saturate(1.7) brightness(0.98) contrast(1.08)",
    }),
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function buildArenaCache() {
    if (!arenaImage.complete || !arenaImage.naturalWidth) return null;
    const buffer = document.createElement("canvas");
    buffer.width = W;
    buffer.height = H;
    const bctx = buffer.getContext("2d");
    const imgRatio = arenaImage.naturalWidth / arenaImage.naturalHeight;
    const canvasRatio = W / H;
    let sx = 0;
    let sy = 0;
    let sw = arenaImage.naturalWidth;
    let sh = arenaImage.naturalHeight;

    if (imgRatio > canvasRatio) {
      sw = arenaImage.naturalHeight * canvasRatio;
      sx = (arenaImage.naturalWidth - sw) / 2;
    } else {
      sh = arenaImage.naturalWidth / canvasRatio;
      sy = (arenaImage.naturalHeight - sh) * 0.44;
    }

    bctx.drawImage(arenaImage, sx, sy, sw, sh, 0, 0, W, H);
    const topShade = bctx.createLinearGradient(0, 0, 0, H);
    topShade.addColorStop(0, "rgba(0, 0, 0, 0.22)");
    topShade.addColorStop(0.55, "rgba(0, 0, 0, 0)");
    topShade.addColorStop(1, "rgba(0, 0, 0, 0.2)");
    bctx.fillStyle = topShade;
    bctx.fillRect(0, 0, W, H);
    return buffer;
  }

  function resetRound() {
    fighters[0].x = 390;
    fighters[1].x = 890;
    fighters.forEach((f, index) => {
      f.y = floorY;
      f.vx = 0;
      f.vy = 0;
      f.facing = index === 0 ? 1 : -1;
      f.health = 100;
      f.energy = Math.max(35, f.energy);
      f.grounded = true;
      f.state = "idle";
      f.action = null;
      f.actionTime = 0;
      f.cooldown = 0;
      f.invuln = 0;
      f.hurtTime = 0;
      f.walkTime = 0;
      f.charging = false;
      f.block = false;
      f.specialReady = true;
      f.hitIds.clear();
    });
    sparks.length = 0;
    afterImages.length = 0;
    shardBlasts.length = 0;
    roundTime = 60;
    winner = null;
  }

  function startFight() {
    round = 1;
    fighters.forEach((f) => {
      f.wins = 0;
      f.energy = 35;
    });
    resetRound();
    gameState = "playing";
    overlay.hidden = true;
    startButton.textContent = "Restart Fight";
  }

  function showOverlay(title, text) {
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    overlay.hidden = false;
  }

  function codeDown(code) {
    return keys.has(code);
  }

  function justPressed(code) {
    return pressed.has(code);
  }

  function beginAction(f, action) {
    if (f.cooldown > 0 || f.action) return;
    f.action = action;
    f.actionTime = 0;
    f.hitIds.clear();
    if (action === "punch") f.cooldown = 0.28;
    if (action === "kick") f.cooldown = 0.42;
    if (action === "special") {
      f.cooldown = 0.72;
      f.energy = 0;
      f.specialReady = false;
      burst(f.x + f.facing * 62, f.y - 76, 34, f.palette.light);
      shardBlast(f, f.x + f.facing * 96, f.y - 134);
    }
  }

  function updateFighter(f, opponent, dt) {
    const c = f.controls;
    const left = codeDown(c.left);
    const right = codeDown(c.right);
    const up = justPressed(c.up);
    const wantsBlock = codeDown(c.block);
    const wantsCharge = codeDown(c.down);
    const move = (right ? 1 : 0) - (left ? 1 : 0);
    const canMove = !f.action || f.action === "block";

    f.facing = opponent.x > f.x ? 1 : -1;
    f.cooldown = Math.max(0, f.cooldown - dt);
    f.invuln = Math.max(0, f.invuln - dt);
    f.hurtTime = Math.max(0, f.hurtTime - dt);
    f.energy = clamp(f.energy + dt * 5.5, 0, 100);
    if (f.energy >= 100) f.specialReady = true;

    if (canMove) {
      f.vx += move * (f.grounded ? 1.38 : 0.74);
      f.vx = clamp(f.vx, -13.5, 13.5);
      if (move) {
        f.state = f.grounded ? "walk" : "jump";
        f.walkTime += dt;
      }
    }

    if (up && f.grounded && !f.action) {
      f.vy = -18.9;
      f.grounded = false;
      f.state = "jump";
      burst(f.x - f.facing * 24, f.y - 8, 8, "rgba(116, 255, 197, 0.85)");
    }

    if (justPressed(c.punch)) beginAction(f, "punch");
    if (justPressed(c.kick)) beginAction(f, "kick");
    if (justPressed(c.block) && f.energy >= 100 && Math.abs(opponent.x - f.x) < 380) beginAction(f, "special");

    f.charging = wantsCharge && !f.action && f.grounded && !wantsBlock;
    if (f.charging) {
      f.state = "block";
      f.energy = clamp(f.energy + dt * 24, 0, 100);
      f.vx *= 0.62;
      if (Math.random() < 0.1) {
        sparks.push({
          x: f.x + (Math.random() - 0.5) * 118,
          y: f.y - 40 - Math.random() * 150,
          vx: (Math.random() - 0.5) * 1.2,
          vy: -2.6 - Math.random() * 3.2,
          life: 0.38 + Math.random() * 0.36,
          color: f.palette.light,
          size: 2 + Math.random() * 4,
        });
      }
    }

    f.block = wantsBlock && !f.action && f.grounded;
    if (f.block) {
      f.state = "block";
      f.vx *= 0.5;
    }

    if (f.action) {
      f.actionTime += dt;
      f.state = f.action;
      const durations = { punch: 0.3, kick: 0.44, special: 0.58 };
      if (f.actionTime >= durations[f.action]) f.action = null;
    }

    f.vy += gravity;
    f.x += f.vx;
    f.y += f.vy;
    f.vx *= f.grounded ? 0.82 : 0.94;
    f.x = clamp(f.x, 88, W - 88);

    if (f.y >= floorY) {
      f.y = floorY;
      f.vy = 0;
      f.grounded = true;
      if (!move && !f.action && !f.block) f.state = "idle";
    }

    if (f.action === "punch" && f.actionTime > 0.07 && f.actionTime < 0.22) {
      tryHit(f, opponent, "punch", f.x + f.facing * 112, f.y - 118, 132, 76, 10);
    }
    if (f.action === "kick" && f.actionTime > 0.12 && f.actionTime < 0.34) {
      tryHit(f, opponent, "kick", f.x + f.facing * 132, f.y - 112, 150, 118, 15);
    }
    if (f.action === "special" && f.actionTime > 0.12 && f.actionTime < 0.48) {
      tryHit(f, opponent, "special", f.x + f.facing * 300, f.y - 130, 520, 150, 24);
    }
  }

  function tryHit(attacker, defender, attack, hx, hy, hw, hh, damage) {
    const hitKey = `${attack}-${defender.id}`;
    if (attacker.hitIds.has(hitKey) || defender.invuln > 0) return;
    const defenderBox = { x: defender.x - 82, y: defender.y - 222, w: 164, h: 222 };
    const hitBox = { x: hx - hw / 2, y: hy - hh / 2, w: hw, h: hh };
    const overlaps =
      hitBox.x < defenderBox.x + defenderBox.w &&
      hitBox.x + hitBox.w > defenderBox.x &&
      hitBox.y < defenderBox.y + defenderBox.h &&
      hitBox.y + hitBox.h > defenderBox.y;
    if (!overlaps) return;

    attacker.hitIds.add(hitKey);
    const blocked = defender.block && Math.sign(attacker.x - defender.x) === defender.facing;
    const finalDamage = blocked ? Math.ceil(damage * 0.28) : damage;
    defender.health = clamp(defender.health - finalDamage, 0, 100);
    defender.invuln = 0.18;
    defender.hurtTime = blocked ? 0.12 : attack === "special" ? 0.42 : 0.28;
    defender.vx += attacker.facing * (blocked ? 4 : attack === "special" ? 13 : 8);
    defender.vy += blocked ? -2 : attack === "kick" ? -8 : -5;
    attacker.energy = clamp(attacker.energy + (blocked ? 4 : 10), 0, 100);
    burst(defender.x, defender.y - 80, attack === "special" ? 18 : 8, blocked ? "#d8b45f" : attacker.palette.light);
    if (afterImages.length < 2) afterImages.push({ x: defender.x, y: defender.y, facing: defender.facing, ttl: 0.14, palette: defender.palette });
  }

  function burst(x, y, count, color) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 7;
      sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.32 + Math.random() * 0.42,
        color,
        size: 2 + Math.random() * 4,
      });
    }
  }

  function updateSparks(dt) {
    for (let i = sparks.length - 1; i >= 0; i -= 1) {
      const s = sparks[i];
      s.life -= dt;
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.18;
      if (s.life <= 0) sparks.splice(i, 1);
    }
    for (let i = afterImages.length - 1; i >= 0; i -= 1) {
      afterImages[i].ttl -= dt;
      if (afterImages[i].ttl <= 0) afterImages.splice(i, 1);
    }
  }

  function shardBlast(f, x, y) {
    shardBlasts.push({
      x,
      y,
      facing: f.facing,
      color: f.palette.light,
      trim: f.palette.trim,
      life: 0.34,
      maxLife: 0.34,
      id: f.id,
    });
  }

  function updateShardBlasts(dt) {
    for (let i = shardBlasts.length - 1; i >= 0; i -= 1) {
      const blast = shardBlasts[i];
      blast.life -= dt;
      blast.x += blast.facing * 560 * dt;
      if (blast.life <= 0) shardBlasts.splice(i, 1);
    }
  }

  function endRound(roundWinner) {
    roundWinner.wins += 1;
    winner = roundWinner;
    pauseTimer = 2.2;
    gameState = "round-over";
    if (roundWinner.wins >= 3) {
      const rank = roundWinner.health > 60 ? "Vault Champion" : "Relic Bruiser";
      window.EmeraldArcade?.recordAndNotify("rumble", {
        played: true,
        wins: roundWinner.wins,
        rank,
        rounds: round,
      });
      showOverlay(`${roundWinner.id === 1 ? "Crown Pepe" : "Corrupt Pepe"} wins the rumble`, `${rank}. Restart to run the vault fight again.`);
      startButton.textContent = "Run It Back";
      gameState = "match-over";
    } else {
      stateLabel.textContent = `${roundWinner.id === 1 ? "Crown Pepe" : "Corrupt Pepe"} takes the round`;
    }
  }

  function update(dt) {
    if (gameState === "playing") {
      roundTime = Math.max(0, roundTime - dt);
      updateFighter(fighters[0], fighters[1], dt);
      updateFighter(fighters[1], fighters[0], dt);
      updateSparks(dt);
      updateShardBlasts(dt);
      if (fighters[0].health <= 0 || fighters[1].health <= 0) {
        endRound(fighters[0].health > fighters[1].health ? fighters[0] : fighters[1]);
      } else if (roundTime <= 0) {
        endRound(fighters[0].health >= fighters[1].health ? fighters[0] : fighters[1]);
      }
    } else if (gameState === "round-over") {
      pauseTimer -= dt;
      updateSparks(dt);
      updateShardBlasts(dt);
      if (pauseTimer <= 0) {
        round += 1;
        resetRound();
        gameState = "playing";
      }
    } else {
      updateSparks(dt);
      updateShardBlasts(dt);
    }
    pressed.clear();
  }

  function drawBackground() {
    if (arenaImage.complete && arenaImage.naturalWidth > 0) {
      drawArenaBackground();
      return;
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, "#06120e");
    gradient.addColorStop(0.58, "#030806");
    gradient.addColorStop(1, "#010302");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.strokeStyle = "#1be894";
    ctx.lineWidth = 1;
    for (let r = 110; r <= 540; r += 70) {
      ctx.beginPath();
      ctx.ellipse(W / 2, floorY + 16, r, r * 0.22, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.28;
    for (let x = 100; x < W; x += 120) {
      drawPillar(x, 130, x % 240 === 100 ? 260 : 310);
    }
    ctx.restore();

    ctx.fillStyle = "#08110d";
    ctx.fillRect(0, floorY + 36, W, H - floorY);
    ctx.strokeStyle = "rgba(216, 180, 95, 0.46)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, floorY + 36);
    ctx.lineTo(W, floorY + 36);
    ctx.stroke();

    ctx.save();
    ctx.translate(W / 2, floorY + 34);
    ctx.strokeStyle = "rgba(116, 255, 197, 0.35)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 18; i += 1) {
      ctx.rotate((Math.PI * 2) / 18);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(440, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawArenaBackground() {
    if (!cachedArena) cachedArena = buildArenaCache();
    if (cachedArena) ctx.drawImage(cachedArena, 0, 0);

    ctx.save();
    ctx.globalAlpha = 0.26;
    ctx.strokeStyle = "rgba(116, 255, 197, 0.46)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(W / 2, floorY + 30, 455, 86, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = "rgba(216, 180, 95, 0.56)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, floorY + 36);
    ctx.lineTo(W, floorY + 36);
    ctx.stroke();
  }

  function drawPillar(x, y, height) {
    ctx.fillStyle = "rgba(7, 18, 14, 0.8)";
    ctx.strokeStyle = "rgba(216, 180, 95, 0.26)";
    ctx.lineWidth = 2;
    ctx.fillRect(x - 28, y, 56, height);
    ctx.strokeRect(x - 28, y, 56, height);
    ctx.fillRect(x - 40, y + height, 80, 18);
    ctx.strokeRect(x - 40, y + height, 80, 18);
    ctx.strokeStyle = "rgba(35, 240, 156, 0.28)";
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x - 12, y + 40 + i * 42);
      ctx.lineTo(x + 12, y + 60 + i * 42);
      ctx.stroke();
    }
  }

  function drawPepe(f, ghostAlpha) {
    if (pepeSprites.idle.complete && pepeSprites.idle.naturalWidth > 0) {
      drawSpritePepe(f, ghostAlpha);
      return;
    }

    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(f.facing, 1);
    ctx.globalAlpha = ghostAlpha || 1;
    const pose = poseFor(f);

    drawLimb(pose.legBack, f.palette.dark, 20);
    drawLimb(pose.legFront, f.palette.body, 22);

    ctx.fillStyle = f.block ? "#1d6e40" : f.palette.body;
    roundRect(-27, -104, 54, 78, 25);
    ctx.fill();
    ctx.strokeStyle = f.palette.trim;
    ctx.lineWidth = 3;
    ctx.stroke();

    drawLimb(pose.armBack, f.palette.dark, 18);
    drawLimb(pose.armFront, f.palette.body, 20);

    ctx.fillStyle = f.palette.light;
    ctx.beginPath();
    ctx.ellipse(0, -148, 48, 35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = f.palette.dark;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = "#dfffe9";
    ctx.beginPath();
    ctx.ellipse(-18, -158, 15, 9, -0.08, 0, Math.PI * 2);
    ctx.ellipse(17, -158, 15, 9, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = f.palette.dark;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#08140d";
    ctx.beginPath();
    ctx.arc(-14, -158, 4, 0, Math.PI * 2);
    ctx.arc(21, -158, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#07130c";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-28, -138);
    ctx.quadraticCurveTo(-2, -126, 32, -137);
    ctx.stroke();

    ctx.strokeStyle = f.palette.trim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -149, 39, Math.PI * 0.12, Math.PI * 0.88);
    ctx.stroke();

    if (f.energy >= 100) {
      ctx.strokeStyle = "rgba(116, 255, 197, 0.8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, -92, 58, 88, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawSpritePepe(f, ghostAlpha) {
    const alpha = ghostAlpha || 1;
    const action = spriteStateFor(f);
    const cachedSprite = spriteDrawCache[action]?.[f.id === 2 ? "corrupt" : "normal"];
    const sprite = cachedSprite || pepeSprites[action] || pepeSprites.idle;
    const profile = spriteProfiles[action] || spriteProfiles.idle;
    const isGhost = alpha < 1;
    const stride = Math.sin((f.walkTime || 0) * 22);
    const bob = action === "walk" ? Math.abs(stride) * -8 : 0;
    const jumpLift = action === "jump" ? -18 : 0;
    const lean =
      action === "punch" ? 9 :
      action === "kick" ? -7 :
      action === "special" ? 12 :
      action === "block" ? -11 :
      action === "walk" ? stride * 5 :
      action === "jump" ? clamp(f.vy * 0.55, -12, 16) :
      0;
    const scaleY =
      action === "block" ? 0.94 :
      action === "special" ? 1.02 :
      action === "walk" ? 0.98 + Math.abs(stride) * 0.035 :
      action === "jump" ? 1.05 :
      1;
    const scaleX =
      action === "punch" || action === "special" ? 1.03 :
      action === "kick" ? 1.02 :
      action === "walk" ? 1.02 - Math.abs(stride) * 0.018 :
      action === "jump" ? 0.96 :
      1;
    const width = profile.w;
    const height = profile.h;

    ctx.save();
    ctx.translate(f.x + lean * (f.facing || 1), f.y + profile.y + bob + jumpLift);
    if (action === "jump") ctx.rotate(clamp(f.vy / 180, -0.08, 0.1) * (f.facing || 1));
    ctx.scale((f.facing || 1) * scaleX, scaleY);
    ctx.globalAlpha = alpha;
    ctx.shadowColor = f.energy >= 100 && !isGhost
      ? (f.id === 2 ? "rgba(255, 74, 74, 0.9)" : "rgba(116, 255, 197, 0.85)")
      : (f.id === 2 ? "rgba(255, 74, 74, 0.42)" : "rgba(35, 240, 156, 0.35)");
    ctx.shadowBlur = f.energy >= 100 && !isGhost ? 8 : 0;
    if (!isGhost && (f.charging || f.energy >= 92)) drawShardAura(f, action);
    if (cachedSprite) {
      ctx.drawImage(sprite, -width / 2, -height);
    } else {
      ctx.drawImage(sprite, -width / 2, -height, width, height);
    }

    if (!isGhost && f.block) drawShardShield(f);

    if (!isGhost && action === "walk") drawMotionDust(-48 - Math.abs(stride) * 8, -10, f.palette.light);
    if (!isGhost && action === "jump") drawJumpTrail(-22, -16, f.palette.light);
    if (!isGhost && action === "punch") drawAttackArc(116, -160, 34, f.palette.light);
    if (!isGhost && action === "kick") drawAttackArc(118, -132, 50, f.palette.trim);
    ctx.restore();
  }

  function spriteStateFor(f) {
    if (typeof f.health === "number" && f.health <= 0) return "ko";
    if ((f.hurtTime || 0) > 0) return "hurt";
    if (f.action === "special") return "special";
    if (f.action === "kick") return "kick";
    if (f.action === "punch") return "punch";
    if (f.block || f.state === "block") return "block";
    if (f.grounded === false || f.state === "jump") return "jump";
    if (f.state === "walk") return "walk";
    return "idle";
  }

  function drawMotionDust(x, y, color) {
    ctx.save();
    ctx.globalAlpha = 0.36;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(x - 28, y);
    ctx.lineTo(x + 16, y - 4);
    ctx.moveTo(x - 16, y + 12);
    ctx.lineTo(x + 22, y + 8);
    ctx.stroke();
    ctx.restore();
  }

  function drawJumpTrail(x, y, color) {
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.moveTo(x - 28, y + 12);
    ctx.lineTo(x + 18, y + 38);
    ctx.moveTo(x + 8, y + 6);
    ctx.lineTo(x + 42, y + 32);
    ctx.stroke();
    ctx.restore();
  }

  function drawAttackArc(x, y, radius, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x, y, radius, -0.75, 0.75);
    ctx.stroke();
    ctx.restore();
  }

  function drawShardAura(f, action) {
    const charge = clamp(f.energy / 100, 0, 1);
    if (!f.charging && charge < 0.92) return;
    const now = performance.now();
    const pulse = 0.72 + Math.sin(now / 115) * 0.28;
    const color = f.id === 2 ? "255, 74, 74" : "116, 255, 197";
    const isCharging = f.charging;
    const auraAlpha = isCharging || charge >= 1 ? 0.78 : 0.2 + charge * 0.34;
    const radiusX = 70 + charge * 34 + pulse * 8;
    const radiusY = 112 + charge * 44 + pulse * 12;

    ctx.save();
    ctx.strokeStyle = `rgba(${color}, ${auraAlpha})`;
    ctx.lineWidth = isCharging ? 5 : 3 + charge * 2;
    ctx.shadowColor = `rgba(${color}, 0.95)`;
    ctx.shadowBlur = isCharging ? 12 : 5 + charge * 7;

    drawShardKiFlame(color, charge, now);

    const shardCount = isCharging ? 7 : 4;
    for (let i = 0; i < shardCount; i += 1) {
      const spin = now / (720 + i * 80);
      const angle = spin + (i / shardCount) * Math.PI * 2;
      const x = Math.cos(angle) * (radiusX * 0.84);
      const y = -138 + Math.sin(angle) * (radiusY * 0.84);
      drawMiniShard(x, y, 7 + charge * 6, f.palette.light, angle);
    }
    ctx.restore();
  }

  function drawShardShield(f) {
    const shield = shieldSprites[f.id];
    const pulse = 0.96 + Math.sin(performance.now() / 80) * 0.04;
    const w = 188;
    const h = 188;
    ctx.save();
    ctx.translate(76, -130);
    ctx.scale(pulse, pulse);
    ctx.globalAlpha = 0.88;
    if (shield.complete && shield.naturalWidth > 0) {
      ctx.drawImage(shield, -w * 0.28, -h / 2, w, h);
    } else {
      ctx.strokeStyle = f.palette.light;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.ellipse(48, 0, 58, 88, 0, -1.25, 1.25);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShardKiFlame(color, charge, now) {
    const height = 170 + charge * 76;
    const width = 82 + charge * 42;
    const spikes = 7;
    const flicker = Math.sin(now / 72) * 8;
    const gradient = ctx.createLinearGradient(0, -36, 0, -height);
    gradient.addColorStop(0, `rgba(${color}, 0.02)`);
    gradient.addColorStop(0.28, `rgba(${color}, ${0.18 + charge * 0.2})`);
    gradient.addColorStop(1, `rgba(${color}, 0)`);

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(-width, -28);
    for (let i = 0; i <= spikes; i += 1) {
      const t = i / spikes;
      const side = i % 2 === 0 ? 1 : 0.62;
      const x = -width + t * width * 2;
      const y = -58 - Math.sin(t * Math.PI) * height * side - Math.sin(now / 95 + i) * 13 - flicker;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, -28);
    ctx.quadraticCurveTo(0, 20, -width, -28);
    ctx.fill();

    ctx.strokeStyle = `rgba(${color}, ${0.38 + charge * 0.28})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-width * 0.75, -40);
    ctx.quadraticCurveTo(-width * 0.42, -height * 0.5, -width * 0.22, -height - flicker);
    ctx.moveTo(width * 0.68, -42);
    ctx.quadraticCurveTo(width * 0.32, -height * 0.52, width * 0.16, -height * 0.92 + flicker);
    ctx.stroke();
    ctx.restore();
  }

  function drawMiniShard(x, y, size, color, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(239, 255, 247, 0.78)";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.58, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.58, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawShardBlasts() {
    shardBlasts.forEach((blast) => {
      const progress = 1 - blast.life / blast.maxLife;
      const alpha = clamp(blast.life / blast.maxLife, 0, 1);
      const length = 130 + progress * 110;
      const color = blast.id === 2 ? "255, 74, 74" : "116, 255, 197";

      ctx.save();
      ctx.translate(blast.x, blast.y);
      ctx.scale(blast.facing, 1);
      ctx.globalAlpha = alpha;
      ctx.shadowColor = `rgba(${color}, 0.95)`;
      ctx.shadowBlur = 10;

      const gradient = ctx.createLinearGradient(0, 0, length, 0);
      gradient.addColorStop(0, `rgba(239, 255, 247, ${0.92 * alpha})`);
      gradient.addColorStop(0.34, `rgba(${color}, ${0.84 * alpha})`);
      gradient.addColorStop(1, `rgba(${color}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, -34);
      ctx.lineTo(length, 0);
      ctx.lineTo(0, 34);
      ctx.quadraticCurveTo(28, 0, 0, -34);
      ctx.fill();

      for (let i = 0; i < 5; i += 1) {
        drawMiniShard(18 + i * 24, (i - 2) * 12, 10 - i * 0.7, blast.color, progress * 5 + i);
      }
      ctx.restore();
    });
  }

  function poseFor(f) {
    const t = performance.now() / 120;
    const walk = f.state === "walk" ? Math.sin(t) * 10 : 0;
    const pose = {
      legBack: [[-10, -32], [-27 - walk, -4], [-36 - walk, 0]],
      legFront: [[12, -32], [25 + walk, -2], [36 + walk, 0]],
      armBack: [[-22, -90], [-50, -66], [-58, -42]],
      armFront: [[22, -88], [50, -65], [58, -42]],
    };

    if (f.state === "punch") {
      const reach = f.actionTime < 0.16 ? 92 : 56;
      pose.armFront = [[23, -90], [56, -98], [reach, -96]];
      pose.armBack = [[-20, -88], [-42, -70], [-52, -48]];
    }
    if (f.state === "kick") {
      const reach = f.actionTime < 0.28 ? 96 : 52;
      pose.legFront = [[13, -32], [52, -28], [reach, -38]];
      pose.armFront = [[20, -88], [38, -66], [48, -48]];
    }
    if (f.state === "block") {
      pose.armFront = [[24, -92], [44, -112], [34, -134]];
      pose.armBack = [[-18, -92], [18, -112], [26, -136]];
    }
    if (f.state === "special") {
      pose.armFront = [[20, -92], [72, -84], [112, -82]];
      pose.armBack = [[-20, -90], [-58, -112], [-74, -136]];
    }
    if (!f.grounded) {
      pose.legBack = [[-10, -32], [-34, -12], [-22, 10]];
      pose.legFront = [[12, -32], [38, -16], [24, 12]];
    }
    return pose;
  }

  function drawLimb(points, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    ctx.quadraticCurveTo(points[1][0], points[1][1], points[2][0], points[2][1]);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(points[2][0], points[2][1], width * 0.48, 0, Math.PI * 2);
    ctx.fill();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawSparks() {
    sparks.forEach((s) => {
      ctx.save();
      ctx.globalAlpha = clamp(s.life * 2, 0, 1);
      ctx.fillStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawWins() {
    fighters.forEach((f, idx) => {
      const startX = idx === 0 ? 42 : W - 128;
      for (let i = 0; i < 3; i += 1) {
        ctx.fillStyle = i < f.wins ? f.palette.light : "rgba(149, 180, 166, 0.22)";
        ctx.strokeStyle = "rgba(216, 180, 95, 0.5)";
        ctx.beginPath();
        ctx.arc(startX + i * 34, 104, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    });
  }

  function render() {
    drawBackground();
    afterImages.forEach((ghost) => drawPepe(ghost, 0.22));
    drawPepe(fighters[0]);
    drawPepe(fighters[1]);
    drawShardBlasts();
    drawSparks();
    drawWins();
  }

  function syncHud() {
    p1Health.textContent = Math.ceil(fighters[0].health);
    p2Health.textContent = Math.ceil(fighters[1].health);
    p1Meter.value = fighters[0].health;
    p2Meter.value = fighters[1].health;
    roundLabel.textContent = `Round ${round}`;
    timerLabel.textContent = Math.ceil(roundTime);
    if (gameState === "playing") {
      stateLabel.textContent = `first to 3 rounds | P1 energy ${Math.floor(fighters[0].energy)} | P2 energy ${Math.floor(fighters[1].energy)}`;
    } else if (gameState === "idle") {
      stateLabel.textContent = "first to 3 rounds";
    } else if (gameState === "match-over") {
      stateLabel.textContent = "match complete";
    }
  }

  function loop(now) {
    if (now - lastRenderTime < 1000 / 45) {
      requestAnimationFrame(loop);
      return;
    }
    const dt = Math.min(0.033, (now - lastTime) / 1000);
    lastRenderTime = now;
    lastTime = now;
    update(dt);
    render();
    syncHud();
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", (event) => {
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) event.preventDefault();
    if (!keys.has(event.code)) pressed.add(event.code);
    keys.add(event.code);
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(event.code);
  });

  startButton.addEventListener("click", startFight);

  resetRound();
  buildSpriteDrawCache();
  render();
  syncHud();
  requestAnimationFrame(loop);
})();

(() => {
  const canvas = document.querySelector("#gameCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const overlay = document.querySelector("#gameOverlay");
  const startButton = document.querySelector("#startButton");
  const overlayTitle = document.querySelector("#overlayTitle");
  const overlayText = document.querySelector("#overlayText");
  const soundToggle = document.querySelector("#soundToggle");
  const unitButtons = [...document.querySelectorAll(".unit-card")];
  const stanceButtons = [...document.querySelectorAll(".stance-button")];
  const shardLabel = document.querySelector("#shardLabel");
  const incomeLabel = document.querySelector("#incomeLabel");
  const scoreLabel = document.querySelector("#scoreLabel");
  const timeLabel = document.querySelector("#timeLabel");
  const bestLabel = document.querySelector("#bestLabel");
  const statusLabel = document.querySelector("#statusLabel");
  const statusMeta = document.querySelector("#statusMeta");

  const W = canvas.width;
  const H = canvas.height;
  const LANE_Y = 472;
  const STORAGE_KEY = "pepe-wars-best-v1";

  const assets = {
    miner: loadImage("assets/pepe-wars/miner-pepe.png"),
    brawler: loadImage("assets/pepe-wars/brawler-pepe.png"),
    archer: loadImage("assets/pepe-wars/archer-pepe.png"),
    mage: loadImage("assets/pepe-wars/mage-pepe.png"),
    enemyCrawler: loadImage("assets/pepe-wars/corrupt-grunt.png"),
    enemyRunner: loadImage("assets/pepe-wars/corrupt-runner.png"),
    enemyBoss: loadImage("assets/pepe-wars/corrupt-brute.png"),
    depositSmall: loadImage("assets/pepe-wars/shard-deposit-small.png"),
    depositMedium: loadImage("assets/pepe-wars/shard-deposit-medium.png"),
    depositLarge: loadImage("assets/pepe-wars/shard-deposit-large.png"),
    arena: loadImage("assets/pepe-wars/pepe-wars-arena.png"),
  };

  const unitTypes = {
    miner: { name: "Miner Pepe", cost: 50, hp: 70, damage: 0, range: 0, speed: 32, rate: 2.2, income: 5, role: "miner" },
    brawler: { name: "Brawler Pepe", cost: 75, hp: 145, damage: 18, range: 34, speed: 46, rate: 0.72, role: "melee" },
    archer: { name: "Archer Pepe", cost: 110, hp: 95, damage: 20, range: 170, speed: 38, rate: 0.95, role: "range" },
    mage: { name: "Mage Pepe", cost: 145, hp: 86, damage: 15, range: 145, speed: 34, rate: 1.35, role: "splash" },
  };

  const enemyTypes = {
    crawler: { hp: 82, damage: 12, range: 30, speed: 34, rate: 0.9, reward: 18, sprite: "enemyCrawler" },
    runner: { hp: 62, damage: 10, range: 28, speed: 58, rate: 0.74, reward: 20, sprite: "enemyRunner" },
    brute: { hp: 185, damage: 24, range: 36, speed: 27, rate: 1.25, reward: 46, sprite: "enemyBoss" },
  };

  const state = {
    playing: false,
    ended: false,
    shards: 120,
    income: 8,
    score: 0,
    elapsed: 0,
    playerBase: 1000,
    enemyBase: 1000,
    aiTimer: 1.4,
    aiBudget: 0,
    stance: "attack",
    best: Number(localStorage.getItem(STORAGE_KEY) || 0),
  };

  const friendlies = [];
  const enemies = [];
  const shardDeposits = [];
  const projectiles = [];
  const floaters = [];
  const dust = [];
  let raf = 0;
  let last = performance.now();
  let soundOn = true;

  function loadImage(src) {
    const image = new Image();
    image.src = src;
    return image;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function distance(a, b) {
    return Math.abs(a - b);
  }

  function format(value) {
    if (value < 1000) return Math.floor(value).toLocaleString();
    return `${(value / 1000).toFixed(value < 10000 ? 1 : 0)}K`;
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  function rankFor(score, elapsed) {
    if (score >= 16000 || elapsed < 150) return "Shard General";
    if (score >= 9000 || elapsed < 210) return "Relic Captain";
    if (score >= 4200) return "Pepe Commander";
    if (score >= 1600) return "Lane Fighter";
    return "Fresh Recruit";
  }

  function resetGame() {
    window.EmeraldArcade?.beginSession("pepeWars", "pepe-wars.html");
    cancelAnimationFrame(raf);
    friendlies.length = 0;
    enemies.length = 0;
    resetDeposits();
    projectiles.length = 0;
    floaters.length = 0;
    dust.length = 0;
    Object.assign(state, {
      playing: true,
      ended: false,
      shards: 120,
      income: 8,
      score: 0,
      elapsed: 0,
      playerBase: 1000,
      enemyBase: 1000,
      aiTimer: 1.4,
      aiBudget: 0,
      stance: "attack",
    });
    stanceButtons.forEach((button) => button.classList.toggle("is-selected", button.dataset.stance === "attack"));
    overlay.classList.add("is-hidden");
    statusLabel.textContent = "Train miners, then send fighters.";
    statusMeta.textContent = "Destroy the corrupt relic base before yours falls.";
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function endGame(win) {
    if (!state.playing) return;
    state.playing = false;
    state.ended = true;
    const score = Math.floor(state.score + (win ? 2500 : 0) + Math.max(0, state.playerBase));
    if (score > state.best) {
      state.best = score;
      localStorage.setItem(STORAGE_KEY, String(score));
    }
    const rank = rankFor(score, state.elapsed);
    window.EmeraldArcade?.recordAndNotify("pepeWars", {
      played: true,
      score,
      rank,
      wins: win ? 1 : 0,
      time: Math.floor(state.elapsed),
    });
    overlayTitle.textContent = win ? "Corrupt base cracked." : "Your relic base fell.";
    overlayText.textContent = `${format(score)} score - ${formatTime(state.elapsed)} - rank: ${rank}.`;
    startButton.textContent = "Run Siege Back";
    overlay.classList.remove("is-hidden");
    updateHud();
  }

  function spawnUnit(type, side = "friendly") {
    const spec = side === "friendly" ? unitTypes[type] : enemyTypes[type];
    const unit = {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      type,
      side,
      x: side === "friendly" ? 128 : 1152,
      y: LANE_Y + (Math.random() - 0.5) * 16,
      hp: spec.hp,
      maxHp: spec.hp,
      damage: spec.damage,
      range: spec.range,
      speed: spec.speed,
      rate: spec.rate,
      cooldown: Math.random() * 0.4,
      income: spec.income || 0,
      role: spec.role || "enemy",
      reward: spec.reward || 0,
      hitFlash: 0,
      gatherTimer: spec.role === "miner" ? spec.rate : 0,
      assignedDeposit: null,
      action: "idle",
      attackTimer: 0,
      stepTimer: Math.random() * 10,
    };
    if (side === "friendly") friendlies.push(unit);
    else enemies.push(unit);
  }

  function resetDeposits() {
    shardDeposits.length = 0;
    shardDeposits.push(
      { id: "near", x: 216, y: LANE_Y + 34, amount: 170, max: 170, pulse: 0, sprite: "depositSmall", size: 112 },
      { id: "mid", x: 318, y: LANE_Y + 26, amount: 230, max: 230, pulse: 0, sprite: "depositMedium", size: 142 },
      { id: "deep", x: 438, y: LANE_Y + 38, amount: 310, max: 310, pulse: 0, sprite: "depositLarge", size: 168 },
    );
  }

  function train(type) {
    if (!state.playing) resetGame();
    const spec = unitTypes[type];
    if (state.shards < spec.cost) {
      statusLabel.textContent = "Need more shards";
      statusMeta.textContent = `${spec.cost} shards required for ${spec.name}`;
      return;
    }
    state.shards -= spec.cost;
    spawnUnit(type, "friendly");
    statusLabel.textContent = `${spec.name} trained`;
    statusMeta.textContent = type === "miner" ? "miner heading to a shard deposit" : "Pepe army moving out";
  }

  function claimDeposit(unit) {
    const liveDeposits = shardDeposits.filter((deposit) => deposit.amount > 0);
    if (!liveDeposits.length) return null;
    const assignedCounts = new Map(liveDeposits.map((deposit) => [deposit.id, 0]));
    for (const miner of friendlies) {
      if (miner.role === "miner" && miner.assignedDeposit && assignedCounts.has(miner.assignedDeposit)) {
        assignedCounts.set(miner.assignedDeposit, assignedCounts.get(miner.assignedDeposit) + 1);
      }
    }
    liveDeposits.sort((a, b) => {
      const crowd = assignedCounts.get(a.id) - assignedCounts.get(b.id);
      if (crowd !== 0) return crowd;
      return Math.abs(unit.x - a.x) - Math.abs(unit.x - b.x);
    });
    unit.assignedDeposit = liveDeposits[0].id;
    return liveDeposits[0];
  }

  function depositFor(unit) {
    const deposit = shardDeposits.find((item) => item.id === unit.assignedDeposit && item.amount > 0);
    return deposit || claimDeposit(unit);
  }

  function updateMiner(unit, dt) {
    const deposit = depositFor(unit);
    if (!deposit) {
      unit.action = "idle";
      return;
    }
    const dx = deposit.x - unit.x;
    const close = Math.abs(dx) < 16;
    if (!close) {
      const dir = Math.sign(dx);
      unit.action = "run";
      unit.x += dir * unit.speed * dt;
      unit.y += (deposit.y - unit.y) * dt * 2.2;
      if (Math.random() < dt * 2.2) {
        dust.push({
          x: unit.x - dir * 18,
          y: unit.y - 3,
          vx: -dir * (18 + Math.random() * 18),
          life: 0.38,
          color: "rgba(116,255,197,",
        });
      }
      return;
    }

    unit.action = "gather";
    unit.gatherTimer -= dt;
    if (unit.gatherTimer <= 0) {
      const mined = Math.min(unit.income, deposit.amount);
      unit.gatherTimer = unit.rate;
      deposit.amount -= mined;
      deposit.pulse = 1;
      state.shards += mined;
      state.income += 0.02;
      state.score += mined * 6;
      floaters.push({ x: deposit.x, y: deposit.y - 62, text: `+${mined}`, color: "#74ffc5", life: 0.65 });
      projectiles.push({
        x: deposit.x,
        y: deposit.y - 40,
        tx: unit.x,
        ty: unit.y - 48,
        life: 0.22,
        max: 0.22,
        color: "#74ffc5",
        splash: false,
      });
      if (deposit.amount <= 0) {
        unit.assignedDeposit = null;
        floaters.push({ x: deposit.x, y: deposit.y - 82, text: "DEPLETED", color: "#d8b45f", life: 0.85 });
      }
    }
  }

  function setStance(stance) {
    state.stance = stance;
    stanceButtons.forEach((button) => button.classList.toggle("is-selected", button.dataset.stance === stance));
    statusLabel.textContent = `${stance[0].toUpperCase()}${stance.slice(1)} stance`;
    statusMeta.textContent = stance === "attack" ? "army pushes the corrupt base" : stance === "hold" ? "army holds the center line" : "army defends your relic base";
  }

  function targetFor(unit) {
    const list = unit.side === "friendly" ? enemies : friendlies;
    let best = null;
    let bestDist = Infinity;
    for (const target of list) {
      const d = distance(unit.x, target.x);
      if (d < bestDist) {
        best = target;
        bestDist = d;
      }
    }
    return best;
  }

  function lineLimit(unit) {
    if (unit.side !== "friendly") return 1180;
    if (state.stance === "attack") return 1168;
    if (state.stance === "hold") return 650;
    return 330;
  }

  function updateUnits(dt) {
    for (const unit of [...friendlies, ...enemies]) {
      unit.cooldown = Math.max(0, unit.cooldown - dt);
      unit.attackTimer = Math.max(0, unit.attackTimer - dt * 6);
      unit.hitFlash = Math.max(0, unit.hitFlash - dt * 5);
      unit.stepTimer += dt * unit.speed * 0.12;
      unit.action = "idle";
      if (unit.role === "miner" && unit.side === "friendly") {
        updateMiner(unit, dt);
        continue;
      }

      const target = targetFor(unit);
      const baseX = unit.side === "friendly" ? 1195 : 85;
      const enemyBaseDistance = distance(unit.x, baseX);
      const targetDistance = target ? distance(unit.x, target.x) : Infinity;
      const inRange = target && targetDistance <= unit.range + 22;
      const baseInRange = enemyBaseDistance <= Math.max(36, unit.range);

      if ((inRange || baseInRange) && unit.damage > 0) {
        unit.action = "attack";
        if (unit.cooldown <= 0) {
          unit.cooldown = unit.rate;
          if (inRange) hitUnit(unit, target);
          else hitBase(unit);
        }
      } else {
        const dir = unit.side === "friendly" ? 1 : -1;
        const limit = lineLimit(unit);
        const canMove = unit.side === "enemy" || (dir > 0 ? unit.x < limit : unit.x > limit);
        if (canMove) {
          unit.action = "run";
          unit.x += dir * unit.speed * dt;
          if (Math.random() < dt * 2.6) {
            dust.push({
              x: unit.x - dir * 18,
              y: unit.y - 3,
              vx: -dir * (18 + Math.random() * 18),
              life: 0.38,
              color: unit.side === "friendly" ? "rgba(116,255,197," : "rgba(255,77,109,",
            });
          }
        }
      }
    }

    cleanupUnits(friendlies);
    cleanupUnits(enemies);
  }

  function hitUnit(attacker, target) {
    attacker.attackTimer = 1;
    target.hp -= attacker.damage;
    target.hitFlash = 1;
    if (attacker.role === "range" || attacker.role === "splash") {
      projectiles.push({
        x: attacker.x,
        y: attacker.y - 34,
        tx: target.x,
        ty: target.y - 30,
        life: 0.18,
        max: 0.18,
        color: attacker.role === "splash" ? "#a855ff" : "#9cff6b",
        splash: attacker.role === "splash",
      });
      if (attacker.role === "splash") {
        for (const enemy of enemies) {
          if (enemy !== target && distance(enemy.x, target.x) < 70) {
            enemy.hp -= attacker.damage * 0.35;
            enemy.hitFlash = 0.7;
          }
        }
      }
    } else {
      floaters.push({ x: target.x, y: target.y - 48, text: "POW", color: "#ffd86b", life: 0.35 });
      projectiles.push({
        x: attacker.x + (attacker.side === "friendly" ? 18 : -18),
        y: attacker.y - 42,
        tx: target.x,
        ty: target.y - 36,
        life: 0.12,
        max: 0.12,
        color: attacker.side === "friendly" ? "#74ffc5" : "#ff4d6d",
        splash: true,
        melee: true,
      });
    }
  }

  function hitBase(attacker) {
    attacker.attackTimer = 1;
    if (attacker.side === "friendly") {
      state.enemyBase -= attacker.damage;
      state.score += attacker.damage * 3;
      if (state.enemyBase <= 0) endGame(true);
    } else {
      state.playerBase -= attacker.damage;
      if (state.playerBase <= 0) endGame(false);
    }
  }

  function cleanupUnits(list) {
    for (let i = list.length - 1; i >= 0; i -= 1) {
      const unit = list[i];
      if (unit.hp > 0) continue;
      list.splice(i, 1);
      if (unit.side === "enemy") {
        state.shards += unit.reward;
        state.score += unit.reward * 18;
        floaters.push({ x: unit.x, y: unit.y - 46, text: `+${unit.reward}`, color: "#74ffc5", life: 0.65 });
      }
    }
  }

  function updateAi(dt) {
    state.aiBudget += dt * (24 + state.elapsed * 0.11);
    state.aiTimer -= dt;
    if (state.aiTimer > 0) return;
    const choices = state.elapsed > 95 ? ["crawler", "runner", "brute"] : state.elapsed > 35 ? ["crawler", "runner"] : ["crawler"];
    const type = choices[Math.floor(Math.random() * choices.length)];
    const cost = type === "brute" ? 105 : type === "runner" ? 52 : 38;
    if (state.aiBudget >= cost) {
      state.aiBudget -= cost;
      spawnUnit(type, "enemy");
    }
    state.aiTimer = clamp(2.6 - state.elapsed * 0.006, 0.72, 2.6);
  }

  function updateEffects(dt) {
    for (const deposit of shardDeposits) {
      deposit.pulse = Math.max(0, deposit.pulse - dt * 3);
    }
    for (let i = projectiles.length - 1; i >= 0; i -= 1) {
      const p = projectiles[i];
      p.life -= dt;
      if (p.life <= 0) projectiles.splice(i, 1);
    }
    for (let i = floaters.length - 1; i >= 0; i -= 1) {
      const f = floaters[i];
      f.life -= dt;
      f.y -= dt * 34;
      if (f.life <= 0) floaters.splice(i, 1);
    }
    for (let i = dust.length - 1; i >= 0; i -= 1) {
      const d = dust[i];
      d.life -= dt;
      d.x += d.vx * dt;
      d.y -= dt * 8;
      if (d.life <= 0) dust.splice(i, 1);
    }
  }

  function update(dt) {
    state.elapsed += dt;
    state.shards += state.income * dt;
    updateAi(dt);
    updateUnits(dt);
    updateEffects(dt);
    updateHud();
  }

  function updateHud() {
    shardLabel.textContent = Math.floor(state.shards);
    incomeLabel.textContent = `${state.income.toFixed(1)}/s`;
    scoreLabel.textContent = format(state.score);
    timeLabel.textContent = formatTime(state.elapsed);
    bestLabel.textContent = format(state.best);
  }

  function drawBackground() {
    ctx.fillStyle = "#03100c";
    ctx.fillRect(0, 0, W, H);
    if (assets.arena.complete) {
      ctx.drawImage(assets.arena, 0, 0, W, H);
    }
    ctx.save();
    ctx.fillStyle = "rgba(1, 6, 5, 0.22)";
    ctx.fillRect(0, LANE_Y + 54, W, H - LANE_Y);
    ctx.strokeStyle = "rgba(216, 180, 95, 0.34)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, LANE_Y + 48);
    ctx.lineTo(W, LANE_Y + 48);
    ctx.stroke();
    ctx.restore();
  }

  function drawBase(x, hp, color, label) {
    ctx.save();
    ctx.translate(x, LANE_Y - 58);
    ctx.fillStyle = "rgba(2, 8, 6, 0.86)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.fillRect(-48, -74, 96, 142);
    ctx.strokeRect(-48, -74, 96, 142);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.moveTo(0, -44);
    ctx.lineTo(24, -5);
    ctx.lineTo(0, 38);
    ctx.lineTo(-24, -5);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#effff7";
    ctx.font = "900 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(label, 0, 92);
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(-54, 76, 108, 8);
    ctx.fillStyle = color;
    ctx.fillRect(-54, 76, 108 * clamp(hp / 1000, 0, 1), 8);
    ctx.restore();
  }

  function drawDeposits() {
    ctx.save();
    for (const deposit of shardDeposits) {
      const ratio = clamp(deposit.amount / deposit.max, 0, 1);
      const sprite = assets[deposit.sprite];
      const glow = 10 + ratio * 22 + deposit.pulse * 26;
      ctx.save();
      ctx.translate(deposit.x, deposit.y);
      ctx.globalAlpha = 0.38 + ratio * 0.62;
      ctx.shadowColor = "#74ffc5";
      ctx.shadowBlur = glow;
      const scale = 0.78 + ratio * 0.28 + deposit.pulse * 0.12;
      ctx.scale(scale, scale);
      if (sprite?.complete) {
        const aspect = sprite.naturalWidth / sprite.naturalHeight || 1;
        const h = deposit.size;
        const w = h * aspect;
        ctx.drawImage(sprite, -w / 2, -h + 38, w, h);
      } else {
        ctx.fillStyle = ratio > 0 ? "#74ffc5" : "#384b42";
        ctx.beginPath();
        ctx.moveTo(0, -42);
        ctx.lineTo(26, -10);
        ctx.lineTo(12, 32);
        ctx.lineTo(-18, 34);
        ctx.lineTo(-30, -8);
        ctx.closePath();
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(1, 8, 6, 0.72)";
      ctx.fillRect(-38, 42, 76, 7);
      ctx.fillStyle = "#74ffc5";
      ctx.fillRect(-38, 42, 76 * ratio, 7);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawUnit(unit) {
    const spec = unit.side === "friendly" ? unitTypes[unit.type] : enemyTypes[unit.type];
    const sprite = unit.side === "friendly" ? assets[unit.type] : assets[spec.sprite];
    const dir = unit.side === "friendly" ? 1 : -1;
    const size = unit.side === "friendly" ? (unit.type === "miner" ? 96 : unit.type === "brawler" ? 104 : 108) : unit.type === "brute" ? 136 : unit.type === "runner" ? 104 : 96;
    const walk = Math.sin(unit.stepTimer);
    const runBob = unit.action === "run" ? walk * 5 : 0;
    const gatherBob = unit.action === "gather" ? Math.sin(state.elapsed * 8 + unit.x) * 4 : 0;
    const attackLunge = unit.action === "attack" ? Math.sin(unit.attackTimer * Math.PI) * 13 : 0;
    const hitKick = unit.hitFlash > 0 ? (unit.side === "friendly" ? -1 : 1) * unit.hitFlash * 7 : 0;
    const squash = unit.action === "run" ? 1 + Math.abs(walk) * 0.035 : unit.action === "attack" ? 1.06 : 1;
    const stretch = unit.action === "run" ? 1 - Math.abs(walk) * 0.025 : unit.action === "attack" ? 0.96 : 1;
    ctx.save();
    ctx.translate(unit.x + dir * attackLunge + hitKick, unit.y + runBob + gatherBob);
    if (dir < 0) ctx.scale(-1, 1);
    ctx.rotate(unit.action === "run" ? walk * 0.035 : unit.action === "attack" ? -0.08 : 0);
    ctx.scale(squash, stretch);
    ctx.globalAlpha = unit.hp > 0 ? 1 : 0.5;
    ctx.shadowColor = unit.side === "friendly" ? "#39ff9a" : "#ff4d6d";
    ctx.shadowBlur = 10 + unit.hitFlash * 18;
    if (sprite?.complete) {
      const aspect = sprite.naturalWidth / sprite.naturalHeight || 1;
      const drawW = size * aspect;
      ctx.drawImage(sprite, -drawW / 2, -size * 0.92, drawW, size);
    } else {
      ctx.fillStyle = unit.side === "friendly" ? "#39ff9a" : "#ff4d6d";
      ctx.beginPath();
      ctx.arc(0, -28, size / 3, 0, Math.PI * 2);
      ctx.fill();
    }
    if (unit.hitFlash > 0) {
      ctx.globalAlpha = unit.hitFlash * 0.45;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, -36, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "rgba(2,8,6,0.8)";
    ctx.fillRect(unit.x - 34, unit.y - size * 1.0, 68, 5);
    ctx.fillStyle = unit.side === "friendly" ? "#39ff9a" : "#ff4d6d";
    ctx.fillRect(unit.x - 34, unit.y - size * 1.0, 68 * clamp(unit.hp / unit.maxHp, 0, 1), 5);
    ctx.restore();
  }

  function drawProjectiles() {
    ctx.save();
    for (const p of projectiles) {
      const progress = 1 - clamp(p.life / p.max, 0, 1);
      const x = p.x + (p.tx - p.x) * progress;
      const y = p.y + (p.ty - p.y) * progress + Math.sin(progress * Math.PI) * -24;
      if (p.melee) {
        ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
        ctx.strokeStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 18;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(p.tx, p.ty, 18 + progress * 18, -0.7, 0.9);
        ctx.stroke();
        ctx.globalAlpha = 1;
        continue;
      }
      ctx.strokeStyle = p.color;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 16;
      ctx.lineWidth = p.splash ? 4 : 3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, p.splash ? 8 : 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawDust() {
    ctx.save();
    for (const d of dust) {
      const alpha = clamp(d.life / 0.38, 0, 1);
      ctx.fillStyle = `${d.color}${alpha * 0.32})`;
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, 14 * alpha, 5 * alpha, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFloaters() {
    ctx.save();
    ctx.font = "900 16px Arial";
    ctx.textAlign = "center";
    for (const f of floaters) {
      ctx.globalAlpha = clamp(f.life / 0.5, 0, 1);
      ctx.fillStyle = f.color;
      ctx.shadowColor = f.color;
      ctx.shadowBlur = 10;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.restore();
  }

  function draw() {
    drawBackground();
    drawBase(82, state.playerBase, "#39ff9a", "PEPE");
    drawBase(1198, state.enemyBase, "#ff4d6d", "CORRUPT");
    drawDeposits();
    drawDust();
    const allUnits = [...friendlies, ...enemies].sort((a, b) => a.y - b.y);
    for (const unit of allUnits) drawUnit(unit);
    drawProjectiles();
    drawFloaters();
  }

  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000 || 0);
    last = now;
    if (state.playing) update(dt);
    draw();
    raf = requestAnimationFrame(loop);
  }

  unitButtons.forEach((button) => button.addEventListener("click", () => train(button.dataset.unit)));
  stanceButtons.forEach((button) => button.addEventListener("click", () => setStance(button.dataset.stance)));
  startButton.addEventListener("click", resetGame);
  soundToggle.addEventListener("click", () => {
    soundOn = !soundOn;
    soundToggle.textContent = `Sound: ${soundOn ? "on" : "off"}`;
    soundToggle.setAttribute("aria-pressed", String(soundOn));
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "1") train("miner");
    if (event.key === "2") train("brawler");
    if (event.key === "3") train("archer");
    if (event.key === "4") train("mage");
    if (event.key.toLowerCase() === "a") setStance("attack");
    if (event.key.toLowerCase() === "h") setStance("hold");
    if (event.key.toLowerCase() === "d") setStance("defend");
    if (event.key === "Enter" && !state.playing) resetGame();
  });

  resetDeposits();
  updateHud();
  draw();
})();

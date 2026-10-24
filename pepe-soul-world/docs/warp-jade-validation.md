# Warpstep jade restoration

Cleaned the four-pose atlas using the built-in image editor, then packed its alpha boundary with a one-source-pixel inset to remove residual matte noise. Preserved atlas dimensions and cell positions. The edit prompt preserves Crown identity, costume, four poses, framing, and asks for clean transparent edges without colored fringes or glow. Source: assets/crown-warp-clean-source-v1.png; runtime: assets/crown-warp.png. Reproduce packing with tools/pack-warp-clean.mjs and the bundled node_modules path.

Effects use jade, pale jade and deep jade. Pose transitions use short smoothstep blends inside the existing phase windows. Combat simulation was not edited: 60ms plant, 140ms travel, 140ms recovery, 340ms total, original range, cost, invulnerability and cooldown.

265 automated tests pass, including jade palette and unchanged travel/phase checks. Native browser practice input K moved Crown from 320 to 560 and returned to idle without warning/error logs. Normal campaign saves were not used.

warp-step-full-speed.gif is a 50fps export of the actual simulation and renderer, not a browser recording. warp-full-speed-frame.png shows its travel phase.

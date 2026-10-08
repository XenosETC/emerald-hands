(() => {
  const challenge = window.ShardRushChallenges;
  const status = document.querySelector("#dailyRushStatus");
  if (!challenge || !status) return;
  function render() {
    let storage;
    try { storage = window.localStorage; } catch { /* Show the course without a record. */ }
    const day = challenge.dayKey();
    const result = challenge.best(challenge.read(storage), day);
    document.querySelector("#dailyRushDate").textContent = `${day} · New course at 00:00 UTC`;
    status.textContent = result
      ? `${challenge.medal(result.score)} · Best ${result.score.toLocaleString()} · ${result.attempts} completed ${result.attempts === 1 ? "run" : "runs"}`
      : "Bronze 3,000 · Silver 9,000 · Gold 18,000";
  }
  window.addEventListener("pageshow", render);
  window.addEventListener("focus", render);
  window.addEventListener("storage", event => { if (event.key === challenge.key || event.key === null) render(); });
  render();
})();

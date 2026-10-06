// Merge near-simultaneous troop hits on one victim; Crown's damage stays distinct.
export function addDamageNumber(b, attacker, target, amount) {
  const source = attacker.hero ? 'crown' : target.hero ? 'incoming' : 'troop';
  const recent = b.effects.find(effect => effect.damageNumber && effect.targetId===target.id && effect.source===source && b.time-effect.created<.18);
  if (recent) {
    recent.amount += amount; recent.text = String(recent.amount); recent.life = .7;
    return;
  }
  const active = b.effects.filter(effect => effect.damageNumber && effect.targetId===target.id && effect.life>.35).length;
  b.effects.push({damageNumber:true, targetId:target.id, source, amount, text:String(amount), created:b.time,
    x:target.x+(source==='crown'?-16:source==='troop'?16:0), y:target.y-78-active*15, life:.7});
}

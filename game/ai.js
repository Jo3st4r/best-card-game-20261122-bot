// ai.js — the Stormwright: a readable opponent you can counter.
// One clear job: decide which cards the AI plays, and telegraph its intent.

import { effectivePower } from './engine.js';

// Score one card in the current position. The AI favours lethal damage,
// guards when hurt, draws when its hand is thin, and steals mana when you
// are flush — so its plan is readable from the board.
function scoreCard(state, card) {
  const me = state.ai;
  const foe = state.player;
  const power = effectivePower(state, 'ai', card);
  let score = 0;
  switch (card.kind) {
    case 'damage':
    case 'tideDamage':
      score = power * 2;
      if (power >= foe.hp + foe.shield) score += 100; // lethal
      if (foe.hp <= 10) score += power; // smell blood
      break;
    case 'shield':
      score = me.hp <= 12 ? power * 3 : power * 0.6; // guard only when hurt
      if (foe.hp <= 8) score -= 4; // press the attack instead
      break;
    case 'heal':
      score = me.hp <= 16 ? power * 3 : power * 0.4;
      break;
    case 'draw':
      score = me.hand.length <= 3 ? power * 4 : power;
      break;
    case 'drain':
      score = foe.mana >= 5 ? power * 3 : power * 0.5;
      break;
  }
  // Cheap cards first when the scores tie: keep the mana flowing.
  score -= card.cost * 0.3;
  // Surge pairs are worth setting up: a second card of a suit already played.
  if (me.playedSuits.includes(card.suit)) score += 3;
  return score;
}

// The AI's whole turn, as a list of card uids in play order.
export function choosePlays(state) {
  const plays = [];
  const me = state.ai;
  let mana = me.mana;
  const hand = [...me.hand];
  const playedSuits = [...me.playedSuits];
  for (let i = 0; i < 5; i++) {
    let best = null;
    let bestScore = 0;
    for (const card of hand) {
      if (card.cost > mana) continue;
      // Score against a shadow of the real state (same suits played so far).
      const shadow = { ...state, ai: { ...me, playedSuits, hand } };
      const s = scoreCard(shadow, card);
      if (s > bestScore) { best = card; bestScore = s; }
    }
    if (!best) break;
    plays.push(best.uid);
    mana -= best.cost;
    playedSuits.push(best.suit);
    hand.splice(hand.indexOf(best), 1);
  }
  return plays;
}

// What the Stormwright is about to do, shown before its turn so you can
// shield up, heal, or race it. Built from its single best card right now.
export function intentFor(state) {
  const me = state.ai;
  let best = null;
  let bestScore = -Infinity;
  for (const card of me.hand) {
    if (card.cost > me.mana) continue;
    const s = scoreCard(state, card);
    if (s > bestScore) { best = card; bestScore = s; }
  }
  if (!best) return { suit: null, text: 'The Stormwright waits, watching the tide…' };
  const suitName = best.suit === 'ember' ? 'Ember' : best.suit === 'kelp' ? 'Kelp' : 'Tide';
  const verb = best.kind === 'damage'
    ? 'gathers fire'
    : best.kind === 'tideDamage' ? 'calls the tide'
    : best.kind === 'shield' ? 'raises its guard'
    : best.kind === 'heal' ? 'mends its wounds'
    : best.kind === 'draw' ? 'draws deep'
    : 'reaches for your mana';
  return { suit: best.suit, text: `The Stormwright ${verb} — ${suitName} stirs…` };
}

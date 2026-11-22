// engine.js — the duel's rules: turns, mana, Surge, damage, shield, win and loss.
// One clear job: pure game logic. No DOM here, so the rules can be tested headlessly.

import { buildDeck } from './cards.js';

export const MAX_HP = 30;
export const MAX_MANA = 8;
export const MAX_HAND = 7;
export const START_HAND = 5;

// Small deterministic RNG (mulberry32) so screenshot states and tests repeat.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function newSide(rng) {
  return {
    hp: MAX_HP,
    shield: 0,
    mana: 3,
    maxMana: 3,
    deck: buildDeck(rng),
    hand: [],
    discard: [],
    playedSuits: [], // suits played this turn, for Surge
  };
}

export function createDuel(seed = 20261123) {
  const rng = mulberry32(seed);
  const state = {
    turn: 1,
    phase: 'player', // 'player' | 'ai' | 'over'
    winner: null, // 'player' | 'ai' | null
    player: newSide(rng),
    ai: newSide(rng),
    log: [],
  };
  drawCards(state, 'player', START_HAND);
  drawCards(state, 'ai', START_HAND);
  return state;
}

export function drawCards(state, side, n) {
  const s = state[side];
  for (let i = 0; i < n; i++) {
    if (s.hand.length >= MAX_HAND) break;
    if (s.deck.length === 0) {
      // Reshuffle the discard pile; a duel never stalls on an empty deck.
      s.deck = s.discard.splice(0).sort(() => 0.5 - Math.random());
      if (s.deck.length === 0) break;
    }
    s.hand.push(s.deck.pop());
  }
}

// Surge: the second card of a suit played in one turn hits +2 harder.
export function surgeBonus(state, side, card) {
  return state[side].playedSuits.includes(card.suit) ? 2 : 0;
}

export function effectivePower(state, side, card) {
  let power = card.power + surgeBonus(state, side, card);
  if (card.kind === 'tideDamage') power += state[side].hand.length;
  return power;
}

export function canPlay(state, side, card) {
  return state.phase === (side === 'player' ? 'player' : 'ai')
    && state.winner === null
    && card.cost <= state[side].mana;
}

// Play a card from a side's hand. Returns an event describing what happened,
// or null when the play is illegal. The UI animates from this event.
export function playCard(state, side, uid) {
  const me = state[side];
  const foe = state[side === 'player' ? 'ai' : 'player'];
  const idx = me.hand.findIndex((c) => c.uid === uid);
  if (idx === -1) return null;
  const card = me.hand[idx];
  if (!canPlay(state, side, card)) return null;

  const power = effectivePower(state, side, card);
  const surged = surgeBonus(state, side, card) > 0;
  me.mana -= card.cost;
  me.hand.splice(idx, 1);
  me.discard.push(card);
  me.playedSuits.push(card.suit);

  const event = { card, side, power, surged, text: '' };
  switch (card.kind) {
    case 'damage':
    case 'tideDamage': {
      const dealt = dealDamage(foe, power);
      event.text = `${card.name} hits ${foe === state.ai ? 'the Stormwright' : 'you'} for ${dealt}`;
      break;
    }
    case 'shield':
      me.shield += power;
      event.text = `${card.name} raises ${power} shield`;
      break;
    case 'heal': {
      const healed = Math.min(power, MAX_HP - me.hp);
      me.hp += healed;
      event.text = `${card.name} restores ${healed} HP`;
      break;
    }
    case 'draw':
      drawCards(state, side, power);
      event.text = `${card.name} draws ${power}`;
      break;
    case 'drain': {
      const stolen = Math.min(power, foe.mana);
      foe.mana -= stolen;
      me.mana = Math.min(MAX_MANA, me.mana + stolen);
      event.text = `${card.name} steals ${stolen} mana`;
      break;
    }
  }
  if (surged) event.text += ' — SURGE!';
  state.log.unshift(event.text);
  if (foe.hp <= 0) { state.winner = side; state.phase = 'over'; }
  if (me.hp <= 0) { state.winner = side === 'player' ? 'ai' : 'player'; state.phase = 'over'; }
  return event;
}

function dealDamage(target, amount) {
  const absorbed = Math.min(target.shield, amount);
  target.shield -= absorbed;
  const through = amount - absorbed;
  target.hp = Math.max(0, target.hp - through);
  return through + absorbed;
}

// End the current side's turn: hand the turn over, refresh mana, draw a card.
export function endTurn(state) {
  if (state.winner) return;
  const next = state.phase === 'player' ? 'ai' : 'player';
  const s = state[next];
  s.maxMana = Math.min(MAX_MANA, s.maxMana + 1);
  s.mana = s.maxMana;
  s.playedSuits = [];
  drawCards(state, next, 2); // two cards a turn keeps the duel moving
  state.phase = next;
  if (next === 'player') state.turn += 1;
  state.log.unshift(next === 'player' ? `Turn ${state.turn} — your move` : 'The Stormwright takes the table');
}

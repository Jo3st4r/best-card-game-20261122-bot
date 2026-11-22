// ui.js — everything the player sees: the table, the hands, the screens.
// One clear job: turn game state into DOM, and animate what changes.

import { SUITS, effectText } from './cards.js';
import { MAX_HP, MAX_MANA } from './engine.js';
import { sfx } from './sound.js';

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function suitIcon(suitKey, size = 26) {
  const suit = SUITS[suitKey];
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.style.color = suit.color;
  svg.innerHTML = suit.icon;
  return svg;
}

// One card face: cost gem, suit icon, name, power, effect line. Suits are
// told apart by colour AND shape, never by text alone.
export function cardElement(card, opts = {}) {
  if (opts.faceDown) {
    const node = el('div', 'card face-down');
    node.append(el('div', 'card-back', '≈'));
    return node;
  }
  const suit = SUITS[card.suit];
  const node = el('div', 'card suit-' + card.suit);
  if (opts.playable) node.classList.add('playable');
  const cost = el('div', 'cost', String(card.cost));
  cost.title = 'Mana cost';
  const icon = el('div', 'card-icon');
  icon.append(suitIcon(card.suit, 34));
  const name = el('div', 'card-name', card.name);
  const power = el('div', 'card-power', String(card.power));
  power.title = 'Power';
  const effect = el('div', 'card-effect', effectText(card));
  const suitLabel = el('div', 'card-suit', suit.name);
  node.append(cost, icon, name, power, effect, suitLabel);
  if (opts.onPlay) {
    node.addEventListener('click', () => opts.onPlay(card));
    node.tabIndex = 0;
    node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opts.onPlay(card); }
    });
  }
  return node;
}

function hpBar(side, state) {
  const s = state[side];
  const wrap = el('div', 'hp-wrap');
  const label = el('div', 'hp-label', `${s.hp} / ${MAX_HP} HP`);
  const bar = el('div', 'hp-bar');
  const fill = el('div', 'hp-fill');
  fill.style.width = Math.max(0, (s.hp / MAX_HP) * 100) + '%';
  if (s.hp <= 10) fill.classList.add('low');
  bar.append(fill);
  wrap.append(label, bar);
  if (s.shield > 0) wrap.append(el('div', 'shield-badge', `Shield ${s.shield}`));
  return wrap;
}

function manaGems(side, state) {
  const s = state[side];
  const wrap = el('div', 'mana');
  wrap.title = `Mana ${s.mana} / ${s.maxMana}`;
  for (let i = 0; i < MAX_MANA; i++) {
    const gem = el('div', 'gem' + (i < s.mana ? ' lit' : '') + (i >= s.maxMana ? ' locked' : ''));
    wrap.append(gem);
  }
  wrap.append(el('span', 'mana-text', `${s.mana} mana`));
  return wrap;
}

// A floating number over a side's portrait: damage, healing, shield.
export function floatNumber(target, text, kind) {
  const node = el('div', 'float-num ' + kind, text);
  target.append(node);
  setTimeout(() => node.remove(), 1400);
}

// Render the whole table from state. Called after every play and every turn.
export function renderTable(state, handlers) {
  const table = document.getElementById('table');
  table.innerHTML = '';

  // Opponent row: portrait, HP, face-down hand.
  const opp = el('section', 'row opp-row');
  const oppInfo = el('div', 'side-info');
  oppInfo.append(el('div', 'avatar storm', '⚡'));
  oppInfo.append(el('div', 'side-name', 'The Stormwright'));
  oppInfo.append(hpBar('ai', state));
  opp.append(oppInfo);
  const oppHand = el('div', 'hand opp-hand');
  state.ai.hand.forEach(() => oppHand.append(cardElement(null, { faceDown: true })));
  opp.append(oppHand);
  table.append(opp);

  // Middle: intent telegraph, turn banner, log.
  const mid = el('div', 'mid');
  const intent = el('div', 'intent', handlers.intentText || '');
  if (handlers.intentSuit) intent.classList.add('suit-' + handlers.intentSuit);
  const banner = el('div', 'turn-banner', state.winner ? 'Duel over' : state.phase === 'player' ? `Your turn — turn ${state.turn}` : 'The Stormwright plays…');
  const log = el('div', 'log');
  state.log.slice(0, 5).forEach((line) => log.append(el('div', 'log-line', line)));
  mid.append(intent, banner, log);
  table.append(mid);

  // Player row: HP, mana, hand, End Turn.
  const you = el('section', 'row you-row');
  const youInfo = el('div', 'side-info');
  youInfo.append(el('div', 'avatar tide', '∿'));
  youInfo.append(el('div', 'side-name', 'You — the Tidecaller'));
  youInfo.append(hpBar('player', state));
  youInfo.append(manaGems('player', state));
  you.append(youInfo);
  const hand = el('div', 'hand you-hand');
  state.player.hand.forEach((card) => {
    const playable = state.phase === 'player' && !state.winner && card.cost <= state.player.mana;
    hand.append(cardElement(card, { playable, onPlay: (c) => handlers.onPlay(c) }));
  });
  you.append(hand);
  const endBtn = el('button', 'end-turn', 'End Turn ⏎');
  endBtn.disabled = state.phase !== 'player' || !!state.winner;
  endBtn.addEventListener('click', handlers.onEndTurn);
  you.append(endBtn);
  table.append(you);
}

export function showScreen(name) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
}

export function renderEnd(state) {
  const win = state.winner === 'player';
  const title = document.getElementById('end-title');
  const sub = document.getElementById('end-sub');
  const stats = document.getElementById('end-stats');
  title.textContent = win ? 'VICTORY — the tide is yours!' : 'DEFEAT — the storm takes the sea';
  title.className = win ? 'end-title win' : 'end-title lose';
  sub.textContent = win
    ? 'The Stormwright bows. Your 24 cards held the line.'
    : 'Your HP reached 0. Shuffle the deck and call the tide again.';
  stats.innerHTML = '';
  stats.append(el('div', 'stat', `Turns played: ${state.turn}`));
  stats.append(el('div', 'stat', `Your HP: ${state.player.hp} / ${MAX_HP}`));
  stats.append(el('div', 'stat', `Stormwright HP: ${state.ai.hp} / ${MAX_HP}`));
  stats.append(el('div', 'stat', `Cards left in your deck: ${state.player.deck.length}`));
  if (win) sfx.win(); else sfx.lose();
}

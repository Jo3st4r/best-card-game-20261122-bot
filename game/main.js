// main.js — boots Tidebreak, wires the buttons, runs the AI's turn.
// One clear job: glue the engine, the AI and the UI together.

import { createDuel, playCard, endTurn, MAX_HP } from './engine.js';
import { choosePlays, intentFor } from './ai.js';
import { renderTable, renderEnd, showScreen, floatNumber } from './ui.js';
import { sfx, setMuted, isMuted } from './sound.js';

let state = createDuel(20261123);
let aiTimer = null;

const tableEl = () => document.getElementById('table');

function refresh() {
  const intent = state.phase === 'player' && !state.winner ? intentFor(state) : { suit: null, text: '' };
  renderTable(state, {
    intentText: intent.text,
    intentSuit: intent.suit,
    onPlay: onPlayCard,
    onEndTurn: onEndTurn,
  });
  if (state.winner && !state._endShown) {
    state._endShown = true;
    renderEnd(state);
    showScreen('end');
  }
}

function onPlayCard(card) {
  if (state.phase !== 'player' || state.winner) return;
  const event = playCard(state, 'player', card.uid);
  if (!event) return;
  if (event.surged) sfx.surge();
  else if (event.card.kind === 'shield' || event.card.kind === 'heal') sfx.shield();
  else if (event.card.kind === 'damage' || event.card.kind === 'tideDamage') sfx.damage();
  else sfx.play();
  const foeInfo = document.querySelector('.opp-row .side-info');
  if (foeInfo && (event.card.kind === 'damage' || event.card.kind === 'tideDamage')) {
    floatNumber(foeInfo, '-' + event.power, 'dmg');
  }
  refresh();
}

function onEndTurn() {
  if (state.phase !== 'player' || state.winner) return;
  endTurn(state);
  sfx.turn();
  refresh();
  runAiTurn();
}

// The Stormwright plays one card at a time, so you can watch its plan land.
function runAiTurn() {
  if (state.phase !== 'ai' || state.winner) return;
  const plays = choosePlays(state);
  let i = 0;
  const step = () => {
    if (state.winner) { refresh(); return; }
    if (i >= plays.length) {
      endTurn(state);
      sfx.turn();
      refresh();
      return;
    }
    const event = playCard(state, 'ai', plays[i]);
    i += 1;
    if (event) {
      if (event.card.kind === 'damage' || event.card.kind === 'tideDamage') sfx.damage();
      else if (event.card.kind === 'shield' || event.card.kind === 'heal') sfx.shield();
      else sfx.play();
      const youInfo = document.querySelector('.you-row .side-info');
      if (youInfo && (event.card.kind === 'damage' || event.card.kind === 'tideDamage')) {
        floatNumber(youInfo, '-' + event.power, 'dmg');
      }
    }
    refresh();
    if (!state.winner) aiTimer = setTimeout(step, 750);
  };
  aiTimer = setTimeout(step, 750);
}

function newDuel(seed) {
  clearTimeout(aiTimer);
  state = createDuel(seed ?? Math.floor(Math.random() * 1e9));
  state.log.unshift('Turn 1 — your move. Play a card, then End Turn.');
  refresh();
  showScreen('table');
}

// Screenshot states, read from location.hash: #shot=title|table|win|loss|selftest.
// These are the game's own screens, shown on demand so its maker can capture
// them; a player reaching them by play sees the same renders.
function applyShot() {
  const shot = new URLSearchParams(location.hash.slice(1)).get('shot') || 'title';
  if (shot === 'title') { showScreen('title'); return; }
  if (shot === 'table') {
    // A fixed mid-duel, seeded so the render repeats exactly.
    state = createDuel(7);
    state.player.hp = 18; state.player.shield = 3;
    state.ai.hp = 13; state.ai.shield = 0;
    state.player.mana = 5; state.player.maxMana = 6;
    state.turn = 4;
    state.log.unshift('Blaze hits the Stormwright for 5 — SURGE!');
    state.log.unshift('The Stormwright raises 4 shield');
    state.log.unshift('Turn 4 — your move');
    refresh();
    showScreen('table');
    return;
  }
  if (shot === 'win' || shot === 'loss') {
    state = createDuel(11);
    state.turn = 9;
    if (shot === 'win') { state.ai.hp = 0; state.winner = 'player'; }
    else { state.player.hp = 0; state.winner = 'ai'; }
    state.phase = 'over';
    state.log.unshift(shot === 'win' ? 'Inferno hits the Stormwright for 8 — SURGE!' : 'Wildfire hits you for 6');
    renderEnd(state);
    showScreen('end');
    return;
  }
  if (shot === 'selftest') {
    // Headless check: two AIs play a full duel; the result lands in the DOM.
    const test = createDuel(99);
    let guard = 0;
    while (!test.winner && guard < 200) {
      guard += 1;
      const side = test.phase;
      const plays = side === 'player' ? choosePlays({ ...test, ai: test.player, player: test.ai }) : choosePlays(test);
      let played = false;
      for (const uid of plays) {
        if (playCard(test, side, uid)) played = true;
      }
      if (!played || test.winner) { if (!test.winner) endTurn(test); }
      else endTurn(test);
    }
    const out = document.getElementById('selftest');
    out.textContent = `SELFTEST winner=${test.winner} turns=${test.turn} php=${test.player.hp} ahp=${test.ai.hp} guard=${guard}`;
    document.title = out.textContent;
    showScreen('table');
  }
}

document.getElementById('play-btn').addEventListener('click', () => { sfx.play(); newDuel(); });
document.getElementById('again-btn').addEventListener('click', () => { sfx.play(); newDuel(); });
document.getElementById('how-btn').addEventListener('click', () => {
  document.getElementById('howto').classList.toggle('open');
});
document.getElementById('mute-btn').addEventListener('click', (e) => {
  setMuted(!isMuted());
  e.currentTarget.textContent = isMuted() ? 'Sound: off' : 'Sound: on';
});
document.getElementById('title-btn').addEventListener('click', () => showScreen('title'));

applyShot();

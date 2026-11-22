// cards.js — the deck of Tidebreak: 24 cards, 3 tides, 1 duel.
// One clear job: define the suits and every card. No DOM, no game state.

export const SUITS = {
  ember: {
    key: 'ember',
    name: 'Ember',
    color: '#ff7a3c',
    dark: '#c33d12',
    // a flame, drawn as an SVG path (viewBox 0 0 24 24)
    icon: '<path d="M12 2c1 3-2 4.5-2 7 0 1.2.8 2 2 2s2-.8 2-2c2 1.5 3 3.5 3 5.5A5.5 5.5 0 0 1 6.5 14.5C6.5 9 10 6 12 2z" fill="currentColor"/>',
  },
  kelp: {
    key: 'kelp',
    name: 'Kelp',
    color: '#4ecb5d',
    dark: '#1e7a2e',
    // a leaf
    icon: '<path d="M20 4C10 4 4 9 4 19c0 1 .5 1.5 1.5 1C15 20 20 14 20 4z" fill="currentColor"/><path d="M5 19C8 13 13 8 19 5" stroke="#0b3d16" stroke-width="1.4" fill="none"/>',
  },
  tide: {
    key: 'tide',
    name: 'Tide',
    color: '#4db8ff',
    dark: '#1466b8',
    // a wave
    icon: '<path d="M2 14c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0 3.5-2 5-1v4c-1.5-1-2.5-1-5 1s-5 2.5-7.5 0-5-2.5-7.5 0V14z" fill="currentColor"/><path d="M2 9c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0 3.5-2 5-1v3c-1.5-1-2.5-1-5 1s-5 2.5-7.5 0-5-2.5-7.5 0V9z" fill="currentColor" opacity=".65"/>',
  },
};

// kind: damage | shield | heal | draw | drain | tideDamage
// power: the card's base number. Surge adds +2 to the second same-suit card of a turn.
export const DECK = [
  // Ember — deal damage equal to power.
  { id: 'coal', name: 'Coal', suit: 'ember', cost: 1, power: 1, kind: 'damage' },
  { id: 'cinder', name: 'Cinder', suit: 'ember', cost: 1, power: 2, kind: 'damage' },
  { id: 'ash', name: 'Ash', suit: 'ember', cost: 2, power: 2, kind: 'damage' },
  { id: 'spark', name: 'Spark', suit: 'ember', cost: 2, power: 3, kind: 'damage' },
  { id: 'flame', name: 'Flame', suit: 'ember', cost: 3, power: 4, kind: 'damage' },
  { id: 'blaze', name: 'Blaze', suit: 'ember', cost: 4, power: 5, kind: 'damage' },
  { id: 'wildfire', name: 'Wildfire', suit: 'ember', cost: 5, power: 6, kind: 'damage' },
  { id: 'inferno', name: 'Inferno', suit: 'ember', cost: 6, power: 8, kind: 'damage' },
  // Kelp — shield (absorbs damage) or heal.
  { id: 'sprout', name: 'Sprout', suit: 'kelp', cost: 1, power: 2, kind: 'shield' },
  { id: 'shell', name: 'Shell', suit: 'kelp', cost: 2, power: 3, kind: 'shield' },
  { id: 'reef', name: 'Reef', suit: 'kelp', cost: 2, power: 4, kind: 'shield' },
  { id: 'bloom', name: 'Bloom', suit: 'kelp', cost: 3, power: 4, kind: 'heal' },
  { id: 'coral', name: 'Coral', suit: 'kelp', cost: 3, power: 5, kind: 'shield' },
  { id: 'grove', name: 'Grove', suit: 'kelp', cost: 4, power: 6, kind: 'shield' },
  { id: 'mangrove', name: 'Mangrove', suit: 'kelp', cost: 4, power: 5, kind: 'heal' },
  { id: 'bulwark', name: 'Bulwark', suit: 'kelp', cost: 5, power: 8, kind: 'shield' },
  // Tide — draw, drain mana, or damage that grows with your hand.
  { id: 'foam', name: 'Foam', suit: 'tide', cost: 2, power: 1, kind: 'draw' },
  { id: 'current', name: 'Current', suit: 'tide', cost: 2, power: 2, kind: 'draw' },
  { id: 'dew', name: 'Dew', suit: 'tide', cost: 3, power: 2, kind: 'heal' },
  { id: 'undertow', name: 'Undertow', suit: 'tide', cost: 3, power: 2, kind: 'drain' },
  { id: 'wave', name: 'Wave', suit: 'tide', cost: 4, power: 3, kind: 'draw' },
  { id: 'whirlpool', name: 'Whirlpool', suit: 'tide', cost: 3, power: 0, kind: 'tideDamage' },
  { id: 'riptide', name: 'Riptide', suit: 'tide', cost: 4, power: 2, kind: 'tideDamage' },
  { id: 'maelstrom', name: 'Maelstrom', suit: 'tide', cost: 5, power: 6, kind: 'damage' },
];

export function cardById(id) {
  return DECK.find((c) => c.id === id);
}

// One full 24-card deck, shuffled with the given rng (a function returning [0,1)).
export function buildDeck(rng) {
  const deck = DECK.map((c) => ({ ...c, uid: c.id + '-' + Math.floor(rng() * 1e9).toString(36) }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Human-readable effect line, shown on the card face.
export function effectText(card) {
  switch (card.kind) {
    case 'damage': return `Deal ${card.power} damage`;
    case 'shield': return `Gain ${card.power} shield`;
    case 'heal': return `Restore ${card.power} HP`;
    case 'draw': return `Draw ${card.power} card${card.power > 1 ? 's' : ''}`;
    case 'drain': return `Steal ${card.power} mana`;
    case 'tideDamage':
      return card.id === 'whirlpool'
        ? 'Damage = cards in hand'
        : `Damage ${card.power} + cards in hand`;
    default: return '';
  }
}

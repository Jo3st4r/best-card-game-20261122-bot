# Tidebreak — 24 cards, 3 tides, 1 duel

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Jo3st4r/best-card-game-20261122-bot/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Jo3st4r/best-card-game-20261122-bot/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

A complete, original card duel that plays offline in a desktop browser from
static files. You are the Tidecaller; the Stormwright holds the far side of
the table. Both start at 30 HP. Play cards, pay their mana, and call the
tide — play two cards of one tide in a turn and the second one **SURGES**
+2.

## The tides

- **Ember** (red flame) — deals damage.
- **Kelp** (green leaf) — shields and heals.
- **Tide** (blue wave) — draws cards, steals mana, and hits harder the
  fuller your hand is.

24 cards, 8 per tide. Mana starts at 3, grows by 1 each turn to 8. Draw 2
cards a turn, hand of 5. The Stormwright telegraphs its plan in the middle
of the table, so you can shield up, heal, or race it.

## How it plays

Click a card to play it, then **End Turn**. The Stormwright answers one
card at a time so you can watch its plan land. Reduce it to 0 HP to win;
reach 0 yourself and the storm takes the sea.

## Run it

```sh
node serve.ts   # game/ on http://localhost:8080
```

Open `game/index.html` in desktop Chrome. No build step, no network
request: every file the game loads sits under `game/`, and its sounds are
synthesized with WebAudio.

## Files

- `game/index.html` — the table: title, duel and end screens
- `game/style.css` — the storm-sea table and the card faces
- `game/cards.js` — the 24-card deck and the three tides
- `game/engine.js` — turns, mana, Surge, damage, shield, win and loss
- `game/ai.js` — the Stormwright's brain and its telegraphed intent
- `game/ui.js` — rendering the table, hands, log and floating numbers
- `game/sound.js` — synthesized blips, no audio files
- `game/main.js` — boot, buttons, the AI's turn, screenshot states
- `main.ts` — hands the game in: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` with the vendored library

## License

MIT — see [LICENSE](LICENSE).

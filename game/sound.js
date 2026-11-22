// sound.js — tiny synthesized sounds, no audio files, no network.
// One clear job: every blip the table makes, from one WebAudio context.

let ctx = null;
let muted = false;

export function setMuted(value) { muted = value; }
export function isMuted() { return muted; }

function audio() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// A short tone: frequency in Hz, length in seconds, kind of wave, volume.
function tone(freq, seconds, type = 'sine', volume = 0.08, when = 0) {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ac.currentTime + when);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + when + seconds);
  osc.connect(gain).connect(ac.destination);
  osc.start(ac.currentTime + when);
  osc.stop(ac.currentTime + when + seconds + 0.02);
}

export const sfx = {
  play: () => { tone(520, 0.09, 'triangle', 0.09); tone(780, 0.12, 'triangle', 0.06, 0.05); },
  surge: () => { tone(660, 0.08, 'square', 0.05); tone(880, 0.1, 'square', 0.05, 0.06); tone(1320, 0.14, 'sine', 0.06, 0.12); },
  damage: () => { tone(140, 0.18, 'sawtooth', 0.1); tone(90, 0.22, 'sine', 0.12, 0.03); },
  shield: () => { tone(440, 0.12, 'sine', 0.07); tone(587, 0.16, 'sine', 0.06, 0.07); },
  draw: () => { tone(980, 0.06, 'triangle', 0.05); },
  turn: () => { tone(392, 0.1, 'triangle', 0.06); },
  win: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.09, i * 0.11)); },
  lose: () => { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'sine', 0.08, i * 0.13)); },
};

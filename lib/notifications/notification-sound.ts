// Synthesized via Web Audio API rather than an <audio> file — a two-note
// chime is easy to generate on the fly and avoids shipping/licensing an
// audio asset for one short sound effect.

const STORAGE_KEY = "afrobraid.notifications.sound-enabled";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!audioContext) audioContext = new AudioContextCtor();
  return audioContext;
}

export function isNotificationSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(STORAGE_KEY) !== "off";
}

export function setNotificationSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
}

function playTone(
  ctx: AudioContext,
  startTime: number,
  frequency: number,
  duration: number
) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  // Quick fade in/out envelope so the tone doesn't click at the edges.
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.2, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

export function playNotificationSound(): void {
  if (!isNotificationSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const resume = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();
  resume
    .then(() => {
      const now = ctx.currentTime;
      // Two-note rising "ding-dong" chime.
      playTone(ctx, now, 880, 0.16);
      playTone(ctx, now + 0.1, 1318.5, 0.2);
    })
    .catch(() => {
      // Browser autoplay policy blocked audio because there's been no user
      // gesture yet on this page — the socket can connect and fire this
      // before any click happens. Safe to ignore; it's a nice-to-have.
    });
}

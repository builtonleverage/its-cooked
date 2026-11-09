/** Sound, vibration and system-notification alerts. */

let ctx: AudioContext | null = null;

/** Browsers (esp. iOS) only allow audio after a user gesture — call this from taps. */
export function unlockAudio() {
  try {
    ctx ??= new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    /* no audio */
  }
}

function tone(freq: number, start: number, dur: number, gain = 0.25) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(start);
  o.stop(start + dur + 0.05);
}

export function playChime(kind: 'check' | 'done') {
  unlockAudio();
  if (!ctx) return;
  const t = ctx.currentTime + 0.01;
  if (kind === 'check') {
    tone(880, t, 0.25);
    tone(1175, t + 0.2, 0.35);
  } else {
    [0, 0.18, 0.36].forEach((d, i) => tone([784, 988, 1319][i], t + d, 0.3, 0.35));
    [0.8, 0.98, 1.16].forEach((d, i) => tone([784, 988, 1319][i], t + d, 0.3, 0.35));
  }
}

export function vibrate(kind: 'check' | 'done') {
  try {
    navigator.vibrate?.(kind === 'done' ? [400, 150, 400, 150, 600] : [200, 100, 200]);
  } catch {
    /* unsupported */
  }
}

export function notificationsSupported() {
  return typeof Notification !== 'undefined';
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

export async function notify(title: string, body: string, tag: string) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  const options: NotificationOptions & { renotify?: boolean; vibrate?: number[] } = {
    body,
    tag,
    renotify: true,
    icon: `${import.meta.env.BASE_URL}pwa-192.png`,
    badge: `${import.meta.env.BASE_URL}pwa-192.png`,
    vibrate: [300, 100, 300],
    data: { url: `${import.meta.env.BASE_URL}#/timers` },
  };
  try {
    // iOS & Android PWAs require notifications to come from the service worker registration.
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return void (await reg.showNotification(title, options));
    new Notification(title, options);
  } catch {
    /* ignore */
  }
}

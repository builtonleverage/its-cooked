import { describe, expect, it } from 'vitest';
import { advance, createTimer, pause, remainingMs, resume, addTime } from './timerLogic';
import { detectTimers } from './util';

const spec = { label: 'Bake', seconds: 480, checks: [{ atSeconds: 240, label: 'Rotate' }, { atSeconds: 360, label: 'Doneness' }] };

describe('timer logic', () => {
  it('counts down from absolute end time (survives reloads)', () => {
    const t = createTimer(spec, { id: 'a', now: 0 });
    expect(remainingMs(t, 100_000)).toBe(380_000);
  });

  it('fires checks then done exactly once', () => {
    let timers = [createTimer(spec, { id: 'a', now: 0 })];
    let r = advance(timers, 239_000);
    expect(r.events).toHaveLength(0);
    r = advance(timers, 241_000);
    expect(r.events[0]).toMatchObject({ kind: 'check', label: 'Rotate' });
    timers = r.timers;
    expect(advance(timers, 242_000).events).toHaveLength(0);
    r = advance(timers, 480_500);
    expect(r.events).toEqual([expect.objectContaining({ kind: 'done' })]);
    expect(advance(r.timers, 500_000).events).toHaveLength(0);
  });

  it('after a long suspension only the done alert fires', () => {
    const r = advance([createTimer(spec, { id: 'a', now: 0 })], 1_000_000);
    expect(r.events.map((e) => e.kind)).toEqual(['done']);
  });

  it('pause/resume keeps remaining time', () => {
    const p = pause(createTimer(spec, { id: 'a', now: 0 }), 100_000);
    expect(remainingMs(p, 900_000)).toBe(380_000);
    const r = resume(p, 900_000);
    expect(remainingMs(r, 900_000)).toBe(380_000);
    expect(remainingMs(addTime(r, 60, 900_000), 900_000)).toBe(440_000);
  });
});

describe('detectTimers', () => {
  it('parses ranges and checks', () => {
    const t = detectTimers('Close the lid and bake for 6–8 minutes per batch. Check at 4 minutes and rotate.');
    expect(t).toHaveLength(1);
    expect(t[0].seconds).toBe(480);
    expect(t[0].checks.map((c) => c.atSeconds).sort()).toEqual([240, 360]);
  });
  it('parses simple durations', () => {
    expect(detectTimers('Let it rest for 20 minutes.')[0]).toMatchObject({ seconds: 1200, label: 'Let it rest' });
    expect(detectTimers('Simmer 1 hour')[0].seconds).toBe(3600);
  });
});

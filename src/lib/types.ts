export interface ImageCredit {
  /** Remote URL the image was fetched from (or a bundled asset path). */
  url: string;
  /** Page describing the image + licence (e.g. Wikimedia Commons file page). */
  sourceUrl: string;
  title: string;
  author: string;
  license: string; // short name, e.g. "CC BY-SA 4.0", "CC0", "Public domain"
  licenseUrl?: string;
  provider: 'wikimedia' | 'openverse' | 'bundled';
}

export interface TimerSpec {
  id: string;
  label: string;
  /** Total length in seconds. */
  seconds: number;
  /** Optional check-in alerts, in seconds from start (e.g. mid-point check). */
  checks: { atSeconds: number; label: string }[];
}

export interface Step {
  id: string;
  text: string;
  timers: TimerSpec[];
  /** Optional diagram/image for this step. */
  image?: ImageCredit;
}

export interface Ingredient {
  id: string;
  quantity: string;
  unit: string;
  name: string;
  note?: string;
}

export interface Recipe {
  id: string;
  title: string;
  summary: string;
  servings: number;
  prepMinutes?: number;
  cookMinutes?: number;
  tags: string[];
  ingredients: Ingredient[];
  steps: Step[];
  notes: string;
  image?: ImageCredit;
  favourite?: boolean;
  createdAt: number;
  updatedAt: number;
  /** Set when the user taps "Download for offline". */
  offlineAt?: number;
}

export type TimerStatus = 'running' | 'paused' | 'done';

export interface ActiveTimer {
  id: string;
  label: string;
  recipeId?: string;
  recipeTitle?: string;
  stepIndex?: number;
  totalSeconds: number;
  /** Epoch ms when it will finish (valid while running). */
  endAt: number;
  /** Remaining ms (valid while paused). */
  remainingMs: number;
  status: TimerStatus;
  checks: { atSeconds: number; label: string; fired: boolean }[];
  doneFired: boolean;
  createdAt: number;
}

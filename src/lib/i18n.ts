import { useSyncExternalStore } from 'react';

export type Lang = 'en' | 'hi';
const KEY = 'its-cooked:lang';

let lang: Lang = (() => {
  try {
    return localStorage.getItem(KEY) === 'hi' ? 'hi' : 'en';
  } catch {
    return 'en';
  }
})();
const subs = new Set<() => void>();
const apply = () => {
  if (typeof document !== 'undefined') document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';
};
apply();

export function setLang(l: Lang) {
  lang = l;
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* private mode */
  }
  apply();
  subs.forEach((f) => f());
}
export const getLang = () => lang;
export function useLang(): Lang {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => void subs.delete(f);
    },
    () => lang,
  );
}

/* UI strings. Hindi uses everyday kitchen words people actually say (atta, timer, offline…). */
const dict = {
  recipes: ['Recipes', 'रेसिपी'],
  timers: ['Timers', 'टाइमर'],
  offline: ['Offline', 'ऑफ़लाइन'],
  settings: ['Settings', 'सेटिंग्स'],
  recipeCount: ['{n} recipes', '{n} रेसिपी'],
  recipeCount1: ['1 recipe', '1 रेसिपी'],
  newRecipe: ['New recipe', 'नई रेसिपी'],
  search: ['Search recipes, ingredients, tags…', 'रेसिपी, सामग्री, टैग खोजें…'],
  all: ['All', 'सभी'],
  noMatch: ['No recipes match your search.', 'आपकी खोज से कोई रेसिपी नहीं मिली।'],
  noRecipes: ['No recipes yet — add your first one!', 'अभी कोई रेसिपी नहीं — पहली जोड़ें!'],
  min: ['min', 'मिनट'],
  servings: ['servings', 'लोगों के लिए'],
  prep: ['prep', 'तैयारी'],
  cook: ['cook', 'पकाना'],
  steps: ['steps', 'चरण'],
  startCook: ['Start Cook Mode', 'कुक मोड शुरू करें'],
  downloadOffline: ['Download for offline', 'ऑफ़लाइन के लिए सेव करें'],
  savedOffline: ['Saved offline', 'ऑफ़लाइन सेव है'],
  saving: ['Saving…', 'सेव हो रहा है…'],
  ingredients: ['Ingredients', 'सामग्री'],
  method: ['Method', 'विधि'],
  notes: ['Notes', 'नोट्स'],
  imageCredits: ['Image credits', 'चित्र श्रेय'],
  deleteRecipe: ['Delete recipe', 'रेसिपी हटाएँ'],
  start: ['Start', 'शुरू'],
  checkAt: ['check at {t}', '{t} पर जाँचें'],
  stepOf: ['Step {n} of {total}', 'चरण {n} / {total}'],
  finished: ['Finished', 'पूरा हुआ'],
  next: ['Next', 'आगे'],
  finish: ['Finish', 'पूरा'],
  itsCooked: ["It's cooked!", 'बन गया!'],
  enjoy: ['Enjoy your {title}.', '{title} का आनंद लें।'],
  startOver: ['Start over', 'फिर से शुरू'],
  done: ['Done', 'हो गया'],
  doneBang: ['Done!', 'हो गया!'],
  otherTimers: ['Other running timers', 'बाकी चल रहे टाइमर'],
  paused: ['Paused', 'रुका हुआ'],
  stop: ['Stop', 'बंद करें'],
  isDone: ['{label} is done', '{label} पूरा हुआ'],
  checkNow: ['Check now', 'अभी जाँचें'],
  ok: ['OK', 'ठीक है'],
  plus1: ['+1 min', '+1 मिनट'],
  offlineBar: ['Offline — your recipes and timers still work', 'ऑफ़लाइन — आपकी रेसिपी और टाइमर फिर भी चलेंगे'],
  readyOffline: ['Ready to work offline', 'अब ऑफ़लाइन भी चलेगा'],
  newVersion: ['New version available', 'नया वर्ज़न उपलब्ध है'],
  update: ['Update', 'अपडेट'],
  quickTimer: ['Quick timer', 'झटपट टाइमर'],
  noTimers: ['No timers yet. Start one from a recipe step, or add a quick timer below.', 'अभी कोई टाइमर नहीं। रेसिपी के किसी चरण से या नीचे से टाइमर शुरू करें।'],
  clearFinished: ['Clear finished', 'पूरे हुए हटाएँ'],
  timerName: ['Name (e.g. Tandoor preheat)', 'नाम (जैसे तंदूर गरम करना)'],
  halfwayNote: ['Quick timers of 4 min or more include a halfway check alert.', '4 मिनट या उससे लंबे टाइमर में आधे समय पर जाँच का अलर्ट होता है।'],
  enableNotif: ['Turn on notifications so timers can alert you when the app is in the background.', 'नोटिफ़िकेशन चालू करें ताकि ऐप बैकग्राउंड में हो तब भी टाइमर बता सके।'],
  translate: ['Translate', 'अनुवाद'],
  language: ['Language', 'भाषा'],
  translateCta: ['This recipe is in English. Translate it to Hindi?', 'यह रेसिपी अंग्रेज़ी में है। हिंदी में अनुवाद करें?'],
  translateBtn: ['Translate to Hindi', 'हिंदी में अनुवाद करें'],
  translating: ['Translating… {p}%', 'अनुवाद हो रहा है… {p}%'],
  translateOutdated: ['The recipe changed since it was translated.', 'अनुवाद के बाद रेसिपी बदली गई है।'],
  retranslate: ['Update translation', 'अनुवाद अपडेट करें'],
  machineNote: ['Machine translation — saved on this device and works offline.', 'मशीन अनुवाद — इस डिवाइस पर सेव है और ऑफ़लाइन भी चलेगा।'],
  translateFailed: ['Translation failed: {e}', 'अनुवाद नहीं हो सका: {e}'],
  narrate: ['AI voice guide', 'AI आवाज़ गाइड'],
  readAloud: ['Read step aloud', 'चरण पढ़कर सुनाएँ'],
  stopReading: ['Stop reading', 'पढ़ना बंद करें'],
  ingredientsShow: ['Show ingredients', 'सामग्री दिखाएँ'],
  exit: ['Exit Cook Mode', 'कुक मोड बंद करें'],
  back: ['Back', 'वापस'],
  edit: ['Edit recipe', 'रेसिपी बदलें'],
} as const satisfies Record<string, readonly [string, string]>;

export type StrKey = keyof typeof dict;

export function t(key: StrKey, vars?: Record<string, string | number>, l: Lang = lang): string {
  let s: string = dict[key][l === 'hi' ? 1 : 0];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

/** Hook form so components re-render when the language changes. */
export function useT() {
  const l = useLang();
  return (key: StrKey, vars?: Record<string, string | number>) => t(key, vars, l);
}

/** Durations like "15 min" / "15 मिनट". */
export function fmtDur(seconds: number, l: Lang = lang): string {
  if (seconds < 60) return l === 'hi' ? `${seconds} सेकंड` : `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  const H = l === 'hi' ? 'घंटा' : 'h';
  const M = l === 'hi' ? 'मिनट' : 'min';
  if (h && m) return `${h} ${H} ${m} ${M}`;
  if (h) return `${h} ${H}`;
  return `${m} ${M}`;
}

import { useMemo, useState } from 'react';
import type { Recipe } from '../lib/types';
import { AI_APPS, appUrl, buildPrompt, copyText, type NarrationLang, type NarrationMode } from '../lib/narration';
import { getLang } from '../lib/i18n';
import { Sheet } from './Sheet';
import { Icon } from './Icon';

const hi = () => getLang() === 'hi';

export function NarrateSheet({ recipe, fromStep, onClose }: { recipe: Recipe; fromStep?: number; onClose: () => void }) {
  const [lang, setLang] = useState<NarrationLang>(getLang() === 'hi' ? 'hi' : 'en');
  const [mode, setMode] = useState<NarrationMode>('walkthrough');
  const generated = useMemo(() => buildPrompt(recipe, { lang, mode, fromStep }), [recipe, lang, mode, fromStep]);
  const [edited, setEdited] = useState<string | null>(null);
  const prompt = edited ?? generated;
  const [status, setStatus] = useState('');

  const links = useMemo(() => AI_APPS.map((app) => ({ app, ...appUrl(app, prompt) })), [prompt]);

  // A real link (not window.open) so it works in installed apps, embedded pages and pop-up blockers.
  // The copy starts in the same tap, before the browser leaves for the AI app.
  const onLaunch = (app: (typeof AI_APPS)[number], prefilled: boolean) => {
    void copyText(prompt).then((ok) =>
      setStatus(
        `${ok ? (hi() ? 'प्रॉम्प्ट कॉपी हो गया।' : 'Prompt copied.') : hi() ? 'कॉपी नहीं हो सका — नीचे से कॉपी करें।' : "Couldn't copy — copy it from the box below."} ${
          prefilled ? (hi() ? `${app.name} में प्रॉम्प्ट पहले से भरा है — बस भेजें।` : `It's pre-filled in ${app.name} — just send it.`) : hi() ? `${app.name} में पेस्ट करें।` : `Paste it into ${app.name}.`
        } ${hi() ? app.voiceTipHi : app.voiceTip}`,
      ),
    );
  };

  return (
    <Sheet title={hi() ? 'AI आवाज़ गाइड' : 'AI voice guide'} onClose={onClose} tall>
      <p className="muted small">
        {hi()
          ? 'अपनी पसंद का AI ऐप चुनें। हम इस रेसिपी के लिए एक तैयार प्रॉम्प्ट कॉपी करके ऐप खोल देंगे — फिर वॉइस मोड चालू करें और AI आपको बोलकर कदम-दर-कदम बताएगा।'
          : 'Pick your favourite AI app. We copy a ready-made prompt for this recipe and open the app — then switch on its voice mode and it will talk you through the cook, step by step.'}
      </p>

      <h3 className="label">{hi() ? 'भाषा' : 'Narration language'}</h3>
      <div className="segmented" role="radiogroup">
        {(
          [
            ['en', 'English'],
            ['hi', 'हिंदी'],
            ['hinglish', 'Hinglish'],
          ] as const
        ).map(([v, label]) => (
          <button key={v} role="radio" aria-checked={lang === v} className={lang === v ? 'on' : ''} onClick={() => (setLang(v), setEdited(null))}>
            {label}
          </button>
        ))}
      </div>

      <h3 className="label">{hi() ? 'तरीका' : 'Style'}</h3>
      <div className="segmented" role="radiogroup">
        {(
          [
            ['walkthrough', hi() ? 'कदम-दर-कदम' : 'Step by step'],
            ['readall', hi() ? 'पूरी पढ़ें' : 'Read it all'],
            ['coach', hi() ? 'टिप्स व कोच' : 'Tips & coach'],
          ] as const
        ).map(([v, label]) => (
          <button key={v} role="radio" aria-checked={mode === v} className={mode === v ? 'on' : ''} onClick={() => (setMode(v), setEdited(null))}>
            {label}
          </button>
        ))}
      </div>

      <div className="ai-grid">
        {links.map(({ app, url, prefilled }) => (
          <a key={app.id} className="btn ai-btn" href={url} target="_blank" rel="noopener noreferrer" onClick={() => onLaunch(app, prefilled)}>
            <span className={`ai-dot ${app.id}`} aria-hidden>
              {app.name[0]}
            </span>
            {app.name}
          </a>
        ))}
        {!__ARTIFACT__ && 'share' in navigator && (
          <button
            className="btn ai-btn"
            onClick={async () => {
              void copyText(prompt);
              try {
                await navigator.share({ title: recipe.title, text: prompt });
              } catch {
                /* cancelled */
              }
            }}
          >
            <Icon name="share" /> {hi() ? 'अन्य ऐप' : 'Other app'}
          </button>
        )}
      </div>

      {status && (
        <p className="notice ok-notice" role="status">
          <Icon name="check" /> {status}
        </p>
      )}

      <div className="row between">
        <h3 className="label">{hi() ? 'प्रॉम्प्ट (बदल सकते हैं)' : 'Prompt (you can edit it)'}</h3>
        <button
          className="btn small"
          onClick={async () => setStatus((await copyText(prompt)) ? (hi() ? 'प्रॉम्प्ट कॉपी हो गया।' : 'Prompt copied.') : hi() ? 'कॉपी नहीं हो सका।' : "Couldn't copy.")}
        >
          {hi() ? 'कॉपी करें' : 'Copy'}
        </button>
      </div>
      <textarea className="input prompt-box" rows={10} value={prompt} onChange={(e) => setEdited(e.target.value)} aria-label="Prompt" />
      <p className="small muted">
        {hi()
          ? 'आपकी रेसिपी सिर्फ़ तभी उस AI ऐप में जाती है जब आप उसे भेजते हैं। उस ऐप की अपनी प्राइवेसी शर्तें लागू होती हैं।'
          : 'Your recipe only goes to the AI app when you send it there; that app’s own privacy terms apply.'}
      </p>
    </Sheet>
  );
}

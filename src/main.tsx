import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/app.css';
import { ensureSeed } from './lib/bootstrap';
import { unlockAudio } from './lib/alerts';

// Audio can only start after a user gesture; unlock on the first tap anywhere.
['pointerdown', 'keydown'].forEach((e) => window.addEventListener(e, unlockAudio, { once: true, passive: true }));

void ensureSeed();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import { useEffect, useState } from 'react';
import api from '../api';

const LANGS = [
  { code: 'en', label: 'English', voice: 'en-IN' },
  { code: 'ta', label: 'தமிழ்', voice: 'ta-IN' },
  { code: 'hi', label: 'हिन्दी', voice: 'hi-IN' }
];

export default function Summary({ profileId, refreshKey }) {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/measurements/summary', { params: { profileId, lang } })
      .then(r => setData(r.data))
      .catch(console.error);
  }, [profileId, lang, refreshKey]);

  const changeLang = code => {
    setLang(code);
    localStorage.setItem('lang', code);
  };

  const speak = () => {
    if (!data || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const text = [data.overall, ...data.items.map(i => i.text), data.advice, data.disclaimer]
      .filter(Boolean).join(' ');
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANGS.find(l => l.code === lang).voice;
    window.speechSynthesis.speak(u);
  };

  return (
    <div>
      <div className="row" style={{ justifyContent: 'flex-start' }}>
        {LANGS.map(l => (
          <button key={l.code} className={l.code === lang ? '' : 'secondary'}
            onClick={() => changeLang(l.code)}>{l.label}</button>
        ))}
        <button className="secondary" onClick={speak}>🔊 Listen</button>
      </div>

      {data && (
        <div className="summary">
          <p><strong>{data.overall}</strong></p>
          <ul>
            {data.items.map(i => (
              <li key={i.testName} className={`sum ${i.status}`}>{i.text}</li>
            ))}
          </ul>
          {data.advice && <p>{data.advice}</p>}
          <p className="muted">{data.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
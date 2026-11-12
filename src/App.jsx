import React, { useState, useEffect } from 'react';
import { BookOpen, BarChart2, ChevronRight, ArrowLeft, Check, X, Plus, Trash2 } from 'lucide-react';
import { SECTIONS_DATA } from './data.jsx';

// Each topic is a lane. Lanes get deeper (lighter -> darker water) down the list.
const LANES = [
  { bg: '#C4E3E2', fg: '#08202E' },
  { bg: '#8FCBD2', fg: '#08202E' },
  { bg: '#4FAFC4', fg: '#08202E' },
  { bg: '#1F7C9C', fg: '#FFFFFF' },
  { bg: '#0B4A66', fg: '#FFFFFF' },
];

const today = () => new Date().toISOString().split('T')[0];

/* ---------- Guide ---------- */

const GuideView = ({ onOpen }) => (
  <div className="rise">
    <section className="px-5 pt-8 pb-10">
      <div className="text-xl font-black tracking-tight">DeepDive</div>
      <h1 className="mt-10 text-[104px] font-black leading-[.8] tracking-tighter">70%</h1>
      <p className="mt-4 text-3xl font-black leading-tight">טכניקה ופיזיקה.</p>
      <p className="mt-2 max-w-[28ch] text-lg">ורק 30% כושר. בחרי מסלול ותצללי לעומק.</p>
    </section>

    {SECTIONS_DATA.map((s, i) => (
      <React.Fragment key={s.id}>
        <div className="rope" />
        <button className="lane" style={{ background: LANES[i].bg, color: LANES[i].fg }} onClick={() => onOpen(s.id)}>
          <span className="lane-n">{i + 1}</span>
          <span className="flex-1">
            <span className="block text-2xl font-black leading-tight">{s.title}</span>
            <span className="mt-1 block text-sm opacity-85">{s.summary}</span>
          </span>
          <ArrowLeft size={22} />
        </button>
      </React.Fragment>
    ))}
    <div className="rope" />

    <section className="px-5 py-14" style={{ background: 'var(--ink)', color: 'var(--tile)' }}>
      <p className="text-xs font-bold opacity-60">טיפ יומי</p>
      <p className="serif mt-3 text-3xl leading-snug">תקשיבי לשקט של המים; אם שקט לך, את שוחה נכון.</p>
    </section>
  </div>
);

const DetailView = ({ data, index, onClose }) => {
  const d = data.details;
  const L = LANES[index];
  return (
    <div className="rise">
      <div className="sticky top-0 z-20 flex items-center gap-2 px-5 py-3" style={{ background: L.bg, color: L.fg }}>
        <button onClick={onClose} className="flex items-center gap-1 text-sm font-black">
          <ChevronRight size={20} /> כל המסלולים
        </button>
        <span className="mr-auto text-sm font-black opacity-70">מסלול {index + 1}</span>
      </div>

      <header className="px-5 pb-12 pt-6" style={{ background: L.bg, color: L.fg }}>
        <div className="lane-n" style={{ fontSize: 120 }}>{index + 1}</div>
        <h2 className="mt-6 text-5xl font-black leading-none tracking-tight">{data.title}</h2>
        <p className="serif mt-5 text-2xl leading-snug">{d.concept}</p>
      </header>
      <div className="rope" />

      <section className="px-5 py-10">
        <h3 className="flex items-center gap-2 text-xl font-black"><Check size={22} /> לעשות</h3>
        <ul className="mt-4 space-y-3">
          {d.dos.map((t, i) => <li key={i} className="leading-snug">{t}</li>)}
        </ul>
      </section>
      <section className="px-5 py-10" style={{ background: 'var(--tile-2)' }}>
        <h3 className="flex items-center gap-2 text-xl font-black"><X size={22} style={{ color: 'var(--accent)' }} /> להימנע</h3>
        <ul className="mt-4 space-y-3">
          {d.donts.map((t, i) => <li key={i} className="leading-snug">{t}</li>)}
        </ul>
      </section>

      <section className="py-10">
        <h3 className="px-5 text-xl font-black">סריקת גוף</h3>
        <div className="mt-4">
          {d.bodyCheck.map((t, i) => (
            <div key={i} className="flex gap-4 px-5 py-4" style={i % 2 ? {} : { background: 'rgba(8,32,46,.05)' }}>
              <span className="w-8 shrink-0 text-2xl font-black leading-none">{String(i + 1).padStart(2, '0')}</span>
              <span className="leading-snug">{t}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-14" style={{ background: 'var(--ink)', color: 'var(--tile)' }}>
        <p className="text-xs font-bold opacity-60">הדימוי המנטלי</p>
        <h3 className="mt-3 text-4xl font-black leading-none" style={{ color: 'var(--accent)' }}>{d.imagery.title}</h3>
        <p className="serif mt-5 text-2xl leading-snug">{d.imagery.text}</p>
      </section>

      <section className="pb-32 pt-10">
        <div className="px-5">
          <h3 className="text-2xl font-black">המעמקים</h3>
          <p className="mt-1 text-sm opacity-70">הפיזיקה והביומכניקה שמאחורי התנועה · {d.deepDive.length}</p>
        </div>
        <div className="mt-5">
          {d.deepDive.map((item, i) => (
            <details key={i} className="acc">
              <summary>{item.title}</summary>
              <p>{item.content}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
};

/* ---------- Tracker ---------- */

const Trend = ({ logs }) => {
  const pts = [...logs].reverse().filter(l => Number(l.strokes) > 0);
  if (pts.length < 2) return null;
  const W = 300, H = 110, P = 10;
  const v = pts.map(l => Number(l.strokes));
  const min = Math.min(...v), max = Math.max(...v), r = max - min || 1;
  const xy = v.map((n, i) => [P + (i / (v.length - 1)) * (W - 2 * P), P + (1 - (n - min) / r) * (H - 2 * P)]);
  const last = xy[xy.length - 1];
  return (
    <section className="px-5 py-10">
      <h3 className="text-xl font-black">מגמת SWOLF</h3>
      <p className="mt-1 text-sm opacity-70">נמוך יותר = יעיל יותר</p>
      <div dir="ltr" className="mt-5">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="גרף מגמת SWOLF">
          <polyline fill="none" stroke="#08202E" strokeWidth="2.5" strokeLinejoin="round" points={xy.map(p => p.join(',')).join(' ')} />
          <circle cx={last[0]} cy={last[1]} r="6" fill="#FF5A1F" />
        </svg>
        <div className="mt-2 flex justify-between text-xs font-bold opacity-70">
          <span>{pts[0].date}</span><span>{pts[pts.length - 1].date}</span>
        </div>
      </div>
    </section>
  );
};

const StatsView = () => {
  const [logs, setLogs] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: today(), distance: '', time: '', strokes: '' });

  useEffect(() => {
    try { setLogs(JSON.parse(localStorage.getItem('swimLogs')) || []); } catch (e) { /* empty */ }
  }, []);

  const persist = (next) => {
    setLogs(next);
    try { localStorage.setItem('swimLogs', JSON.stringify(next)); } catch (e) { /* empty */ }
  };

  const save = () => {
    const m = /^(\d{1,3}):([0-5]?\d)$/.exec(form.time.trim());
    const dist = Number(form.distance);
    if (!m || !dist) return;
    const p = ((Number(m[1]) * 60 + Number(m[2])) / dist) * 100;
    const pace = `${Math.floor(p / 60)}:${String(Math.floor(p % 60)).padStart(2, '0')}`;
    const entry = { id: Date.now(), ...form, time: form.time.trim(), pace, swolf: form.strokes };
    persist([entry, ...logs].sort((a, b) => new Date(b.date) - new Date(a.date)));
    setOpen(false);
    setForm({ date: today(), distance: '', time: '', strokes: '' });
  };

  const total = logs.reduce((a, l) => a + (Number(l.distance) || 0), 0);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="rise pb-32">
      <section className="px-5 pb-10 pt-8" style={{ background: 'var(--ink)', color: 'var(--tile)' }}>
        <p className="text-xl font-black tracking-tight">המעקב שלי</p>
        <p className="mt-10 text-xs font-bold opacity-60">סה״כ מטרים</p>
        <p className="text-[84px] font-black leading-[.9] tracking-tighter">{total.toLocaleString('en-US')}</p>
        <p className="mt-5 text-sm opacity-80">{logs.length} אימונים · אחרון: {logs[0]?.date || '—'}</p>
      </section>
      <div className="rope" />

      <Trend logs={logs} />

      <section className="px-5 pb-10 pt-6">
        {!open ? (
          <button className="btn" onClick={() => setOpen(true)}><Plus size={20} /> הוספת אימון</button>
        ) : (
          <div className="rise -mx-5 px-5 py-8" style={{ background: 'var(--tile-2)' }}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              <label><span className="label">תאריך</span><input className="field" type="date" value={form.date} onChange={set('date')} /></label>
              <label><span className="label">מרחק (מטרים)</span><input className="field" type="number" inputMode="numeric" placeholder="800" value={form.distance} onChange={set('distance')} /></label>
              <label><span className="label">זמן (דק:שנ)</span><input className="field" type="text" inputMode="numeric" placeholder="30:00" value={form.time} onChange={set('time')} /></label>
              <label><span className="label">SWOLF / דופק</span><input className="field" type="number" inputMode="numeric" placeholder="67" value={form.strokes} onChange={set('strokes')} /></label>
            </div>
            <div className="mt-8 flex gap-3">
              <button className="btn flex-1" onClick={save}>שמירה</button>
              <button className="flex-1 font-bold" onClick={() => setOpen(false)}>ביטול</button>
            </div>
          </div>
        )}
      </section>

      <section>
        <h3 className="px-5 pb-3 text-xl font-black">היסטוריה</h3>
        {logs.map(l => (
          <div key={l.id} className="row">
            <div>
              <div className="text-2xl font-black leading-none">{l.distance}<span className="text-sm font-bold"> מ׳</span></div>
              <div className="mt-1 text-xs opacity-65">{l.date}</div>
            </div>
            <div className="text-left"><div className="font-black">{l.time}</div><div className="text-xs opacity-65">קצב {l.pace}</div></div>
            <div className="text-left"><div className="font-black">{l.swolf || '—'}</div><div className="text-xs opacity-65">SWOLF</div></div>
            <button onClick={() => persist(logs.filter(x => x.id !== l.id))} aria-label="מחיקת אימון" className="p-2 opacity-50 hover:opacity-100"><Trash2 size={18} /></button>
          </div>
        ))}
        {logs.length === 0 && <p className="px-5 py-10 text-lg">אין עדיין אימונים. צאי לשחות!</p>}
      </section>
    </div>
  );
};

/* ---------- App ---------- */

const SwimGuide = () => {
  const [view, setView] = useState('guide');
  const [active, setActive] = useState(null);
  const index = SECTIONS_DATA.findIndex(s => s.id === active);

  useEffect(() => { window.scrollTo(0, 0); }, [view, active]);

  return (
    <div dir="rtl" className="mx-auto min-h-screen w-full max-w-md" style={{ background: 'var(--tile)' }}>
      <main>
        {view === 'guide' && index < 0 && <GuideView onOpen={setActive} />}
        {view === 'guide' && index >= 0 && <DetailView data={SECTIONS_DATA[index]} index={index} onClose={() => setActive(null)} />}
        {view === 'stats' && <StatsView />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md" style={{ background: 'var(--tile-2)' }}>
        <button className="tab" aria-current={view === 'guide' ? 'page' : undefined} onClick={() => { setView('guide'); setActive(null); }}>
          <BookOpen size={22} /> המדריך
        </button>
        <button className="tab" aria-current={view === 'stats' ? 'page' : undefined} onClick={() => setView('stats')}>
          <BarChart2 size={22} /> המעקב שלי
        </button>
      </nav>
    </div>
  );
};

export default SwimGuide;

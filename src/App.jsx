import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BookOpen, BarChart2, Search, X, Check, Plus, Trash2, ArrowRight, ChevronLeft } from 'lucide-react';
import { SECTIONS_DATA } from './data.jsx';

/* One colour per topic: strong (c) for white text, tint (t) for panels. */
const TONES = [
  { c: '#0F7C8A', t: '#D9EEF0' },
  { c: '#2563A8', t: '#DCE7F6' },
  { c: '#C2401F', t: '#FBE0D8' },
  { c: '#1A7A4E', t: '#DCEFE4' },
  { c: '#8A5B00', t: '#F6E8C8' },
];

const EMOJI = /[\u{1F300}-\u{1FAFF}\u2600-\u27BF\uFE0F]/gu;
const clean = (s) => s.replace(EMOJI, '').replace(/^\s*\d+\.\s*/, '').replace(/^\s*תרגיל \d+:\s*/, '').trim();
const prep = (s) => s.details.deepDive.map((d, i) => {
  const [name, ...rest] = d.title.split(' - ');
  return { i, ex: d.title.includes('🏋️'), title: clean(name), tag: clean(rest.join(' - ')), content: d.content };
});
const ITEMS = SECTIONS_DATA.map(prep);
const INDEX = ITEMS.flatMap((list, t) => list.map((x) => ({ ...x, t })));
const TOTAL_TIPS = INDEX.length;

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } };

const iso = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseD = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const secs = (t = '') => {
  const v = String(t).trim();
  const m = /^(\d{1,3}):([0-5]?\d)$/.exec(v);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  return /^\d{1,3}$/.test(v) ? Number(v) * 60 : 0;
};
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const pace = (sec, dist) => (sec && dist ? mmss(Math.round((sec / dist) * 100)) : '—');

/* ---------- Guide: home ---------- */

const Home = ({ read, onOpen }) => {
  const [q, setQ] = useState('');
  const n = q.trim().toLowerCase();
  const hits = useMemo(() => (n.length < 2 ? null : INDEX.filter((x) => `${x.title} ${x.content}`.toLowerCase().includes(n)).slice(0, 30)), [n]);
  const day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
  const dk = day % SECTIONS_DATA.length;
  const im = SECTIONS_DATA[dk].details.imagery;

  return (
    <div className="view">
      <header className="gut hero">
        <div className="brand enter" style={{ '--d': 0 }}>DeepDive</div>
        <h1 className="enter" style={{ '--d': 1 }}>שחייה טובה היא 70% טכניקה.</h1>
        <p className="lead enter" style={{ '--d': 2 }}>{SECTIONS_DATA.length} נושאים ו-{TOTAL_TIPS} הסברים קצרים על הפיזיקה של התנועה במים.</p>
        <div className="split enter" style={{ '--d': 3 }} role="img" aria-label="70 אחוז טכניקה ופיזיקה, 30 אחוז כושר">
          <span className="split-a">טכניקה ופיזיקה · 70%</span>
          <span className="split-b">כושר · 30%</span>
        </div>
      </header>

      <div className="gut">
        <label className="search">
          <Search size={20} aria-hidden="true" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש בכל ההסברים, למשל: מרפק" aria-label="חיפוש בהסברים" />
          {q && <button type="button" onClick={() => setQ('')} aria-label="ניקוי חיפוש"><X size={18} /></button>}
        </label>
      </div>

      {hits ? (
        <section className="gut mt">
          <h2 className="h2">{hits.length ? `${hits.length} תוצאות` : 'לא נמצאו תוצאות'}</h2>
          <div className="stack">
            {hits.map((x) => (
              <button key={`${x.t}-${x.i}`} className="hit lift" style={{ '--c': TONES[x.t].c, '--t': TONES[x.t].t }} onClick={() => onOpen(x.t, x.i)}>
                <span className="chip">{SECTIONS_DATA[x.t].title}</span>
                <strong>{x.title}</strong>
                <span className="clamp">{x.content}</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="gut mt">
            <h2 className="h2">נושאים</h2>
            <div className="stack">
              {SECTIONS_DATA.map((s, i) => {
                const done = (read[s.id] || []).length;
                const all = ITEMS[i].length;
                return (
                  <button key={s.id} className="topic lift" style={{ '--c': TONES[i].c, '--t': TONES[i].t }} onClick={() => onOpen(i)}>
                    <span className="badge">{React.cloneElement(s.icon, { size: 24 })}</span>
                    <span className="grow">
                      <span className="topic-t">{s.title}</span>
                      <span className="topic-s">{s.subtitle}</span>
                      <span className="bar"><i style={{ width: `${(done / all) * 100}%` }} /></span>
                    </span>
                    <span className="count">{done}/{all}</span>
                    <ChevronLeft size={20} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="gut mt">
            <div className="today" style={{ '--c': TONES[dk].c, '--t': TONES[dk].t }}>
              <p className="eyebrow">הדימוי להיום · {SECTIONS_DATA[dk].title}</p>
              <h3>{im.title}</h3>
              <p className="serif">{im.text}</p>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

/* ---------- Guide: topic ---------- */

const Topic = ({ index, openItem, read, markRead, onBack }) => {
  const s = SECTIONS_DATA[index];
  const d = s.details;
  const items = ITEMS[index];
  const hasEx = items.some((x) => x.ex);
  const first = items.find((x) => x.i === openItem);
  const [tab, setTab] = useState(first ? (first.ex ? 'ex' : 'deep') : 'short');
  const [open, setOpen] = useState(openItem ?? null);
  const [ticks, setTicks] = useState([]);

  useEffect(() => {
    if (openItem != null) setTimeout(() => document.getElementById(`it${openItem}`)?.scrollIntoView({ block: 'center' }), 80);
  }, [openItem]);

  const toggle = (i) => {
    const next = open === i ? null : i;
    setOpen(next);
    if (next != null) markRead(s.id, i);
  };

  const list = (arr) => arr.map((x, n) => {
    const isOpen = open === x.i;
    const done = (read[s.id] || []).includes(x.i);
    return (
      <div key={x.i} id={`it${x.i}`} className={`acc${isOpen ? ' open' : ''}`}>
        <button className="acc-h" aria-expanded={isOpen} onClick={() => toggle(x.i)}>
          <span className={`acc-n${done ? ' done' : ''}`}>{done ? <Check size={16} /> : n + 1}</span>
          <span className="grow">{x.title}{x.tag && <em>{x.tag}</em>}</span>
          <span className="acc-x" aria-hidden="true" />
        </button>
        <div className="acc-b"><div><p>{x.content}</p></div></div>
      </div>
    );
  });

  const tabs = [['short', 'בקצרה'], ['deep', `לעומק · ${items.filter((x) => !x.ex).length}`], ...(hasEx ? [['ex', `תרגילים · ${items.filter((x) => x.ex).length}`]] : [])];

  return (
    <div className="view" style={{ '--c': TONES[index].c, '--t': TONES[index].t }}>
      <header className="gut topic-hero">
        <button className="back" onClick={onBack}><ArrowRight size={20} /> כל הנושאים</button>
        <h1 className="enter" style={{ '--d': 0 }}>{s.title}</h1>
        <p className="serif enter" style={{ '--d': 1 }}>{d.concept}</p>
      </header>

      <div className="tabs" role="tablist">
        {tabs.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => { setTab(k); window.scrollTo(0, 0); }}>{l}</button>
        ))}
      </div>

      {tab === 'short' && (
        <div className="gut mt stack-lg">
          <section className="panel">
            <h2 className="h2 row-i"><Check size={20} /> לעשות</h2>
            <ul>{d.dos.map((t, i) => <li key={i}>{t}</li>)}</ul>
          </section>
          <section className="panel no">
            <h2 className="h2 row-i"><X size={20} /> להימנע</h2>
            <ul>{d.donts.map((t, i) => <li key={i}>{t}</li>)}</ul>
          </section>
          <section>
            <h2 className="h2">סריקת גוף לפני כניסה למים</h2>
            <div className="stack">
              {d.bodyCheck.map((t, i) => (
                <button key={i} className={`check${ticks.includes(i) ? ' on' : ''}`} aria-pressed={ticks.includes(i)} onClick={() => setTicks(ticks.includes(i) ? ticks.filter((x) => x !== i) : [...ticks, i])}>
                  <span className="box">{ticks.includes(i) && <Check size={16} />}</span>{t}
                </button>
              ))}
            </div>
          </section>
          <section className="today solid">
            <p className="eyebrow">הדימוי המנטלי</p>
            <h3>{d.imagery.title}</h3>
            <p className="serif">{d.imagery.text}</p>
          </section>
        </div>
      )}
      {tab === 'deep' && <div className="mt pb">{list(items.filter((x) => !x.ex))}</div>}
      {tab === 'ex' && <div className="mt pb">{list(items.filter((x) => x.ex))}</div>}
    </div>
  );
};

/* ---------- Tracker ---------- */

const EMPTY = () => ({ date: iso(), distance: '', time: '', strokes: '' });

const Tracker = () => {
  const [logs, setLogs] = useState(() => load('swimLogs', []));
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState({});
  const [undo, setUndo] = useState(null);
  const timer = useRef();

  const persist = (next) => { setLogs(next); store('swimLogs', next); };
  const byDate = (a, b) => b.date.localeCompare(a.date);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = () => {
    const dist = Number(f.distance);
    const e = {};
    if (!dist || dist < 25) e.distance = 'הקלידי מרחק במטרים';
    if (!secs(f.time)) e.time = 'הקלידי זמן, למשל 30:00';
    setErr(e);
    if (Object.keys(e).length) return;
    persist([{ id: Date.now(), ...f, time: f.time.trim(), pace: pace(secs(f.time), dist), swolf: f.strokes }, ...logs].sort(byDate));
    setOpen(false); setF(EMPTY());
  };

  const remove = (l) => {
    persist(logs.filter((x) => x.id !== l.id));
    setUndo(l); clearTimeout(timer.current);
    timer.current = setTimeout(() => setUndo(null), 5000);
  };
  const restore = () => { persist([undo, ...logs].sort(byDate)); setUndo(null); };

  const total = logs.reduce((a, l) => a + (Number(l.distance) || 0), 0);
  const tsec = logs.reduce((a, l) => a + secs(l.time), 0);
  const rates = logs.map((l) => secs(l.time) / (Number(l.distance) || 0)).filter((x) => x > 0 && isFinite(x));
  const days = Array.from({ length: 7 }, (_, k) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - k));
    const key = iso(d);
    return { key, k, m: logs.filter((l) => l.date === key).reduce((a, l) => a + (Number(l.distance) || 0), 0), lbl: d.toLocaleDateString('he-IL', { weekday: 'narrow' }) };
  });
  const mx = Math.max(...days.map((d) => d.m), 1);
  const week = days.reduce((a, d) => a + d.m, 0);
  const live = secs(f.time) && Number(f.distance) ? pace(secs(f.time), Number(f.distance)) : null;

  return (
    <div className="view pb">
      <header className="gut hero dark">
        <div className="brand enter" style={{ '--d': 0 }}>המעקב שלי</div>
        <p className="eyebrow enter" style={{ '--d': 1 }}>סה״כ מטרים</p>
        <div className="big enter" style={{ '--d': 2 }}>{total.toLocaleString('en-US')}</div>
        <p className="lead enter" style={{ '--d': 3 }}>{logs.length} אימונים · {week.toLocaleString('en-US')} מ׳ ב-7 הימים האחרונים</p>
      </header>

      <section className="gut mt">
        <div className="week" role="img" aria-label="מטרים בשבעת הימים האחרונים">
          {days.map((d) => (
            <div key={d.key} className="wd">
              <div className="wb"><i className={d.k === 6 ? 'now' : ''} style={{ height: `${Math.max((d.m / mx) * 100, d.m ? 8 : 3)}%` }} /></div>
              <span>{d.lbl}</span>
            </div>
          ))}
        </div>
        <div className="stats">
          <div><b>{pace(tsec, total)}</b><span>קצב ממוצע ל-100 מ׳</span></div>
          <div><b>{rates.length ? mmss(Math.round(Math.min(...rates) * 100)) : '—'}</b><span>הקצב הטוב ביותר</span></div>
        </div>
      </section>

      <section className="gut mt">
        {!open ? (
          <button className="btn" onClick={() => setOpen(true)}><Plus size={20} /> הוספת אימון</button>
        ) : (
          <div className="form enter">
            <div className="chips" role="group" aria-label="מרחק מהיר">
              {[400, 800, 1000, 1500].map((m) => (
                <button key={m} type="button" className={Number(f.distance) === m ? 'on' : ''} onClick={() => setF({ ...f, distance: String(m) })}>{m}</button>
              ))}
            </div>
            <div className="grid2">
              <label><span className="label">מרחק (מטרים)</span><input className="field" type="number" inputMode="numeric" placeholder="800" value={f.distance} onChange={set('distance')} aria-invalid={!!err.distance} />{err.distance && <span className="err">{err.distance}</span>}</label>
              <label><span className="label">זמן (דק׳:שנ׳)</span><input className="field" type="text" inputMode="numeric" placeholder="30:00" value={f.time} onChange={set('time')} aria-invalid={!!err.time} />{err.time && <span className="err">{err.time}</span>}</label>
              <label><span className="label">תאריך</span><input className="field" type="date" value={f.date} onChange={set('date')} /></label>
              <label><span className="label">SWOLF (לא חובה)</span><input className="field" type="number" inputMode="numeric" placeholder="67" value={f.strokes} onChange={set('strokes')} /></label>
            </div>
            {live && <p className="live">קצב משוער: <b>{live}</b> ל-100 מ׳</p>}
            <div className="actions">
              <button className="btn" onClick={submit}>שמירת אימון</button>
              <button className="btn ghost" onClick={() => { setOpen(false); setErr({}); }}>ביטול</button>
            </div>
          </div>
        )}
      </section>

      <section className="mt">
        <h2 className="h2 gut">היסטוריה</h2>
        {logs.length === 0 && <p className="gut empty">עוד לא תיעדת אימון. הראשון לוקח חצי דקה.</p>}
        {logs.map((l) => (
          <div key={l.id} className="log">
            <div className="grow">
              <b className="dist">{l.distance}<small> מ׳</small></b>
              <span className="muted">{parseD(l.date).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            </div>
            <div className="cell"><b>{l.time}</b><span className="muted">קצב {l.pace}</span></div>
            <div className="cell"><b>{l.swolf || '—'}</b><span className="muted">SWOLF</span></div>
            <button className="icon" onClick={() => remove(l)} aria-label="מחיקת אימון"><Trash2 size={18} /></button>
          </div>
        ))}
      </section>

      {undo && (
        <div className="toast" role="status">
          <span>האימון נמחק</span>
          <button onClick={restore}>ביטול מחיקה</button>
        </div>
      )}
    </div>
  );
};

/* ---------- App ---------- */

const SwimGuide = () => {
  const [view, setView] = useState('guide');
  const [nav, setNav] = useState(null); // { topic, item }
  const [read, setRead] = useState(() => load('ddRead', {}));

  const markRead = (id, i) => {
    setRead((r) => {
      if ((r[id] || []).includes(i)) return r;
      const next = { ...r, [id]: [...(r[id] || []), i] };
      store('ddRead', next);
      return next;
    });
  };

  useEffect(() => { window.scrollTo(0, 0); }, [view, nav?.topic]);

  return (
    <div dir="rtl" lang="he" className="app">
      <main>
        {view === 'guide' && !nav && <Home read={read} onOpen={(topic, item) => setNav({ topic, item })} />}
        {view === 'guide' && nav && <Topic key={`${nav.topic}-${nav.item}`} index={nav.topic} openItem={nav.item} read={read} markRead={markRead} onBack={() => setNav(null)} />}
        {view === 'stats' && <Tracker />}
      </main>

      <nav className="nav" aria-label="ניווט ראשי">
        <button aria-current={view === 'guide' ? 'page' : undefined} onClick={() => { setView('guide'); setNav(null); }}><BookOpen size={22} /> המדריך</button>
        <button aria-current={view === 'stats' ? 'page' : undefined} onClick={() => setView('stats')}><BarChart2 size={22} /> המעקב שלי</button>
      </nav>
    </div>
  );
};

export default SwimGuide;

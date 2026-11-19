import React, { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from 'react';
import {
  Home, Search, Waves, BarChart2, ArrowLeft, ChevronRight, ChevronLeft, ChevronDown, Check, X, Plus,
  Trash2, Bookmark, Moon, Sun, XCircle, Play,
} from 'lucide-react';
import { SECTIONS_DATA } from './data.jsx';

/* =========================================================
   Data prep (content file stays untouched)
   ========================================================= */

const stripNum = (t) => t.replace(/^\d+\.\s*/, '');
const EX_RE = /^🏋️\s*תרגיל\s*\d+:\s*/u;
const GROUPS = { '🍑': 'ישבן', '🔥': 'בטן ומותניים', '🦵': 'ירכיים' };

const parseItem = (topicId, raw, i, counters) => {
  const id = `${topicId}:${i}`;
  if (EX_RE.test(raw.title)) {
    const rest = raw.title.replace(EX_RE, '');
    const [name, tag = ''] = rest.split(/\s+-\s+/);
    const emoji = Object.keys(GROUPS).find((e) => tag.startsWith(e));
    counters.ex += 1;
    return {
      id, i, kind: 'ex', n: counters.ex, title: name.trim(), text: raw.content,
      group: emoji ? GROUPS[emoji] : 'גוף עליון',
      hint: tag.replace(/^[^\p{L}]+/u, '').trim(),
    };
  }
  counters.idea += 1;
  return { id, i, kind: 'idea', n: counters.idea, title: stripNum(raw.title), text: raw.content };
};

const TOPICS = SECTIONS_DATA.map((s, index) => {
  const counters = { idea: 0, ex: 0 };
  const items = s.details.deepDive.map((d, i) => parseItem(s.id, d, i, counters));
  const d = s.details;
  const cards = [
    { k: 'concept', label: 'הרעיון', text: d.concept },
    ...d.bodyCheck.map((t, i) => ({ k: 'check', label: `סריקת גוף · ${i + 1}/${d.bodyCheck.length}`, text: t })),
    ...d.dos.map((t) => ({ k: 'do', label: 'לעשות', text: t })),
    ...d.donts.map((t) => ({ k: 'dont', label: 'להימנע', text: t })),
    { k: 'image', label: `דימוי · ${d.imagery.title}`, text: d.imagery.text },
  ];
  return {
    id: s.id, index, title: s.title, subtitle: s.subtitle, summary: s.summary, d, items, cards,
    ideas: items.filter((x) => x.kind === 'idea'),
    exercises: items.filter((x) => x.kind === 'ex'),
  };
});
const TOPIC_BY_ID = Object.fromEntries(TOPICS.map((t) => [t.id, t]));
const ALL_IDEAS = TOPICS.flatMap((t) => t.ideas.map((x) => ({ ...x, topic: t })));

/* =========================================================
   Router (hash based: back button + deep links work)
   ========================================================= */

const parseHash = () => {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [path, qs] = raw.split('?');
  return { seg: path.split('/').filter(Boolean), q: new URLSearchParams(qs || '') };
};
const go = (path) => { window.location.hash = path; };
const useRoute = () => {
  const [r, setR] = useState(parseHash);
  useEffect(() => {
    const f = () => setR(parseHash());
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return r;
};

/* =========================================================
   Storage
   ========================================================= */

const useStore = (key, init) => {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; } catch (e) { return init; }
  });
  const set = useCallback((next) => {
    setV((prev) => {
      const n = typeof next === 'function' ? next(prev) : next;
      try { localStorage.setItem(key, JSON.stringify(n)); } catch (e) { /* storage unavailable */ }
      return n;
    });
  }, [key]);
  return [v, set];
};

const Ctx = createContext(null);
const useApp = () => useContext(Ctx);

const localDate = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/* =========================================================
   Small pieces
   ========================================================= */

const Ring = ({ value, total, size = 46 }) => {
  const r = (size - 6) / 2, c = 2 * Math.PI * r, f = total ? value / total : 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth="4" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - f)} transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset .5s ease' }} />
    </svg>
  );
};

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const Hl = ({ text, q }) => {
  if (!q) return text;
  const parts = text.split(new RegExp(`(${esc(q)})`, 'ig'));
  return parts.map((p, i) => (p.toLowerCase() === q.toLowerCase() ? <mark key={i}>{p}</mark> : p));
};

const TABS = [
  { id: '', label: 'בית', icon: Home },
  { id: 'search', label: 'חיפוש', icon: Search },
  { id: 'pool', label: 'בריכה', icon: Waves },
  { id: 'log', label: 'מעקב', icon: BarChart2 },
];

const TabBar = ({ current }) => (
  <nav className="tabbar" aria-label="ניווט ראשי">
    {TABS.map(({ id, label, icon: Icon }) => (
      <button key={id} className="tab" aria-current={current === id ? 'page' : undefined} onClick={() => go(`/${id}`)}>
        <span className="pill"><Icon size={22} strokeWidth={current === id ? 2.6 : 2} /></span>
        {label}
      </button>
    ))}
  </nav>
);

/* =========================================================
   Home
   ========================================================= */

const HomeView = () => {
  const { progress, theme, setTheme } = useApp();
  const doneIn = (t) => t.items.filter((x) => progress.done[x.id]).length;
  const last = progress.last && TOPIC_BY_ID[progress.last];
  const day = Math.floor(Date.now() / 864e5);
  const tip = ALL_IDEAS[day % ALL_IDEAS.length];
  const totalDone = Object.keys(progress.done).length;

  return (
    <div className="px-5 pb-6">
      <header className="flex items-center justify-between pt-3" style={{ paddingTop: 'calc(12px + env(safe-area-inset-top))' }}>
        <span className="text-lg font-black tracking-tight">DeepDive</span>
        <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'מצב יום' : 'מצב לילה'}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <section className="pb-8 pt-8">
        <h1 className="h1 enter" style={{ '--i': 0 }}>70% טכניקה.<br />30% כושר.</h1>
        <p className="enter mt-5 max-w-[30ch] text-lg muted" style={{ '--i': 1 }}>בחרי נושא, ותבני את השחייה מהמים החוצה.</p>
        <div className="enter mt-7" style={{ '--i': 2 }}>
          <div className="split" aria-hidden="true"><span>טכניקה</span><span>כושר</span></div>
        </div>
      </section>

      {last && (
        <button className="card lift enter mb-4 flex w-full items-center gap-4 p-5 text-start" style={{ '--i': 3 }} onClick={() => go(`/t/${last.id}`)}>
          <div className="flex-1">
            <p className="eyebrow">המשיכי מכאן</p>
            <p className="h3 mt-1">{last.title}</p>
            <div className="bar mt-3"><i style={{ width: `${(doneIn(last) / last.items.length) * 100}%` }} /></div>
          </div>
          <ArrowLeft size={22} />
        </button>
      )}

      <button className="lift enter mb-8 flex w-full items-center gap-4 rounded-[22px] p-5 text-start" style={{ '--i': 4, background: 'var(--ink)', color: 'var(--bg)' }} onClick={() => go('/pool')}>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}><Waves size={24} /></span>
        <span className="flex-1">
          <span className="block text-lg font-black leading-tight">מצב בריכה</span>
          <span className="block text-sm opacity-75">כרטיסים גדולים לקריאה על שפת המים</span>
        </span>
        <ArrowLeft size={22} />
      </button>

      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="h2">נושאים</h2>
        <span className="text-sm font-bold muted">{totalDone} סומנו כמובנים</span>
      </div>
      <div className="space-y-3">
        {TOPICS.map((t, i) => (
          <button key={t.id} className="card lift enter topic" style={{ '--i': 5 + i }} onClick={() => go(`/t/${t.id}`)}>
            <span className="topic-n">{i + 1}</span>
            <span className="flex-1">
              <span className="block text-xl font-black leading-tight">{t.title}</span>
              <span className="mt-1 block text-sm muted">{t.summary}</span>
            </span>
            <span className="relative grid place-items-center">
              <Ring value={doneIn(t)} total={t.items.length} />
              <span className="absolute text-[11px] font-black">{doneIn(t)}</span>
            </span>
          </button>
        ))}
      </div>

      <section className="mt-10">
        <p className="eyebrow">הטיפ של היום</p>
        <button className="mt-2 block w-full text-start" onClick={() => go(`/t/${tip.topic.id}?i=${tip.i}`)}>
          <span className="serif block text-3xl leading-tight">{tip.title}</span>
          <span className="mt-3 block line-clamp-3 muted">{tip.text}</span>
          <span className="mt-3 inline-flex items-center gap-2 font-bold" style={{ color: 'var(--accent)' }}>
            <span style={{ color: 'var(--ink)' }}>{tip.topic.title}</span><ArrowLeft size={18} />
          </span>
        </button>
      </section>
    </div>
  );
};

/* =========================================================
   Topic
   ========================================================= */

const Item = ({ item, q, open, onToggle, hit }) => {
  const { progress, setProgress } = useApp();
  const done = !!progress.done[item.id], saved = !!progress.saved[item.id];
  const flip = (key) => () => setProgress((p) => {
    const m = { ...p[key] };
    if (m[item.id]) delete m[item.id]; else m[item.id] = true;
    return { ...p, [key]: m };
  });
  const ref = useRef(null);
  useEffect(() => { if (hit && ref.current) ref.current.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, [hit]);

  return (
    <div className="acc" data-open={open} data-hit={hit || undefined} ref={ref} id={`i-${item.i}`}>
      <button className="acc-head" aria-expanded={open} onClick={onToggle}>
        <span className="acc-n">{done ? <Check size={18} style={{ color: 'var(--good)' }} /> : String(item.n).padStart(2, '0')}</span>
        <span className="flex-1"><Hl text={item.title} q={q} />
          {item.kind === 'ex' && item.hint && <span className="mt-1 block text-[13px] font-bold muted">{item.hint}</span>}
        </span>
        <ChevronDown className="acc-chev" size={22} />
      </button>
      <div className="acc-body"><div>
        <p className="acc-text"><Hl text={item.text} q={q} /></p>
        <div className="acc-tools">
          <button className="tool" aria-pressed={done} onClick={flip('done')}><Check size={16} /> {done ? 'הבנתי' : 'סמני כמובן'}</button>
          <button className="tool" aria-pressed={saved} onClick={flip('saved')}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'שמור' : 'שמירה'}</button>
        </div>
      </div></div>
    </div>
  );
};

const TopicView = ({ topic, focusItem }) => {
  const { setProgress, progress } = useApp();
  const hasEx = topic.exercises.length > 0;
  const [tab, setTab] = useState(() => {
    const it = focusItem != null ? topic.items[focusItem] : null;
    return it ? (it.kind === 'ex' ? 'ex' : 'ideas') : 'brief';
  });
  const [group, setGroup] = useState('הכול');
  const [openId, setOpenId] = useState(focusItem != null ? topic.items[focusItem]?.id : null);
  const barRef = useRef(null);
  const next = TOPICS[(topic.index + 1) % TOPICS.length];
  const d = topic.d;

  useEffect(() => { setProgress((p) => ({ ...p, last: topic.id })); }, [topic.id, setProgress]);

  useEffect(() => {
    let raf = 0;
    const f = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        const p = h.scrollHeight - h.clientHeight;
        if (barRef.current) barRef.current.style.setProperty('--p', p > 0 ? Math.min(1, h.scrollTop / p) : 0);
      });
    };
    window.addEventListener('scroll', f, { passive: true });
    return () => { window.removeEventListener('scroll', f); cancelAnimationFrame(raf); };
  }, []);

  const groups = ['הכול', ...Array.from(new Set(topic.exercises.map((x) => x.group)))];
  const list = tab === 'ideas' ? topic.ideas : topic.exercises.filter((x) => group === 'הכול' || x.group === group);
  const doneCount = topic.items.filter((x) => progress.done[x.id]).length;

  const tabs = [['brief', 'בקצרה'], ['ideas', `מעמקים · ${topic.ideas.length}`]];
  if (hasEx) tabs.push(['ex', `תרגילים · ${topic.exercises.length}`]);

  return (
    <div className="rise">
      <div className="topbar">
        <button className="icon-btn" onClick={() => go('/')} aria-label="חזרה"><ChevronRight size={26} /></button>
        <span className="flex-1 truncate text-center font-black">{topic.title}</span>
        <span className="w-11 text-center text-sm font-bold muted">{topic.index + 1}/{TOPICS.length}</span>
        <div className="read-line" ref={barRef}><i /></div>
      </div>

      <header className="px-5 pb-7 pt-6">
        <p className="eyebrow">{topic.subtitle}</p>
        <h1 className="h1 mt-2" style={{ fontSize: 'clamp(40px, 12vw, 56px)' }}>{topic.title}</h1>
        <p className="serif mt-5 text-[26px] leading-snug">{d.concept}</p>
        <div className="mt-6 flex items-center gap-3">
          <div className="bar flex-1"><i style={{ width: `${(doneCount / topic.items.length) * 100}%` }} /></div>
          <span className="text-sm font-bold muted">{doneCount}/{topic.items.length} הובנו</span>
        </div>
      </header>

      <div className="seg" role="tablist" aria-label="חלקי הנושא">
        {tabs.map(([id, label]) => (
          <button key={id} role="tab" className="chip" aria-selected={tab === id}
            onClick={() => { setTab(id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{label}</button>
        ))}
      </div>

      {tab === 'brief' && (
        <div className="px-5 pb-6 pt-8 rise">
          <section>
            <h2 className="h2 mb-2">לעשות</h2>
            {d.dos.map((t, i) => (
              <div className="cue" key={i}><span className="cue-ic good"><Check size={18} strokeWidth={3} /></span><p className="flex-1 text-lg leading-snug">{t}</p></div>
            ))}
          </section>
          <section className="mt-10">
            <h2 className="h2 mb-2">להימנע</h2>
            {d.donts.map((t, i) => (
              <div className="cue" key={i}><span className="cue-ic bad"><X size={18} strokeWidth={3} /></span><p className="flex-1 text-lg leading-snug">{t}</p></div>
            ))}
          </section>
          <section className="mt-10">
            <h2 className="h2 mb-2">סריקת גוף</h2>
            {d.bodyCheck.map((t, i) => (
              <div className="cue" key={i}><span className="step-n">{String(i + 1).padStart(2, '0')}</span><p className="flex-1 text-lg leading-snug">{t}</p></div>
            ))}
          </section>
          <section className="image-panel mt-10">
            <p className="text-[13px] font-bold opacity-80">הדימוי המנטלי</p>
            <h3 className="mt-2 text-4xl font-black leading-none tracking-tight">{d.imagery.title}</h3>
            <p className="serif mt-5 text-2xl leading-snug">{d.imagery.text}</p>
          </section>
          <button className="btn btn-block mt-8" onClick={() => go(`/pool/${topic.id}`)}><Play size={20} fill="currentColor" /> לכרטיסי הבריכה</button>
        </div>
      )}

      {tab !== 'brief' && (
        <div className="px-5 pb-6 pt-6 rise">
          {tab === 'ex' && (
            <div className="scroll-x mb-3" role="group" aria-label="סינון לפי אזור">
              {groups.map((g) => <button key={g} className="chip" aria-pressed={group === g} onClick={() => setGroup(g)}>{g}</button>)}
            </div>
          )}
          <div style={{ borderBottom: '1px solid var(--line)' }}>
            {list.map((it) => (
              <Item key={it.id} item={it} open={openId === it.id} hit={focusItem === it.i && openId === it.id}
                onToggle={() => setOpenId(openId === it.id ? null : it.id)} />
            ))}
          </div>
        </div>
      )}

      <div className="px-5 pb-4 pt-6">
        <button className="card lift flex w-full items-center gap-4 p-5 text-start" onClick={() => go(`/t/${next.id}`)}>
          <span className="flex-1"><span className="eyebrow block">הנושא הבא</span><span className="h3 block mt-1">{next.title}</span></span>
          <ArrowLeft size={22} />
        </button>
      </div>
    </div>
  );
};

/* =========================================================
   Search
   ========================================================= */

const SUGGEST = ['מרפק', 'קרסול', 'גרר', 'נשימה', 'ישבן', 'רוטציה'];

const SearchView = () => {
  const { progress } = useApp();
  const [q, setQ] = useState('');
  const inp = useRef(null);
  useEffect(() => { inp.current?.focus(); }, []);
  const term = q.trim();

  const results = useMemo(() => {
    if (term.length < 2) return [];
    const t = term.toLowerCase(), out = [];
    TOPICS.forEach((tp) => {
      const brief = [...tp.d.dos, ...tp.d.donts, ...tp.d.bodyCheck, tp.d.concept];
      brief.forEach((line) => { if (line.toLowerCase().includes(t)) out.push({ key: `${tp.id}-b-${out.length}`, topic: tp, title: line, text: '', href: `/t/${tp.id}`, tag: 'בקצרה' }); });
      tp.items.forEach((it) => {
        if (it.title.toLowerCase().includes(t) || it.text.toLowerCase().includes(t))
          out.push({ key: it.id, topic: tp, title: it.title, text: it.text, href: `/t/${tp.id}?i=${it.i}`, tag: it.kind === 'ex' ? 'תרגיל' : 'מעמקים' });
      });
    });
    return out.slice(0, 40);
  }, [term]);

  const saved = Object.keys(progress.saved).map((id) => {
    const [tid, i] = id.split(':'); const tp = TOPIC_BY_ID[tid];
    return tp && tp.items[Number(i)] ? { topic: tp, item: tp.items[Number(i)] } : null;
  }).filter(Boolean);

  const snippet = (text) => {
    const at = text.toLowerCase().indexOf(term.toLowerCase());
    if (at < 0) return text.slice(0, 120);
    const s = Math.max(0, at - 40);
    return (s > 0 ? '…' : '') + text.slice(s, at + 100) + '…';
  };

  return (
    <div className="px-5 pb-6" style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))' }}>
      <h1 className="h2 mb-4">חיפוש</h1>
      <label className="search">
        <Search size={22} className="shrink-0 muted" />
        <input ref={inp} value={q} onChange={(e) => setQ(e.target.value)} placeholder="מרפק, קרסול, גרר…" aria-label="חיפוש במדריך" type="search" enterKeyHint="search" />
        {q && <button type="button" className="icon-btn -me-3" onClick={() => { setQ(''); inp.current?.focus(); }} aria-label="ניקוי"><XCircle size={20} /></button>}
      </label>

      {term.length < 2 && (
        <>
          <div className="scroll-x mt-4">{SUGGEST.map((s) => <button key={s} className="chip" onClick={() => setQ(s)}>{s}</button>)}</div>
          <h2 className="h3 mb-1 mt-10">שמורים</h2>
          {saved.length === 0 && <p className="muted">סמנו פריט בסימנייה והוא יחכה כאן.</p>}
          {saved.map(({ topic, item }) => (
            <button key={item.id} className="log-row w-full text-start" style={{ gridTemplateColumns: '1fr auto' }} onClick={() => go(`/t/${topic.id}?i=${item.i}`)}>
              <span><span className="block text-[13px] font-bold muted">{topic.title}</span><span className="block font-bold">{item.title}</span></span>
              <ChevronLeft size={20} className="muted" />
            </button>
          ))}
        </>
      )}

      {term.length >= 2 && (
        <div className="mt-5">
          <p className="mb-1 text-sm font-bold muted">{results.length ? `${results.length} תוצאות` : 'אין תוצאות. נסי מילה אחרת.'}</p>
          {results.map((r) => (
            <button key={r.key} className="log-row w-full text-start" style={{ gridTemplateColumns: '1fr auto' }} onClick={() => go(r.href)}>
              <span>
                <span className="block text-[13px] font-bold muted">{r.topic.title} · {r.tag}</span>
                <span className="block font-bold"><Hl text={r.title} q={term} /></span>
                {r.text && <span className="mt-1 block text-sm muted"><Hl text={snippet(r.text)} q={term} /></span>}
              </span>
              <ChevronLeft size={20} className="muted" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* =========================================================
   Pool mode: one big cue at a time
   ========================================================= */

const PoolPicker = () => (
  <div className="px-5 pb-6" style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))' }}>
    <h1 className="h2">מצב בריכה</h1>
    <p className="mt-2 muted">כרטיס אחד בכל פעם, באותיות גדולות. המסך נשאר דלוק.</p>
    <div className="mt-6 space-y-3">
      {TOPICS.map((t, i) => (
        <button key={t.id} className="card lift topic" onClick={() => go(`/pool/${t.id}`)}>
          <span className="topic-n">{i + 1}</span>
          <span className="flex-1"><span className="block text-xl font-black">{t.title}</span><span className="text-sm muted">{t.cards.length} כרטיסים</span></span>
          <Play size={22} fill="currentColor" />
        </button>
      ))}
    </div>
  </div>
);

const PoolCards = ({ topic }) => {
  const [i, setI] = useState(0);
  const touch = useRef(null);
  const n = topic.cards.length, c = topic.cards[i];
  const nextCard = useCallback(() => setI((v) => Math.min(n - 1, v + 1)), [n]);
  const prevCard = useCallback(() => setI((v) => Math.max(0, v - 1)), []);
  const close = () => go(`/t/${topic.id}`);

  useEffect(() => {
    const key = (e) => {
      if (e.key === 'ArrowLeft') nextCard();
      else if (e.key === 'ArrowRight') prevCard();
      else if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', key);
    let lock;
    try { navigator.wakeLock?.request('screen').then((l) => { lock = l; }).catch(() => {}); } catch (e) { /* unsupported */ }
    return () => { window.removeEventListener('keydown', key); try { lock?.release(); } catch (e) { /* noop */ } };
  }, [nextCard, prevCard]); // eslint-disable-line react-hooks/exhaustive-deps

  const onTouchEnd = (e) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current;
    touch.current = null;
    if (dx > 50) nextCard(); else if (dx < -50) prevCard();
  };

  return (
    <div className="pool" data-k={c.k} role="dialog" aria-label={`כרטיסי בריכה: ${topic.title}`}
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }} onTouchEnd={onTouchEnd}>
      <div className="flex items-center gap-3">
        <div className="pool-seg" aria-hidden="true">{topic.cards.map((_, k) => <i key={k} className={k <= i ? 'on' : ''} />)}</div>
        <button className="icon-btn shrink-0" style={{ background: 'color-mix(in srgb, currentColor 14%, transparent)' }} onClick={close} aria-label="סגירה"><X size={22} /></button>
      </div>

      <div className="flex flex-1 flex-col justify-center" key={i} aria-live="polite">
        <p className="pool-text-in mb-5 text-base font-black opacity-80">{c.label}</p>
        <p className={`pool-text pool-text-in ${c.k === 'concept' || c.k === 'image' ? 'serif' : ''}`}>{c.text}</p>
      </div>

      <div className="grid grid-cols-[1fr_2fr] gap-3">
        <button className="pool-btn" onClick={prevCard} disabled={i === 0} aria-label="הקודם"><ChevronRight size={28} /></button>
        <button className="pool-btn main" onClick={i === n - 1 ? close : nextCard} aria-label={i === n - 1 ? 'סיום' : 'הבא'}>
          {i === n - 1 ? <Check size={28} /> : <ChevronLeft size={28} />}
        </button>
      </div>
    </div>
  );
};

/* =========================================================
   Tracker
   ========================================================= */

const weekStart = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - x.getDay()); return x; };
const parseTime = (s) => {
  const m = /^(\d{1,3}):([0-5]?\d)$/.exec(s.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};
const fmtPace = (secPer100) => `${Math.floor(secPer100 / 60)}:${String(Math.round(secPer100 % 60)).padStart(2, '0')}`;

const LogSheet = ({ onClose, onSave, last }) => {
  const [f, setF] = useState({ date: localDate(), distance: last?.distance || '', time: '', strokes: '' });
  const [err, setErr] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const submit = (e) => {
    e.preventDefault();
    const er = {}, dist = Number(f.distance), sec = parseTime(f.time);
    if (!dist || dist < 25) er.distance = 'הזינו מרחק במטרים';
    if (sec == null || sec === 0) er.time = 'פורמט: 30:00';
    if (!f.date) er.date = 'בחרו תאריך';
    setErr(er);
    if (Object.keys(er).length) return;
    onSave({
      id: Date.now(), date: f.date, distance: String(dist), time: f.time.trim(),
      pace: fmtPace((sec / dist) * 100), strokes: f.strokes, swolf: f.strokes,
    });
  };

  return (
    <div className="sheet-back" onClick={onClose}>
      <form className="sheet" onClick={(e) => e.stopPropagation()} onSubmit={submit} noValidate role="dialog" aria-label="הוספת אימון">
        <div className="grab" />
        <div className="mb-5 flex items-center justify-between"><h2 className="h2">אימון חדש</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="סגירה"><X size={22} /></button></div>

        <span className="field-label">מרחק (מטרים)</span>
        <div className="scroll-x mb-3" role="group" aria-label="מרחקים נפוצים">
          {[400, 800, 1000, 1500, 2000].map((m) => <button key={m} type="button" className="chip" aria-pressed={Number(f.distance) === m} onClick={() => setF({ ...f, distance: String(m) })}>{m}</button>)}
        </div>
        <input className="field" type="number" inputMode="numeric" placeholder="800" aria-label="מרחק במטרים" aria-invalid={!!err.distance} value={f.distance} onChange={set('distance')} />
        {err.distance && <p className="field-err">{err.distance}</p>}

        <div className="mt-5 grid grid-cols-2 gap-4">
          <label className="field-wrap"><span className="field-label">זמן (דק׳:שנ׳)</span>
            <input className="field" type="text" inputMode="numeric" placeholder="30:00" aria-invalid={!!err.time} value={f.time} onChange={set('time')} />
            {err.time && <p className="field-err">{err.time}</p>}</label>
          <label className="field-wrap"><span className="field-label">SWOLF (לא חובה)</span>
            <input className="field" type="number" inputMode="numeric" placeholder="67" value={f.strokes} onChange={set('strokes')} /></label>
        </div>
        <label className="field-wrap mt-5 block"><span className="field-label">תאריך</span>
          <input className="field" type="date" aria-invalid={!!err.date} value={f.date} onChange={set('date')} />
          {err.date && <p className="field-err">{err.date}</p>}</label>

        <button className="btn btn-block mt-7" type="submit">שמירת אימון</button>
      </form>
    </div>
  );
};

const LogView = () => {
  const { logs, setLogs, toast } = useApp();
  const [open, setOpen] = useState(false);

  const sorted = useMemo(() => [...logs].sort((a, b) => new Date(b.date) - new Date(a.date)), [logs]);
  const total = logs.reduce((a, l) => a + (Number(l.distance) || 0), 0);
  const thisWeek = logs.filter((l) => new Date(l.date) >= weekStart(new Date())).reduce((a, l) => a + (Number(l.distance) || 0), 0);
  const sw = logs.map((l) => Number(l.strokes)).filter((n) => n > 0);
  const best = sw.length ? Math.min(...sw) : null;

  const weeks = useMemo(() => {
    const base = weekStart(new Date());
    return Array.from({ length: 8 }, (_, k) => {
      const s = new Date(base); s.setDate(s.getDate() - (7 - k) * 7);
      const e = new Date(s); e.setDate(e.getDate() + 7);
      const m = logs.filter((l) => { const d = new Date(l.date); return d >= s && d < e; }).reduce((a, l) => a + (Number(l.distance) || 0), 0);
      return { m, label: `${s.getDate()}.${s.getMonth() + 1}`, now: k === 7 };
    });
  }, [logs]);
  const maxW = Math.max(...weeks.map((w) => w.m), 1);

  const trend = [...sorted].reverse().filter((l) => Number(l.strokes) > 0);
  const save = (entry) => { setLogs((p) => [entry, ...p]); setOpen(false); };
  const remove = (l) => {
    setLogs((p) => p.filter((x) => x.id !== l.id));
    toast('האימון נמחק', () => setLogs((p) => [l, ...p]));
  };

  return (
    <div className="px-5 pb-6" style={{ paddingTop: 'calc(16px + env(safe-area-inset-top))' }}>
      <div className="flex items-center justify-between">
        <h1 className="h2">המעקב שלי</h1>
        <button className="btn" style={{ minHeight: 44, padding: '0 18px' }} onClick={() => setOpen(true)}><Plus size={20} /> אימון</button>
      </div>

      <section className="enter mt-8">
        <p className="eyebrow">סה״כ מטרים</p>
        <p className="big-num mt-2">{total.toLocaleString('en-US')}</p>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[['אימונים', logs.length], ['השבוע', `${thisWeek.toLocaleString('en-US')} מ׳`], ['SWOLF שיא', best ?? '—']].map(([l, v]) => (
            <div key={l} className="card p-4"><p className="text-[13px] font-bold muted">{l}</p><p className="mt-1 text-xl font-black leading-tight">{v}</p></div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="h3">8 שבועות אחרונים</h2>
        <div className="week-bars mt-4" role="img" aria-label="מטרים לפי שבוע">
          {weeks.map((w, i) => (
            <div key={i} className={w.now ? 'now' : ''}><i style={{ height: `${Math.max(3, (w.m / maxW) * 100)}%`, animationDelay: `${i * 50}ms` }} /><span>{w.label}</span></div>
          ))}
        </div>
      </section>

      {trend.length >= 2 && (
        <section className="mt-10">
          <h2 className="h3">מגמת SWOLF</h2>
          <p className="text-sm muted">נמוך יותר = יעיל יותר</p>
          <Trend pts={trend} />
        </section>
      )}

      <section className="mt-10">
        <h2 className="h3 mb-1">היסטוריה</h2>
        {sorted.length === 0 && (
          <div className="card mt-3 p-6"><p className="h3">עוד אין אימונים</p><p className="mt-1 muted">אחרי השחייה הראשונה, שמרי אותה כאן.</p>
            <button className="btn mt-5" onClick={() => setOpen(true)}><Plus size={20} /> אימון ראשון</button></div>
        )}
        {sorted.map((l) => (
          <div key={l.id} className="log-row" style={{ gridTemplateColumns: '1fr auto auto 44px' }}>
            <div>
              <div className="text-2xl font-black leading-none">{l.distance}<span className="text-sm font-bold muted"> מ׳</span></div>
              <div className="mt-1 text-xs muted">{new Date(l.date + 'T00:00').toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' })}</div>
            </div>
            <div><div className="font-black">{l.time}</div><div className="text-xs muted">קצב {l.pace}</div></div>
            <div><div className="font-black">{l.swolf || '—'}</div><div className="text-xs muted">SWOLF</div></div>
            <button className="icon-btn" onClick={() => remove(l)} aria-label="מחיקת אימון"><Trash2 size={18} /></button>
          </div>
        ))}
      </section>

      {open && <LogSheet onClose={() => setOpen(false)} onSave={save} last={sorted[0]} />}
    </div>
  );
};

const Trend = ({ pts }) => {
  const W = 320, H = 120, P = 12;
  const v = pts.map((l) => Number(l.strokes));
  const min = Math.min(...v), max = Math.max(...v), r = max - min || 1;
  const xy = v.map((n, i) => [P + (i / (v.length - 1)) * (W - 2 * P), P + ((n - min) / r) * (H - 2 * P)]);
  const last = xy[xy.length - 1];
  return (
    <div dir="ltr" className="mt-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="גרף מגמת SWOLF">
        <polyline fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={xy.map((p) => p.join(',')).join(' ')} />
        <circle cx={last[0]} cy={last[1]} r="6" fill="var(--accent)" stroke="var(--bg)" strokeWidth="3" />
      </svg>
      <div className="mt-1 flex justify-between text-xs font-bold muted"><span>{pts[0].date}</span><span>{pts[pts.length - 1].date}</span></div>
    </div>
  );
};

/* =========================================================
   App shell
   ========================================================= */

export default function SwimGuide() {
  const route = useRoute();
  const [logs, setLogs] = useStore('swimLogs', []);
  const [progress, setProgress] = useStore('swimProgress', { done: {}, saved: {}, last: null });
  const [themePref, setThemePref] = useStore('swimTheme', null);
  const [toastState, setToastState] = useState(null);
  const timer = useRef(0);

  const sysDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const theme = themePref || (sysDark ? 'dark' : 'light');
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  const toast = useCallback((msg, undo) => {
    clearTimeout(timer.current);
    setToastState({ msg, undo });
    timer.current = setTimeout(() => setToastState(null), 5000);
  }, []);

  const [head, id] = route.seg;
  const key = route.seg.join('/');
  useEffect(() => { if (!route.q.get('i')) window.scrollTo(0, 0); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const topic = id && TOPIC_BY_ID[id];
  const focus = route.q.get('i');
  const poolOpen = head === 'pool' && topic;

  let view, tab = head || '';
  if (head === 't' && topic) { view = <TopicView key={topic.id + (focus || '')} topic={topic} focusItem={focus != null ? Number(focus) : null} />; tab = ''; }
  else if (head === 'search') view = <SearchView />;
  else if (head === 'pool') view = <PoolPicker />;
  else if (head === 'log') view = <LogView />;
  else { view = <HomeView />; tab = ''; }

  return (
    <Ctx.Provider value={{ logs, setLogs, progress, setProgress, theme, setTheme: setThemePref, toast }}>
      <a href="#main" className="skip" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>דלגי לתוכן</a>
      <div dir="rtl" lang="he" className="app">
        <main id="main" tabIndex={-1} style={{ outline: 'none' }}>{view}</main>
        {!poolOpen && <TabBar current={head === 't' ? '' : tab} />}
      </div>
      {poolOpen && <div dir="rtl" lang="he"><PoolCards key={topic.id} topic={topic} /></div>}
      {toastState && (
        <div className="toast" dir="rtl" role="status">
          <span>{toastState.msg}</span>
          {toastState.undo && <button onClick={() => { toastState.undo(); setToastState(null); }}>ביטול</button>}
        </div>
      )}
    </Ctx.Provider>
  );
}

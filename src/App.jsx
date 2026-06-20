import { useState, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════
//  Data & Helpers
// ═══════════════════════════════════════

const EXERCISES = [
  { name: '深蹲', color: 'blue', kcalPerMin: 12, joint: '注意膝盖', icon: '🦵', category: '腿部' },
  { name: '登山式', color: 'blue', kcalPerMin: 14, joint: '落地轻缓', icon: '⛰️', category: '腿部' },
  { name: '高抬腿', color: 'blue', kcalPerMin: 11, joint: '中低冲击', icon: '🦶', category: '腿部' },
  { name: '腿部推压', color: 'blue', kcalPerMin: 8, joint: '友好', icon: '💪', category: '腿部' },
  { name: '平板支撑', color: 'yellow', kcalPerMin: 9, joint: '友好', icon: '🧘', category: '核心' },
  { name: '转体', color: 'yellow', kcalPerMin: 7, joint: '友好', icon: '🌀', category: '核心' },
  { name: '仰卧抬腿', color: 'yellow', kcalPerMin: 8, joint: '友好', icon: '🦵', category: '核心' },
  { name: '推压', color: 'red', kcalPerMin: 6, joint: '友好', icon: '🤲', category: '手臂' },
  { name: '拉伸', color: 'red', kcalPerMin: 5, joint: '友好', icon: '🙆', category: '手臂' },
  { name: '瑜伽姿势', color: 'green', kcalPerMin: 4, joint: '友好', icon: '🧘', category: '瑜伽' },
];

const WEEKLY_TEMPLATE = [
  { day: '周一', type: '冒险', extra: '节奏 1 首' },
  { day: '周二', type: '燃脂套餐', extra: '冒险 15min' },
  { day: '周三', type: '冒险', extra: '' },
  { day: '周四', type: '燃脂套餐', extra: '节奏 2 首' },
  { day: '周五', type: '冒险', extra: '节奏 1 首' },
  { day: '周六', type: '自由', extra: '轻量' },
  { day: '周日', type: '休息', extra: '' },
];

function calcBMI(w, h) { return h > 0 ? w / ((h / 100) ** 2) : 0; }
function bmiCat(bmi) {
  if (bmi <= 0) return { label: '--', color: '#888' };
  if (bmi < 18.5) return { label: '偏瘦', color: '#60a5fa' };
  if (bmi < 24) return { label: '正常', color: '#4ade80' };
  if (bmi < 28) return { label: '超重', color: '#fbbf24' };
  if (bmi < 35) return { label: '肥胖一级', color: '#f97316' };
  return { label: '肥胖二级', color: '#ef4444' };
}
function calcBMR(w, h, age) { return Math.round(10 * w + 6.25 * h - 5 * age + 5); }
function calcTDEE(bmr, freq) {
  const f = { 0: 1.2, 1: 1.2, 2: 1.375, 3: 1.375, 4: 1.55, 5: 1.55, 6: 1.725, 7: 1.9 };
  return Math.round(bmr * (f[Math.min(freq, 7)] || 1.375));
}
function recDuration(bmi, intensity) {
  return Math.round((bmi >= 35 ? 25 : 35) * (intensity / 20));
}
function recExercises(bmi) {
  return [...EXERCISES].sort((a, b) => {
    if (bmi >= 35) {
      const aSafe = a.joint === '友好' ? 0 : 1;
      const bSafe = b.joint === '友好' ? 0 : 1;
      if (aSafe !== bSafe) return aSafe - bSafe;
    }
    return b.kcalPerMin - a.kcalPerMin;
  });
}

// ═══════════════════════════════════════
//  Default character
// ═══════════════════════════════════════

const DEFAULT_CHARACTERS = [
  {
    id: 'jin-chengxu',
    name: '金承旭',
    height: 182,
    weight: 129.5,
    age: 21,
    freq: 6,
    intensity: 19,
    history: [{ date: '2026-06-20', weight: 129.5 }],
  },
];

function loadCharacters() {
  try {
    const raw = localStorage.getItem('ringfit_characters');
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_CHARACTERS;
}
function saveCharacters(chars) {
  try { localStorage.setItem('ringfit_characters', JSON.stringify(chars)); } catch {}
}

function genId() { return 'c' + Date.now() + Math.random().toString(36).slice(2, 6); }

// ═══════════════════════════════════════
//  Components
// ═══════════════════════════════════════

// ── Character Card ──
function CharCard({ char: c, onClick }) {
  const bmi = calcBMI(c.weight, c.height);
  const cat = bmiCat(bmi);
  const bmr = calcBMR(c.weight, c.height, c.age);

  return (
    <div className="char-card" onClick={() => onClick(c)}>
      <div className="char-avatar" style={{ borderColor: cat.color }}>
        {c.name[0]}
      </div>
      <div className="char-name">{c.name}</div>
      <div className="char-stats">
        <span>{c.weight} kg</span>
        <span className="char-dot">·</span>
        <span>BMI {bmi.toFixed(1)}</span>
      </div>
      <div className="char-bmr">每日消耗 ~{bmr} kcal</div>
      <div className="char-badge" style={{ background: cat.color + '22', color: cat.color }}>
        {cat.label}
      </div>
      <div className="char-arrow">查看详情 →</div>
    </div>
  );
}

// ── Add Card ──
function AddCard({ onClick }) {
  return (
    <div className="char-card add-card" onClick={onClick}>
      <div className="add-icon">＋</div>
      <div className="add-label">创建新角色</div>
    </div>
  );
}

// ── Character Form Modal ──
function CharForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    name: '', height: 170, weight: 70, age: 25, freq: 3, intensity: 15,
  });

  const set = (k) => (e) => setForm({ ...form, [k]: k === 'name' ? e.target.value : Number(e.target.value) || form[k] });

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({
      ...form,
      id: initial?.id || genId(),
      history: initial?.history || [],
    });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{initial ? '编辑角色' : '创建新角色'}</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>角色名</label>
            <input type="text" value={form.name} onChange={set('name')} placeholder="输入名字" autoFocus />
          </div>
          <div className="form-group">
            <label>身高 cm</label>
            <input type="number" value={form.height} onChange={set('height')} min="100" max="250" />
          </div>
          <div className="form-group">
            <label>体重 kg</label>
            <input type="number" value={form.weight} onChange={set('weight')} step="0.1" min="30" max="300" />
          </div>
          <div className="form-group">
            <label>年龄</label>
            <input type="number" value={form.age} onChange={set('age')} min="10" max="99" />
          </div>
          <div className="form-group">
            <label>每周训练天数</label>
            <input type="number" value={form.freq} onChange={set('freq')} min="0" max="7" />
          </div>
          <div className="form-group">
            <label>健身环强度 (1-30)</label>
            <div className="intensity-row">
              <input type="range" value={form.intensity} onChange={set('intensity')} min="1" max="30" style={{ flex: 1 }} />
              <span className="int-val">Lv.{form.intensity}</span>
            </div>
          </div>
        </div>
        <div className="form-actions">
          <button className="btn-cancel" onClick={onCancel}>取消</button>
          <button className="btn-confirm" onClick={handleSave} disabled={!form.name.trim()}>
            保存角色
          </button>
        </div>
      </div>
    </div>
  );
}

// ── BMI Gauge ──
function BMIGauge({ bmi }) {
  const angle = Math.min(Math.max(bmi, 0) / 45, 1) * 180;
  const rad = (angle - 90) * (Math.PI / 180);
  const r = 110, cx = 145, cy = 130;
  const nx = cx + r * 0.7 * Math.cos(rad);
  const ny = cy + r * 0.7 * Math.sin(rad);
  const cat = bmiCat(bmi);

  return (
    <div className="gauge-card">
      <h3>BMI 指数</h3>
      <svg viewBox="0 0 290 180" className="gauge-svg">
        <defs>
          <linearGradient id="bmiGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="35%" stopColor="#fbbf24" />
            <stop offset="60%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        <path d="M 25 130 A 120 120 0 0 1 265 130" fill="none" stroke="url(#bmiGrad2)" strokeWidth="16" strokeLinecap="round" />
        {[18.5, 24, 28, 35].map(v => {
          const a = ((v / 45) * 180 - 90) * (Math.PI / 180);
          return <text key={v} x={cx + (r + 15) * Math.cos(a)} y={cy + (r + 15) * Math.sin(a)} textAnchor="middle" fill="#888" fontSize="9">{v}</text>;
        })}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill="#fff" />
        <text x={cx} y={cy - 18} textAnchor="middle" fill="#fff" fontSize="28" fontWeight="bold">
          {bmi > 0 ? bmi.toFixed(1) : '--'}
        </text>
        <text x={cx} y={cy + 6} textAnchor="middle" fill={cat.color} fontSize="13" fontWeight="600">{cat.label}</text>
      </svg>
    </div>
  );
}

// ── Stat Card ──
function StatCard({ label, value, unit, color, info }) {
  return (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <span className="stat-label">{label}</span>
      <span className="stat-value" style={{ color }}>{value}</span>
      <span className="stat-unit">{unit}</span>
      {info && <span className="stat-info">{info}</span>}
    </div>
  );
}

// ── Workout Planner ──
function WorkoutPlanner({ char: c, bmi }) {
  const dur = recDuration(bmi, c.intensity);
  const exercises = recExercises(bmi).slice(0, 5);
  const kcal = Math.round(exercises.reduce((s, e) => s + e.kcalPerMin * (dur / exercises.length), 0));

  return (
    <div className="card">
      <h3>🎯 今日推荐训练 · {c.name}</h3>
      <p className="card-sub">BMI {bmi.toFixed(1)} · 强度 Lv.{c.intensity}</p>
      <div className="planner-grid">
        <div className="planner-duration">
          <span className="planner-big">{dur}</span>
          <span className="planner-unit">分钟</span>
          <span className="planner-kcal">~{kcal} kcal</span>
        </div>
        <div className="planner-exercises">
          {exercises.map(ex => (
            <div key={ex.name} className={`planner-ex planner-ex-${ex.color}`}>
              <span className="planner-ex-icon">{ex.icon}</span>
              <span className="planner-ex-name">{ex.name}</span>
              <span className="planner-ex-time">~{Math.round(dur / exercises.length)}min</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Exercise Ranking ──
function ExerciseRanking({ bmi }) {
  const ranked = recExercises(bmi);
  const maxK = Math.max(...ranked.map(e => e.kcalPerMin));
  const cols = { blue: '#3b82f6', yellow: '#eab308', red: '#ef4444', green: '#22c55e' };

  return (
    <div className="card">
      <h3>🏆 动作燃脂排行</h3>
      <p className="card-sub">BMI {bmi >= 35 ? '≥35 — 自动优先低冲击动作' : '<35 — 燃脂效率优先'}</p>
      <div className="exercise-list">
        {ranked.map((ex, i) => (
          <div key={ex.name} className="exercise-row">
            <span className="ex-rank">#{i + 1}</span>
            <span className="ex-icon">{ex.icon}</span>
            <span className="ex-name">{ex.name}</span>
            <span className="ex-tag" style={{ background: cols[ex.color] + '22', color: cols[ex.color] }}>{ex.category}</span>
            <span className="ex-joint">{ex.joint}</span>
            <div className="ex-bar-track">
              <div className="ex-bar-fill" style={{ width: `${(ex.kcalPerMin / maxK) * 100}%`, background: cols[ex.color], boxShadow: `0 0 10px ${cols[ex.color]}33` }} />
            </div>
            <span className="ex-kcal">{ex.kcalPerMin} <small>kcal/min</small></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Weekly Plan ──
function WeeklyPlan({ char: c, bmi }) {
  const dur = recDuration(bmi, c.intensity);
  const today = new Date().getDay();
  const tIdx = today === 0 ? 6 : today - 1;

  return (
    <div className="card">
      <h3>📅 周训练计划 · {c.name}</h3>
      <div className="week-grid">
        {WEEKLY_TEMPLATE.map((p, i) => {
          const isToday = i === tIdx;
          const isRest = i >= c.freq;
          return (
            <div key={p.day} className={`day-card ${isToday ? 'today' : ''} ${isRest ? 'rest' : ''}`}>
              <div className="day-name">{p.day}</div>
              <div className="day-main">{isRest ? '休息' : p.type}</div>
              <div className="day-extra">{isRest ? '' : p.extra}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Weight History ──
function WeightHistory({ char: c, onUpdate }) {
  const handleLog = () => {
    const today = new Date().toISOString().slice(0, 10);
    const filtered = c.history.filter(h => h.date !== today);
    onUpdate({ ...c, history: [...filtered, { date: today, weight: c.weight }] });
  };

  const sorted = [...c.history].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="card">
      <div className="history-header">
        <h3>📈 体重记录 · {c.name}</h3>
        <button className="btn-save-sm" onClick={handleLog}>📝 记录今日 {c.weight}kg</button>
      </div>
      {sorted.length > 1 ? (
        <>
          <div className="history-chart">
            {sorted.map((h, i) => {
              const minW = Math.min(...sorted.map(x => x.weight)) - 2;
              const maxW = Math.max(...sorted.map(x => x.weight)) + 2;
              const hPct = ((h.weight - minW) / (maxW - minW)) * 100;
              const prev = i > 0 ? sorted[i - 1].weight : h.weight;
              const diff = h.weight - prev;
              return (
                <div key={h.date} className="hist-bar-group" title={`${h.date}: ${h.weight}kg`}>
                  <span className="hist-weight">{h.weight}</span>
                  {i > 0 && diff !== 0 && (
                    <span className={`hist-diff ${diff < 0 ? 'down' : 'up'}`}>{diff > 0 ? '+' : ''}{diff.toFixed(1)}</span>
                  )}
                  <div className="hist-bar" style={{ height: `${hPct}%` }} />
                  <span className="hist-date">{h.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
          <div className="history-trend">
            {(() => {
              const d = sorted[0].weight - sorted[sorted.length - 1].weight;
              return d > 0 ? `📉 累计减重 ${d.toFixed(1)} kg 🎉` : d < 0 ? `📈 上升 ${Math.abs(d).toFixed(1)} kg` : '➡️ 持平';
            })()}
          </div>
        </>
      ) : (
        <p className="card-sub" style={{ marginTop: 8 }}>还没有体重记录，点上方按钮开始追踪</p>
      )}
    </div>
  );
}

// ── Character Detail View ──
function CharacterView({ char, onBack, onUpdate, onDelete }) {
  const bmi = calcBMI(char.weight, char.height);
  const bmr = calcBMR(char.weight, char.height, char.age);
  const tdee = calcTDEE(bmr, char.freq);
  const target = Math.round(tdee * 0.78);
  const cat = bmiCat(bmi);
  const [editing, setEditing] = useState(false);

  return (
    <div className="detail-view">
      <div className="detail-header">
        <button className="btn-back" onClick={onBack}>← 返回角色列表</button>
        <div className="detail-actions">
          <button className="btn-edit" onClick={() => setEditing(true)}>✏️ 编辑</button>
          {char.id !== 'jin-chengxu' && (
            <button className="btn-delete" onClick={() => { if (window.confirm(`删除 ${char.name}？`)) onDelete(char.id); }}>
              🗑 删除
            </button>
          )}
        </div>
      </div>

      <h2 className="detail-name">{char.name} <span className="detail-id">Lv.{char.intensity}</span></h2>

      <section className="stats-row">
        <StatCard label="体重" value={char.weight} unit="kg" color="#f97316" info={cat.label} />
        <StatCard label="基础代谢" value={bmr} unit="kcal/天" color="#3b82f6" />
        <StatCard label="维持热量" value={tdee} unit="kcal/天" color="#a78bfa" />
        <StatCard label="减脂目标" value={target} unit="kcal/天" color="#22c55e" info={`缺口 ~${tdee - target}`} />
      </section>

      <section className="middle-row">
        <BMIGauge bmi={bmi} />
        <WorkoutPlanner char={char} bmi={bmi} />
      </section>

      <ExerciseRanking bmi={bmi} />
      <WeeklyPlan char={char} bmi={bmi} />
      <WeightHistory char={char} onUpdate={onUpdate} />

      {editing && (
        <CharForm
          initial={char}
          onSave={(updated) => { onUpdate(updated); setEditing(false); }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════
//  App — Home screen (character cards)
// ═══════════════════════════════════════

export default function App() {
  const [characters, setCharacters] = useState(loadCharacters);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { saveCharacters(characters); }, [characters]);

  const updateChar = useCallback((updated) => {
    setCharacters(prev => prev.map(c => c.id === updated.id ? updated : c));
  }, []);

  const deleteChar = useCallback((id) => {
    setCharacters(prev => prev.filter(c => c.id !== id));
    setSelected(null);
  }, []);

  const createChar = useCallback((newChar) => {
    setCharacters(prev => [...prev, newChar]);
    setShowForm(false);
  }, []);

  // ── Home: character cards ──
  if (!selected) {
    return (
      <div className="app">
        <header className="header">
          <div>
            <h1>🔥 RingFit 角色管理</h1>
            <p className="subtitle">点击角色查看详情 · 数据存于浏览器</p>
          </div>
        </header>

        <div className="char-grid">
          {characters.map(c => (
            <CharCard key={c.id} char={c} onClick={() => setSelected(c)} />
          ))}
          <AddCard onClick={() => setShowForm(true)} />
        </div>

        {showForm && (
          <CharForm onSave={createChar} onCancel={() => setShowForm(false)} />
        )}

        <footer className="footer">
          <span>Vibe Coding · Claude Code + Vite + React</span>
          <span className="footer-divider">|</span>
          <span>{characters.length} 位角色</span>
        </footer>
      </div>
    );
  }

  // ── Detail: character dashboard ──
  return (
    <div className="app">
      <CharacterView
        char={selected}
        onBack={() => setSelected(null)}
        onUpdate={updateChar}
        onDelete={deleteChar}
      />
    </div>
  );
}

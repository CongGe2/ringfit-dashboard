import { useState, useEffect, useCallback } from 'react';

// ── Ring Fit exercise database ──
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
  { day: '周一', main: '冒险', extra: '节奏 1 首' },
  { day: '周二', main: '燃脂套餐', extra: '冒险 15min' },
  { day: '周三', main: '冒险', extra: '' },
  { day: '周四', main: '燃脂套餐', extra: '节奏 2 首' },
  { day: '周五', main: '冒险', extra: '节奏 1 首' },
  { day: '周六', main: '自由模式', extra: '轻量' },
  { day: '周日', main: '休息', extra: '' },
];

// ── Helpers ──
function calcBMI(weight, height) {
  if (!height || height <= 0) return 0;
  return weight / ((height / 100) ** 2);
}

function bmiCategory(bmi) {
  if (bmi <= 0) return { label: '--', color: '#888' };
  if (bmi < 18.5) return { label: '偏瘦', color: '#60a5fa' };
  if (bmi < 24) return { label: '正常', color: '#4ade80' };
  if (bmi < 28) return { label: '超重', color: '#fbbf24' };
  if (bmi < 35) return { label: '肥胖一级', color: '#f97316' };
  return { label: '肥胖二级', color: '#ef4444' };
}

function calcBMR(weight, height, age) {
  return Math.round(10 * weight + 6.25 * height - 5 * age + 5);
}

function calcTDEE(bmr, freq) {
  const factors = { 0: 1.2, 1: 1.2, 2: 1.375, 3: 1.375, 4: 1.55, 5: 1.55, 6: 1.725, 7: 1.9 };
  return Math.round(bmr * (factors[Math.min(freq, 7)] || 1.375));
}

function recommendDuration(bmi, intensity) {
  // BMI ≥ 35: 20-30min, BMI < 35: 25-45min, scaled by intensity
  const base = bmi >= 35 ? 25 : 35;
  return Math.round(base * (intensity / 20));
}

function recommendExercises(bmi) {
  if (bmi >= 35) {
    // joint-friendly: prioritize low-impact blue + yellow
    return EXERCISES.filter(e => e.joint === '友好' || e.name === '登山式')
      .sort((a, b) => b.kcalPerMin - a.kcalPerMin);
  }
  // general: all blue/yellow first
  return [...EXERCISES].sort((a, b) => {
    const order = { blue: 1, yellow: 2, red: 3, green: 4 };
    return (order[a.color] || 5) - (order[b.color] || 5) || b.kcalPerMin - a.kcalPerMin;
  });
}

// ── Load/Save ──
function loadProfile() {
  try {
    const raw = localStorage.getItem('ringfit_profile');
    if (raw) return JSON.parse(raw);
  } catch {}
  return { height: 182, weight: 129.5, age: 21, freq: 6, intensity: 19 };
}

function saveProfile(p) {
  try { localStorage.setItem('ringfit_profile', JSON.stringify(p)); } catch {}
}

function loadHistory() {
  try {
    const raw = localStorage.getItem('ringfit_history');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveHistory(h) {
  try { localStorage.setItem('ringfit_history', JSON.stringify(h)); } catch {}
}

// ── Components ──

function InputPanel({ profile, onChange, onSaveWeight }) {
  const handle = (key) => (e) => onChange({ ...profile, [key]: Number(e.target.value) || profile[key] });

  return (
    <div className="input-panel">
      <div className="input-group">
        <label>身高 <span>cm</span></label>
        <input type="number" value={profile.height} onChange={handle('height')} min="100" max="250" />
      </div>
      <div className="input-group">
        <label>体重 <span>kg</span></label>
        <input type="number" value={profile.weight} onChange={handle('weight')} step="0.1" min="30" max="300" />
      </div>
      <div className="input-group">
        <label>年龄</label>
        <input type="number" value={profile.age} onChange={handle('age')} min="10" max="99" />
      </div>
      <div className="input-group">
        <label>每周训练 <span>天</span></label>
        <input type="number" value={profile.freq} onChange={handle('freq')} min="0" max="7" />
      </div>
      <div className="input-group">
        <label>健身环<span>强度</span></label>
        <div className="intensity-slider">
          <input type="range" value={profile.intensity} onChange={handle('intensity')} min="1" max="30" />
          <span className="intensity-val">Lv.{profile.intensity}</span>
        </div>
      </div>
      <button className="btn-save" onClick={onSaveWeight}>
        📝 记录今日体重
      </button>
    </div>
  );
}

function BMIGauge({ bmi }) {
  const angle = Math.min(Math.max(bmi, 0) / 45, 1) * 180;
  const rad = (angle - 90) * (Math.PI / 180);
  const r = 120, cx = 155, cy = 140;
  const nx = cx + r * 0.72 * Math.cos(rad);
  const ny = cy + r * 0.72 * Math.sin(rad);
  const cat = bmiCategory(bmi);

  return (
    <div className="gauge-card">
      <h3>BMI 指数</h3>
      <svg viewBox="0 0 310 195" className="gauge-svg">
        <defs>
          <linearGradient id="bmiGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="35%" stopColor="#fbbf24" />
            <stop offset="60%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        <path d="M 25 140 A 130 130 0 0 1 285 140" fill="none" stroke="url(#bmiGrad)" strokeWidth="18" strokeLinecap="round" />
        {[18.5, 24, 28, 35].map(v => {
          const a = ((v / 45) * 180 - 90) * (Math.PI / 180);
          return <text key={v} x={cx + (r + 17) * Math.cos(a)} y={cy + (r + 17) * Math.sin(a)} textAnchor="middle" fill="#888" fontSize="10">{v}</text>;
        })}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="6" fill="#fff" />
        <text x={cx} y={cy - 20} textAnchor="middle" fill="#fff" fontSize="30" fontWeight="bold">
          {bmi > 0 ? bmi.toFixed(1) : '--'}
        </text>
        <text x={cx} y={cy + 5} textAnchor="middle" fill={cat.color} fontSize="14" fontWeight="600">{cat.label}</text>
      </svg>
    </div>
  );
}

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

function WorkoutPlanner({ profile, bmi }) {
  const duration = recommendDuration(bmi, profile.intensity);
  const exercises = recommendExercises(bmi).slice(0, 5);
  const totalKcal = Math.round(exercises.reduce((s, e) => s + e.kcalPerMin * (duration / exercises.length), 0));

  return (
    <div className="card planner-card">
      <h3>🎯 今日推荐训练</h3>
      <p className="card-sub">根据 BMI {bmi.toFixed(1)} · 强度 Lv.{profile.intensity} 自动生成</p>
      <div className="planner-grid">
        <div className="planner-duration">
          <span className="planner-big">{duration}</span>
          <span className="planner-unit">分钟有效运动</span>
          <span className="planner-kcal">预计消耗 ~{totalKcal} kcal</span>
        </div>
        <div className="planner-exercises">
          {exercises.map((ex, i) => (
            <div key={ex.name} className={`planner-ex planner-ex-${ex.color}`}>
              <span className="planner-ex-icon">{ex.icon}</span>
              <span className="planner-ex-name">{ex.name}</span>
              <span className="planner-ex-time">~{Math.round(duration / exercises.length)}min</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExerciseRanking({ bmi }) {
  const ranked = recommendExercises(bmi);
  const maxKcal = Math.max(...ranked.map(e => e.kcalPerMin));
  const colors = { blue: '#3b82f6', yellow: '#eab308', red: '#ef4444', green: '#22c55e' };

  return (
    <div className="card">
      <h3>🏆 动作燃脂排行</h3>
      <p className="card-sub">按每分钟消耗自动排序 · 颜色 = 游戏内技能分类</p>
      <div className="exercise-list">
        {ranked.map((ex, i) => (
          <div key={ex.name} className="exercise-row">
            <span className="ex-rank">#{i + 1}</span>
            <span className="ex-icon">{ex.icon}</span>
            <span className="ex-name">{ex.name}</span>
            <span className="ex-tag" style={{ background: colors[ex.color] + '22', color: colors[ex.color] }}>{ex.category}</span>
            <span className="ex-joint" title={ex.joint}>{ex.joint}</span>
            <div className="ex-bar-track">
              <div className="ex-bar-fill" style={{ width: `${(ex.kcalPerMin / maxKcal) * 100}%`, background: colors[ex.color], boxShadow: `0 0 12px ${colors[ex.color]}44` }} />
            </div>
            <span className="ex-kcal">{ex.kcalPerMin} <small>kcal/min</small></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyPlan({ profile, bmi }) {
  const dur = recommendDuration(bmi, profile.intensity);
  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1;

  return (
    <div className="card">
      <h3>📅 本周训练计划</h3>
      <p className="card-sub">参考时长 {dur}min/天 · 你的目标 {profile.freq}天/周</p>
      <div className="week-grid">
        {WEEKLY_TEMPLATE.map((plan, i) => {
          const isToday = i === todayIdx;
          const isRest = i >= profile.freq;
          return (
            <div key={plan.day} className={`day-card ${isToday ? 'today' : ''} ${isRest ? 'rest' : ''}`}>
              <div className="day-name">{plan.day}</div>
              <div className="day-main">{isRest ? '休息' : plan.main}</div>
              <div className="day-extra">{isRest ? '' : plan.extra}</div>
              {!isRest && <div className="day-target">🔥 ~{Math.round(dur * (plan.main.includes('燃脂') ? 1.2 : plan.main === '自由模式' ? 0.6 : 1) * 8)} kcal</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeightHistory({ history, onClear }) {
  if (!history.length) return null;

  const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
  const minW = Math.min(...sorted.map(h => h.weight)) - 2;
  const maxW = Math.max(...sorted.map(h => h.weight)) + 2;

  return (
    <div className="card">
      <div className="history-header">
        <h3>📈 体重记录</h3>
        {history.length > 0 && (
          <button className="btn-clear" onClick={onClear}>清空</button>
        )}
      </div>
      {sorted.length > 1 ? (
        <div className="history-chart">
          {sorted.map((h, i) => {
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
      ) : (
        <div className="history-single">
          {sorted.map(h => (
            <div key={h.date} className="hist-entry">
              <span className="hist-date">{h.date}</span>
              <span className="hist-weight-big">{h.weight} kg</span>
              <span className="hist-bmi">BMI {calcBMI(h.weight, loadProfile().height).toFixed(1)}</span>
            </div>
          ))}
        </div>
      )}
      {sorted.length > 1 && (
        <div className="history-trend">
          {(() => {
            const first = sorted[0].weight, last = sorted[sorted.length - 1].weight;
            const total = first - last;
            return total > 0 ? `📉 累计减重 ${total.toFixed(1)} kg 🎉` : total < 0 ? `📈 体重上升 ${Math.abs(total).toFixed(1)} kg` : '➡️ 体重持平';
          })()}
        </div>
      )}
    </div>
  );
}

// ── App ──
export default function App() {
  const [profile, setProfile] = useState(loadProfile);
  const [history, setHistory] = useState(loadHistory);

  useEffect(() => { saveProfile(profile); }, [profile]);
  useEffect(() => { saveHistory(history); }, [history]);

  const bmi = calcBMI(profile.weight, profile.height);
  const bmr = calcBMR(profile.weight, profile.height, profile.age);
  const tdee = calcTDEE(bmr, profile.freq);
  const targetKcal = Math.round(tdee * 0.78); // ~22% deficit
  const cat = bmiCategory(bmi);

  const handleSaveWeight = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    setHistory(prev => {
      const filtered = prev.filter(h => h.date !== today);
      return [...filtered, { date: today, weight: profile.weight, bmi: +bmi.toFixed(1) }];
    });
  }, [profile.weight, bmi]);

  const handleClearHistory = useCallback(() => {
    if (window.confirm('确认清空所有体重记录？')) setHistory([]);
  }, []);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <h1><span className="ring-emoji">🔥</span> RingFit Dashboard</h1>
          <p className="subtitle">健身环数据追踪 · 输入数据即时计算</p>
        </div>
      </header>

      {/* Input Panel */}
      <InputPanel profile={profile} onChange={setProfile} onSaveWeight={handleSaveWeight} />

      {/* Stats Row */}
      <section className="stats-row">
        <StatCard label="当前体重" value={profile.weight} unit="kg" color="#f97316" info={`${cat.label}`} />
        <StatCard label="基础代谢" value={bmr} unit="kcal/天" color="#3b82f6" />
        <StatCard label="维持热量" value={tdee} unit="kcal/天" color="#a78bfa" />
        <StatCard label="减脂目标" value={targetKcal} unit="kcal/天" color="#22c55e" info={`缺口 ~${tdee - targetKcal} kcal`} />
      </section>

      {/* BMI + Workout Planner */}
      <section className="middle-row">
        <BMIGauge bmi={bmi} />
        <WorkoutPlanner profile={profile} bmi={bmi} />
      </section>

      {/* Exercise Ranking */}
      <ExerciseRanking bmi={bmi} />

      {/* Weekly Plan */}
      <WeeklyPlan profile={profile} bmi={bmi} />

      {/* Weight History */}
      <WeightHistory history={history} onClear={handleClearHistory} />

      {/* Footer */}
      <footer className="footer">
        <span>Vibe Coding · Claude Code + Vite + React</span>
        <span className="footer-divider">|</span>
        <span>数据存储在你的浏览器中，不会上传</span>
      </footer>
    </div>
  );
}

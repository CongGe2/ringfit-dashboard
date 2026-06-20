import { useState } from 'react';

// ── User health profile ──
const PROFILE = {
  name: 'Jin Chengxu',
  height: 182,
  weight: 129.5,
  age: 21,
  bmr: 2333,
  tdee: 3100,
  targetCalories: 2400,
  targetWeight: 95,
  intensityLevel: 19,
  weekGoal: 6,
};

// ── Ring Fit exercises ranked by calorie burn ──
const EXERCISES = [
  { name: '深蹲', color: 'blue', kcalPerMin: 12, jointRisk: 'high', icon: '🦵' },
  { name: '登山式', color: 'blue', kcalPerMin: 14, jointRisk: 'med', icon: '⛰️' },
  { name: '高抬腿', color: 'blue', kcalPerMin: 11, jointRisk: 'med', icon: '🦶' },
  { name: '腿部推压', color: 'blue', kcalPerMin: 8, jointRisk: 'low', icon: '💪' },
  { name: '平板支撑', color: 'yellow', kcalPerMin: 9, jointRisk: 'low', icon: '🧘' },
  { name: '转体', color: 'yellow', kcalPerMin: 7, jointRisk: 'low', icon: '🌀' },
  { name: '仰卧抬腿', color: 'yellow', kcalPerMin: 8, jointRisk: 'low', icon: '🦵' },
  { name: '推压', color: 'red', kcalPerMin: 6, jointRisk: 'low', icon: '🤲' },
  { name: '拉伸', color: 'red', kcalPerMin: 5, jointRisk: 'low', icon: '🙆' },
  { name: '瑜伽姿势', color: 'green', kcalPerMin: 4, jointRisk: 'low', icon: '🧘' },
];

const WEEKLY_PLAN = [
  { day: '周一', main: '冒险 25min', extra: '节奏 1 首', target: 280 },
  { day: '周二', main: '燃脂套餐 18min', extra: '冒险 15min', target: 320 },
  { day: '周三', main: '冒险 30min', extra: '—', target: 260 },
  { day: '周四', main: '燃脂套餐 18min', extra: '节奏 2 首', target: 350 },
  { day: '周五', main: '冒险 25min', extra: '节奏 1 首', target: 280 },
  { day: '周六', main: '自由模式', extra: '轻量游玩', target: 180 },
  { day: '周日', main: '休息日', extra: '拉伸放松', target: 0 },
];

// ── Helper: BMI → category ──
function bmiCategory(bmi) {
  if (bmi < 18.5) return { label: '偏瘦', color: '#60a5fa' };
  if (bmi < 24) return { label: '正常', color: '#4ade80' };
  if (bmi < 28) return { label: '超重', color: '#fbbf24' };
  if (bmi < 35) return { label: '肥胖一级', color: '#f97316' };
  return { label: '肥胖二级', color: '#ef4444' };
}

// ── Component: BMI Gauge (SVG semicircle) ──
function BMIGauge({ bmi }) {
  const angle = Math.min((bmi / 45) * 180, 180); // clamp, max 45 BMI
  const rad = (angle - 90) * (Math.PI / 180);
  const r = 130;
  const cx = 160;
  const cy = 150;
  const needleX = cx + r * 0.75 * Math.cos(rad);
  const needleY = cy + r * 0.75 * Math.sin(rad);

  const cat = bmiCategory(bmi);

  return (
    <div className="gauge-card">
      <h3>BMI 指数</h3>
      <svg viewBox="0 0 320 200" className="gauge-svg">
        {/* Background arc */}
        <defs>
          <linearGradient id="bmiGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="35%" stopColor="#fbbf24" />
            <stop offset="60%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        {/* Arc track */}
        <path
          d="M 30 150 A 130 130 0 0 1 290 150"
          fill="none"
          stroke="url(#bmiGrad)"
          strokeWidth="20"
          strokeLinecap="round"
        />
        {/* Tick marks */}
        {[18.5, 24, 28, 35].map((v) => {
          const a = ((v / 45) * 180 - 90) * (Math.PI / 180);
          const tx = cx + (r + 16) * Math.cos(a);
          const ty = cy + (r + 16) * Math.sin(a);
          return (
            <text key={v} x={tx} y={ty} textAnchor="middle" fill="#888" fontSize="10">
              {v}
            </text>
          );
        })}
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="#fff"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="6" fill="#fff" />
        {/* Center text */}
        <text x={cx} y={cy - 20} textAnchor="middle" fill="#fff" fontSize="32" fontWeight="bold">
          {bmi.toFixed(1)}
        </text>
        <text x={cx} y={cy + 5} textAnchor="middle" fill={cat.color} fontSize="14" fontWeight="600">
          {cat.label}
        </text>
      </svg>
    </div>
  );
}

// ── Component: Stat Card ──
function StatCard({ label, value, unit, color }) {
  return (
    <div className="stat-card" style={{ borderColor: color }}>
      <span className="stat-label">{label}</span>
      <span className="stat-value" style={{ color }}>
        {value}
      </span>
      <span className="stat-unit">{unit}</span>
    </div>
  );
}

// ── Component: Exercise Bar ──
function ExerciseBar({ ex, maxKcal, rank }) {
  const width = (ex.kcalPerMin / maxKcal) * 100;
  const colors = { blue: '#3b82f6', yellow: '#eab308', red: '#ef4444', green: '#22c55e' };
  const labels = { blue: '腿部', yellow: '核心', red: '手臂', green: '瑜伽' };

  return (
    <div className="exercise-row">
      <span className="ex-rank">#{rank}</span>
      <span className="ex-icon">{ex.icon}</span>
      <span className="ex-name">{ex.name}</span>
      <span className="ex-tag" style={{ background: colors[ex.color] + '22', color: colors[ex.color] }}>
        {labels[ex.color]}
      </span>
      <div className="ex-bar-track">
        <div
          className="ex-bar-fill"
          style={{
            width: `${width}%`,
            background: colors[ex.color],
            boxShadow: `0 0 12px ${colors[ex.color]}44`,
          }}
        />
      </div>
      <span className="ex-kcal">{ex.kcalPerMin} <small>kcal/min</small></span>
    </div>
  );
}

// ── Component: Day Card ──
function DayCard({ plan, isToday }) {
  return (
    <div className={`day-card ${isToday ? 'today' : ''} ${plan.target === 0 ? 'rest' : ''}`}>
      <div className="day-name">{plan.day}</div>
      <div className="day-main">{plan.main}</div>
      <div className="day-extra">{plan.extra}</div>
      {plan.target > 0 ? (
        <div className="day-target">🔥 {plan.target} kcal</div>
      ) : (
        <div className="day-target rest-label">😴 休息</div>
      )}
    </div>
  );
}

// ── Main App ──
export default function App() {
  const bmi = PROFILE.weight / ((PROFILE.height / 100) ** 2);
  const cat = bmiCategory(bmi);
  const maxKcal = Math.max(...EXERCISES.map((e) => e.kcalPerMin));
  const today = new Date().getDay(); // 0=Sun → map to 6
  const todayIdx = today === 0 ? 6 : today - 1; // Mon=0

  // Weight projection
  const weeklyLoss = 0.9; // kg/week at ~900kcal daily deficit
  const projections = Array.from({ length: 12 }, (_, i) => ({
    week: i + 1,
    weight: Math.max(PROFILE.targetWeight, PROFILE.weight - weeklyLoss * (i + 1)),
  }));

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-left">
          <h1>
            <span className="ring-emoji">🔥</span> RingFit Dashboard
          </h1>
          <p className="subtitle">{PROFILE.name} · 强度 Lv.{PROFILE.intensityLevel} · 目标 {PROFILE.weekGoal}次/周</p>
        </div>
        <div className="header-right">
          <div className="today-badge">
            <span className="today-icon">🎮</span>
            {WEEKLY_PLAN[todayIdx]?.day === '周日' ? '今天休息！' : '今日待训练'}
          </div>
        </div>
      </header>

      {/* ── Top Stats Row ── */}
      <section className="stats-row">
        <StatCard label="当前体重" value={PROFILE.weight} unit="kg" color="#f97316" />
        <StatCard label="基础代谢" value={PROFILE.bmr} unit="kcal/天" color="#3b82f6" />
        <StatCard label="维持热量" value={PROFILE.tdee} unit="kcal/天" color="#a78bfa" />
        <StatCard label="目标摄入" value={PROFILE.targetCalories} unit="kcal/天" color="#22c55e" />
      </section>

      {/* ── BMI + Projection ── */}
      <section className="middle-row">
        <BMIGauge bmi={bmi} />
        <div className="projection-card">
          <h3>📉 体重走势预测</h3>
          <p className="projection-sub">按当前计划 · 每周下降 ~0.9 kg</p>
          <div className="projection-chart">
            {projections.map((p) => {
              const maxW = projections[0].weight;
              const minW = projections[projections.length - 1].weight;
              const h = ((p.weight - minW) / (maxW - minW)) * 100;
              return (
                <div key={p.week} className="proj-bar-group" title={`第${p.week}周: ${p.weight.toFixed(1)} kg`}>
                  <span className="proj-weight">{p.weight.toFixed(0)}</span>
                  <div className="proj-bar" style={{ height: `${h}%` }} />
                  <span className="proj-week">W{p.week}</span>
                </div>
              );
            })}
          </div>
          <div className="projection-goal">
            🎯 目标 <strong>{PROFILE.targetWeight} kg</strong> · 预计 <strong>~9 个月</strong> 达标
          </div>
        </div>
      </section>

      {/* ── Exercise Ranking ── */}
      <section className="card">
        <h3>🏆 健身环动作燃脂排行</h3>
        <p className="card-sub">按每分钟消耗热量排序 · 颜色对应游戏内技能分类</p>
        <div className="exercise-list">
          {[...EXERCISES]
            .sort((a, b) => b.kcalPerMin - a.kcalPerMin)
            .map((ex, i) => (
              <ExerciseBar key={ex.name} ex={ex} maxKcal={maxKcal} rank={i + 1} />
            ))}
        </div>
      </section>

      {/* ── Weekly Plan ── */}
      <section className="card">
        <h3>📅 本周训练计划</h3>
        <p className="card-sub">健身环 · 强度 Lv.{PROFILE.intensityLevel} · 蓝色技能优先</p>
        <div className="week-grid">
          {WEEKLY_PLAN.map((plan, i) => (
            <DayCard key={plan.day} plan={plan} isToday={i === todayIdx} />
          ))}
        </div>
        <div className="week-total">
          本周目标总消耗：<strong>{WEEKLY_PLAN.reduce((s, p) => s + p.target, 0)} kcal</strong>
        </div>
      </section>

      {/* ── Rules / Tips ── */}
      <section className="card tips-card">
        <h3>💡 运动安全守则</h3>
        <div className="tips-grid">
          <div className="tip">
            <span className="tip-icon">🟢</span>
            <span>落地轻缓，跳跃类动作减少冲击</span>
          </div>
          <div className="tip">
            <span className="tip-icon">🔵</span>
            <span>蓝+黄技能优先，燃脂效率最高</span>
          </div>
          <div className="tip">
            <span className="tip-icon">🟡</span>
            <span>每周累计有效运动 ≥180 分钟</span>
          </div>
          <div className="tip">
            <span className="tip-icon">💧</span>
            <span>运动中每小时补水 500-800ml</span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <span>Built with Vibe Coding · Claude Code + Vite + React</span>
        <span className="footer-divider">|</span>
        <span>数据基于个人健康档案自动生成</span>
      </footer>
    </div>
  );
}

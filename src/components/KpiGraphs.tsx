import React, { useMemo, useState } from 'react';
import { DealRow } from '../data/pipeline';
import { CommercialKpis, KpiKey } from '../utils/kpi';
import { n2, pct2, days2 } from '../utils/format';

/* ───────────── Paleta oficial Tecnovoa ───────────── */
const C = {
  cyan: '#00add7',
  primary: '#0758a6',
  deep: '#052f66',
  ok: '#0f9d6b',
  bad: '#e11d48',
  warn: '#f59e0b',
  violet: '#7c3aed',
  teal: '#14b8a6',
  line: '#d0e3ef',
  ink: '#0a2347',
};
const PALETTE = [C.primary, C.cyan, C.ok, C.violet, C.warn, C.teal, C.bad, C.deep];
const FONT = "'Sora', 'Figtree', system-ui, sans-serif";

const hashColor = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
};

type Money = (v: number) => string;

interface Circ {
  id: string;
  x: number;
  y: number;
  r: number;
  fill: string;
  op: number;
  stroke?: string;
  dash?: string;
  inner?: number;
  label?: string;
  tip: string;
}

/* ───────────── Empaquetado de círculos (espiral) ───────────── */
function pack(rs: number[], anchorFirst = false): { x: number; y: number }[] {
  const order = rs.map((_, i) => i).sort((a, b) => rs[b] - rs[a]);
  if (anchorFirst && rs.length > 0) {
    order.splice(order.indexOf(0), 1);
    order.unshift(0);
  }
  const placed: { x: number; y: number; r: number }[] = [];
  const out: { x: number; y: number }[] = new Array(rs.length);
  for (const idx of order) {
    const r = rs[idx];
    if (placed.length === 0) {
      placed.push({ x: 0, y: 0, r });
      out[idx] = { x: 0, y: 0 };
      continue;
    }
    for (let t = 0; t < 6000; t += 0.18) {
      const rho = 1.1 * t;
      const x = rho * Math.cos(t);
      const y = rho * Math.sin(t);
      if (placed.every((p) => Math.hypot(p.x - x, p.y - y) >= p.r + r + 0.6)) {
        placed.push({ x, y, r });
        out[idx] = { x, y };
        break;
      }
    }
    if (!out[idx]) out[idx] = { x: 0, y: 0 };
  }
  return out;
}

function fit(cs: Circ[], W: number, H: number, pad = 3): Circ[] {
  if (cs.length === 0) return cs;
  const minX = Math.min(...cs.map((c) => c.x - c.r));
  const maxX = Math.max(...cs.map((c) => c.x + c.r));
  const minY = Math.min(...cs.map((c) => c.y - c.r));
  const maxY = Math.max(...cs.map((c) => c.y + c.r));
  const s = Math.min((W - 2 * pad) / (maxX - minX || 1), (H - 2 * pad) / (maxY - minY || 1));
  const ox = W / 2 - ((minX + maxX) / 2) * s;
  const oy = H / 2 - ((minY + maxY) / 2) * s;
  return cs.map((c) => ({ ...c, x: c.x * s + ox, y: c.y * s + oy, r: Math.max(0.9, c.r * s) }));
}

const radiusOf = (v: number, max: number, scale = 12) =>
  Math.max(1.2, (Math.sqrt(Math.max(v, 0)) / Math.sqrt(max || 1)) * scale);

const daysOf = (d: DealRow): number | null => {
  if (!d.pipelineEntryDate || !d.estimatedCloseDate) return null;
  const diff = Math.round(
    (new Date(d.estimatedCloseDate).getTime() - new Date(d.pipelineEntryDate).getTime()) / 86400000
  );
  return diff >= 0 ? diff : null;
};

const initials = (s: string) => s.replace(/[^A-Za-zÁÉÍÓÚÑ ]/g, '').trim().slice(0, 2).toUpperCase();

const sumBy = <T,>(arr: T[], key: (t: T) => string, val: (t: T) => number) => {
  const m = new Map<string, number>();
  arr.forEach((t) => m.set(key(t), (m.get(key(t)) || 0) + val(t)));
  return m;
};

/* ───────────── MINI-GRAFOS (tarjetas) ───────────── */
const MW = 240;
const MH = 84;

interface GraphProps {
  kpiKey: KpiKey;
  deals: DealRow[];
  kpis: CommercialKpis;
  quotaClp: number;
  money: Money;
}

const Empty = () => (
  <text x={MW / 2} y={MH / 2} textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily={FONT}>
    Sin datos en el período
  </text>
);

function buildMini({ kpiKey, deals, kpis, quotaClp, money }: GraphProps): {
  circles: Circ[];
  extra?: React.ReactNode;
  empty?: boolean;
} {
  const open = deals.filter((d) => d.status === 'Abierta');
  const won = deals.filter((d) => d.status === 'Closed Won');
  const lost = deals.filter((d) => d.status === 'Closed Lost');

  switch (kpiKey) {
    case 'weightedPipeline': {
      if (!open.length) return { circles: [], empty: true };
      const max = Math.max(...open.map((d) => d.estimatedAmount));
      const stages = Array.from(new Set(open.map((d) => d.stage)));
      let off = 0;
      const all: Circ[] = [];
      stages.forEach((st) => {
        const g = open.filter((d) => d.stage === st);
        const rs = g.map((d) => radiusOf(d.estimatedAmount, max));
        const pos = pack(rs);
        const bw = Math.max(...pos.map((p, i) => p.x + rs[i])) - Math.min(...pos.map((p, i) => p.x - rs[i]));
        const cx = Math.min(...pos.map((p, i) => p.x - rs[i]));
        g.forEach((d, i) =>
          all.push({
            id: d.id,
            x: pos[i].x - cx + off,
            y: pos[i].y,
            r: rs[i],
            fill: hashColor(st),
            op: 0.25 + 0.75 * (d.probability / 100),
            tip: `${d.client} · ${st} · ${money(d.estimatedAmount)} · ${pct2(d.probability)}`,
          })
        );
        off += bw + 6;
      });
      return { circles: fit(all, MW, MH) };
    }
    case 'pipelineCoverage': {
      if (!open.length) return { circles: [], empty: true };
      const quota = kpis.remainingQuota > 0 ? kpis.remainingQuota : quotaClp;
      const max = Math.max(quota, ...open.map((d) => d.estimatedAmount));
      const rs = [radiusOf(quota, max), ...open.map((d) => radiusOf(d.estimatedAmount, max))];
      const pos = pack(rs, true);
      const all: Circ[] = [
        {
          id: 'quota',
          x: pos[0].x,
          y: pos[0].y,
          r: rs[0],
          fill: C.warn,
          op: 0.28,
          stroke: C.warn,
          dash: '3 2',
          label: 'Meta',
          tip: `Meta por cubrir: ${money(quota)}`,
        },
        ...open.map((d, i) => ({
          id: d.id,
          x: pos[i + 1].x,
          y: pos[i + 1].y,
          r: rs[i + 1],
          fill: C.cyan,
          op: 0.55,
          tip: `${d.client} · ${money(d.estimatedAmount)}`,
        })),
      ];
      return { circles: fit(all, MW, MH) };
    }
    case 'forecastAccuracy': {
      const a = kpis.forecastTotal;
      const b = kpis.projectedTotalAmount;
      const hi = Math.max(a, b) || 1;
      const lo = Math.min(a, b);
      const R = 38;
      return {
        circles: [],
        extra: (
          <g fontFamily={FONT}>
            <circle cx={52} cy={42} r={R} fill={C.cyan} opacity={0.15} stroke={C.cyan} strokeDasharray="3 2">
              <title>{`Pronóstico: ${money(a)}`}</title>
            </circle>
            <circle cx={52} cy={42 + R - R * Math.sqrt(lo / hi)} r={R * Math.sqrt(lo / hi)} fill={C.primary} opacity={0.75}>
              <title>{`Real + ponderado: ${money(b)}`}</title>
            </circle>
            <text x={52} y={46} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">
              {pct2(kpis.forecastAccuracy)}
            </text>
            <circle cx={110} cy={26} r={4} fill={C.cyan} opacity={0.5} />
            <text x={118} y={29} fontSize="9" fill="#4a6080">Pronóstico {money(a)}</text>
            <circle cx={110} cy={52} r={4} fill={C.primary} />
            <text x={118} y={55} fontSize="9" fill="#4a6080">Real + pond. {money(b)}</text>
          </g>
        ),
      };
    }
    case 'activePipelineValue': {
      if (!open.length) return { circles: [], empty: true };
      const byClient = sumBy(open, (d) => d.client, (d) => d.estimatedAmount);
      const items = Array.from(byClient.entries());
      const max = Math.max(...items.map(([, v]) => v));
      const rs = items.map(([, v]) => radiusOf(v, max));
      const pos = pack(rs);
      const all: Circ[] = items.map(([c, v], i) => ({
        id: c,
        x: pos[i].x,
        y: pos[i].y,
        r: rs[i],
        fill: hashColor(c),
        op: 0.8,
        label: initials(c),
        tip: `${c} · ${money(v)}`,
      }));
      return { circles: fit(all, MW, MH) };
    }
    case 'weightedGrossMarginPct': {
      if (!open.length) return { circles: [], empty: true };
      const w = sumBy(open, (d) => d.brand, (d) => d.weightedPipeline || d.estimatedAmount * 0.01);
      const mg = sumBy(open, (d) => d.brand, (d) => (d.weightedPipeline || d.estimatedAmount * 0.01) * ((d.estimatedMarginPct || 20) / 100));
      const items = Array.from(w.entries()).sort((a, b) => b[1] - a[1]).slice(0, 7);
      const max = items[0][1];
      const rs = items.map(([, v]) => radiusOf(v, max));
      const pos = pack(rs);
      const all: Circ[] = items.map(([b, v], i) => {
        const m = (mg.get(b)! / v) * 100;
        return {
          id: b,
          x: pos[i].x,
          y: pos[i].y,
          r: rs[i],
          fill: C.primary,
          op: 0.16,
          stroke: C.primary,
          inner: Math.sqrt(m / 100),
          label: initials(b),
          tip: `${b} · margen ${pct2(m)}`,
        };
      });
      return { circles: fit(all, MW, MH) };
    }
    case 'quoteToCloseDays': {
      const list = deals.map((d) => ({ d, days: daysOf(d) })).filter((x) => x.days !== null) as { d: DealRow; days: number }[];
      if (!list.length) return { circles: [], empty: true };
      const maxDays = 70;
      const nb = 14;
      const px = (days: number) => 8 + (Math.min(days, maxDays - 0.01) / maxDays) * (MW - 16);
      const binW = (MW - 16) / nb;
      const cols = Math.max(1, Math.floor(binW / 4.4));
      const rows = 11;
      const bins: { d: DealRow; days: number }[][] = Array.from({ length: nb }, () => []);
      list.forEach((x) => bins[Math.min(nb - 1, Math.floor(Math.min(x.days, maxDays - 0.01) / 5))].push(x));
      const circles: Circ[] = [];
      const more: React.ReactNode[] = [];
      bins.forEach((b, bi) => {
        b.forEach((x, i) => {
          if (i >= cols * rows) return;
          const col = Math.floor(i / rows);
          const row = i % rows;
          circles.push({
            id: x.d.id,
            x: 8 + bi * binW + 2.5 + col * 4.4,
            y: 66 - row * 4.4,
            r: 2,
            fill: x.days <= 30 ? C.ok : C.warn,
            op: 0.85,
            tip: `${x.d.client} · ${days2(x.days)}`,
          });
        });
        if (b.length > cols * rows)
          more.push(
            <text key={bi} x={8 + bi * binW + 2} y={14} fontSize="7" fill="#64748b" fontFamily={FONT}>
              +{b.length - cols * rows}
            </text>
          );
      });
      return {
        circles,
        extra: (
          <g fontFamily={FONT}>
            <line x1={6} x2={MW - 6} y1={70} y2={70} stroke={C.line} />
            <line x1={px(30)} x2={px(30)} y1={6} y2={72} stroke={C.warn} strokeDasharray="2 2" />
            <text x={px(30) + 2} y={10} fontSize="7" fill={C.warn}>30 d</text>
            <line x1={px(kpis.quoteToCloseDays)} x2={px(kpis.quoteToCloseDays)} y1={18} y2={72} stroke={C.primary} />
            <text x={px(kpis.quoteToCloseDays) + 2} y={24} fontSize="7" fill={C.primary}>Prom. {n2(kpis.quoteToCloseDays)}</text>
            <text x={8} y={80} fontSize="7" fill="#94a3b8">0 d</text>
            <text x={MW - 8} y={80} fontSize="7" fill="#94a3b8" textAnchor="end">70+ d</text>
            {more}
          </g>
        ),
      };
    }
    case 'winRate': {
      const n = won.length + lost.length;
      if (!n) return { circles: [], empty: true };
      const cols = Math.ceil(Math.sqrt((n * MW) / MH));
      const rowsN = Math.ceil(n / cols);
      const cell = Math.min((MW - 6) / cols, (MH - 6) / rowsN);
      const r = cell * 0.4;
      const x0 = (MW - cell * cols) / 2 + cell / 2;
      const y0 = (MH - cell * rowsN) / 2 + cell / 2;
      const list = [...won.map((d) => ({ d, w: true })), ...lost.map((d) => ({ d, w: false }))];
      return {
        circles: list.map((x, i) => ({
          id: x.d.id,
          x: x0 + (i % cols) * cell,
          y: y0 + Math.floor(i / cols) * cell,
          r,
          fill: x.w ? C.ok : C.bad,
          op: 0.85,
          tip: `${x.d.client} · ${x.w ? 'Ganada' : 'Perdida'} · ${money(x.d.estimatedAmount)}`,
        })),
      };
    }
    case 'averageDealSize': {
      const list = [...won].sort((a, b) => a.estimatedAmount - b.estimatedAmount);
      if (!list.length) return { circles: [], empty: true };
      const max = list[list.length - 1].estimatedAmount;
      const y = (v: number) => 74 - Math.sqrt(v / max) * 62;
      const avg = list.reduce((s, d) => s + d.estimatedAmount, 0) / list.length;
      return {
        circles: list.map((d, i) => ({
          id: d.id,
          x: 8 + (i / Math.max(1, list.length - 1)) * (MW - 16),
          y: y(d.estimatedAmount),
          r: 1.8 + Math.sqrt(d.estimatedAmount / max) * 3.2,
          fill: d.estimatedAmount >= avg ? C.primary : C.cyan,
          op: 0.8,
          tip: `${d.client} · ${money(d.estimatedAmount)}`,
        })),
        extra: (
          <g fontFamily={FONT}>
            <line x1={6} x2={MW - 6} y1={y(avg)} y2={y(avg)} stroke={C.warn} strokeDasharray="3 2" />
            <text x={MW - 8} y={y(avg) - 3} fontSize="7" textAnchor="end" fill={C.warn}>Prom. {money(avg)}</text>
          </g>
        ),
      };
    }
  }
}

export const KpiMiniGraph: React.FC<GraphProps> = (props) => {
  const { circles, extra, empty } = useMemo(() => buildMini(props), [props.kpiKey, props.deals, props.kpis, props.quotaClp]);
  return (
    <svg viewBox={`0 0 ${MW} ${MH}`} className="w-full" style={{ height: MH }} role="img" aria-label="Grafo de círculos del indicador">
      {empty && <Empty />}
      {circles.map((c) => (
        <g key={c.id}>
          <circle cx={c.x} cy={c.y} r={c.r} fill={c.fill} opacity={c.op} stroke={c.stroke} strokeDasharray={c.dash} strokeWidth={c.stroke ? 1 : 0}>
            <title>{c.tip}</title>
          </circle>
          {c.inner !== undefined && <circle cx={c.x} cy={c.y + c.r * (1 - c.inner)} r={c.r * c.inner} fill={C.ok} opacity={0.85} pointerEvents="none" />}
          {c.label && c.r > 7 && (
            <text x={c.x} y={c.y + 3} textAnchor="middle" fontSize={Math.min(9, c.r * 0.7)} fontWeight="700" fill={c.inner !== undefined ? C.ink : '#fff'} fontFamily={FONT} pointerEvents="none">
              {c.label}
            </text>
          )}
        </g>
      ))}
      {extra}
    </svg>
  );
};

/* ───────────── ÁRBOL RADIAL (panel derecho) ───────────── */
interface TreeCfg {
  root: string;
  subset: (deals: DealRow[]) => DealRow[];
  group: (d: DealRow) => string;
  value: (d: DealRow) => number;
  fmt: (v: number, money: Money) => string;
  groupFmt?: string;
}

const TREE: Record<KpiKey, TreeCfg> = {
  weightedPipeline: { root: 'P', subset: (x) => x.filter((d) => d.status === 'Abierta'), group: (d) => d.stage, value: (d) => d.weightedPipeline, fmt: (v, m) => m(v) },
  pipelineCoverage: { root: 'C', subset: (x) => x.filter((d) => d.status === 'Abierta'), group: (d) => d.stage, value: (d) => d.estimatedAmount, fmt: (v, m) => m(v) },
  forecastAccuracy: { root: 'E', subset: (x) => x.filter((d) => d.status === 'Abierta'), group: (d) => d.forecastCategory, value: (d) => d.estimatedAmount, fmt: (v, m) => m(v) },
  activePipelineValue: { root: 'V', subset: (x) => x.filter((d) => d.status === 'Abierta'), group: (d) => d.client, value: (d) => d.estimatedAmount, fmt: (v, m) => m(v) },
  weightedGrossMarginPct: { root: 'M', subset: (x) => x.filter((d) => d.status === 'Abierta'), group: (d) => d.brand, value: (d) => (d.weightedPipeline || d.estimatedAmount * 0.01) * ((d.estimatedMarginPct || 20) / 100), fmt: (v, m) => m(v) },
  quoteToCloseDays: { root: 'D', subset: (x) => x.filter((d) => daysOf(d) !== null), group: (d) => d.businessType, value: (d) => daysOf(d) || 0, fmt: (v) => days2(v) },
  winRate: { root: 'T', subset: (x) => x.filter((d) => d.status !== 'Abierta'), group: (d) => (d.status === 'Closed Won' ? 'Ganadas' : 'Perdidas'), value: (d) => d.estimatedAmount, fmt: (v, m) => m(v) },
  averageDealSize: { root: 'X̄', subset: (x) => x.filter((d) => d.status === 'Closed Won'), group: (d) => d.client, value: (d) => d.estimatedAmount, fmt: (v, m) => m(v) },
};

export const KpiTree: React.FC<GraphProps> = ({ kpiKey, deals, money }) => {
  const [hover, setHover] = useState<string>('');
  const cfg = TREE[kpiKey];

  const { groups, nodes, links } = useMemo(() => {
    const sub = cfg.subset(deals);
    const totals = Array.from(sumBy(sub, cfg.group, (d) => Math.max(cfg.value(d), 0.0001)).entries()).sort((a, b) => b[1] - a[1]);
    const top = totals.slice(0, 6);
    const names = top.map(([n]) => n);
    const hasOthers = totals.length > 6;
    const gl = top.map(([name, total]) => ({
      name,
      total,
      leaves: sub.filter((d) => cfg.group(d) === name).sort((a, b) => cfg.value(b) - cfg.value(a)).slice(0, 9),
      count: sub.filter((d) => cfg.group(d) === name).length,
    }));
    if (hasOthers) {
      const rest = sub.filter((d) => !names.includes(cfg.group(d)));
      gl.push({
        name: 'Otros',
        total: rest.reduce((s, d) => s + cfg.value(d), 0),
        leaves: rest.sort((a, b) => cfg.value(b) - cfg.value(a)).slice(0, 6),
        count: rest.length,
      });
    }
    const maxV = Math.max(1, ...gl.flatMap((g) => g.leaves.map((d) => cfg.value(d))));
    const weights = gl.map((g) => g.leaves.length + 1.5);
    const sum = weights.reduce((a, b) => a + b, 0);
    const cx = 170;
    const cy = 150;
    let ang = -Math.PI / 2;
    const nodes: { id: string; x: number; y: number; r: number; fill: string; op: number; tip: string }[] = [];
    const links: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];
    const groupsOut: { name: string; color: string; total: number; count: number }[] = [];
    gl.forEach((g, gi) => {
      const span = (weights[gi] / sum) * Math.PI * 2;
      const mid = ang + span / 2;
      const color = g.name === 'Otros' ? '#94a3b8' : PALETTE[gi % PALETTE.length];
      const gx = cx + 62 * Math.cos(mid);
      const gy = cy + 62 * Math.sin(mid);
      groupsOut.push({ name: g.name, color, total: g.total, count: g.count });
      links.push({ x1: cx, y1: cy, x2: gx, y2: gy, color });
      nodes.push({
        id: `g-${g.name}`,
        x: gx,
        y: gy,
        r: 9,
        fill: color,
        op: 0.95,
        tip: `${g.name} · ${g.count} negocios · ${cfg.fmt(g.total, money)}`,
      });
      g.leaves.forEach((d, li) => {
        const a = ang + (span * (li + 0.5 + 0.75)) / (g.leaves.length + 1.5);
        const rad = 112 + (li % 2) * 20;
        const lx = cx + rad * Math.cos(a);
        const ly = cy + rad * Math.sin(a);
        links.push({ x1: gx, y1: gy, x2: lx, y2: ly, color });
        nodes.push({
          id: d.id,
          x: lx,
          y: ly,
          r: 2.5 + 7 * Math.sqrt(Math.max(cfg.value(d), 0) / maxV),
          fill: color,
          op: 0.35 + 0.65 * (d.probability / 100 || 0.6),
          tip: `${d.client} · ${d.code} · ${cfg.fmt(cfg.value(d), money)} · prob. ${pct2(d.probability)}`,
        });
      });
      ang += span;
    });
    return { groups: groupsOut, nodes, links };
  }, [kpiKey, deals]);

  return (
    <div>
      <svg viewBox="0 0 340 300" className="w-full" style={{ maxHeight: 300 }} role="img" aria-label="Árbol radial del indicador">
        <defs>
          <linearGradient id="rootGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={C.cyan} />
            <stop offset="1" stopColor={C.primary} />
          </linearGradient>
        </defs>
        {[62, 112, 132].map((r) => (
          <circle key={r} cx={170} cy={150} r={r} fill="none" stroke={C.line} strokeDasharray="2 4" />
        ))}
        {links.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.color} strokeOpacity={0.35} />
        ))}
        {nodes.map((n) => (
          <circle
            key={n.id}
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill={n.fill}
            opacity={n.op}
            stroke="#fff"
            strokeWidth={0.8}
            onMouseEnter={() => setHover(n.tip)}
            onMouseLeave={() => setHover('')}
            style={{ cursor: 'pointer' }}
          >
            <title>{n.tip}</title>
          </circle>
        ))}
        <circle cx={170} cy={150} r={25} fill="url(#rootGrad)" />
        <text x={170} y={157} textAnchor="middle" fontSize="20" fontWeight="700" fill="#fff" fontFamily={FONT}>
          {cfg.root}
        </text>
      </svg>
      <p className="min-h-[18px] text-[11px] text-slate-600 dark:text-slate-300 text-center truncate" style={{ fontFamily: FONT }}>
        {hover || 'Pasa el cursor sobre un círculo: tamaño = valor, opacidad = probabilidad.'}
      </p>
      <div className="mt-1 flex flex-wrap gap-1.5 justify-center">
        {groups.map((g) => (
          <span key={g.name} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
            <span className="w-2 h-2 rounded-full" style={{ background: g.color }} />
            {g.name} · {g.count}
          </span>
        ))}
      </div>
    </div>
  );
};


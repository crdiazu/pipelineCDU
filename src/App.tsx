import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Kanban,
  FileSpreadsheet,
  TrendingUp,
  Sun,
  Moon,
  PlusCircle,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowUpRight,
  Bot,
  Menu,
  X,
  Award,
} from 'lucide-react';
import {
  loadPipeline,
  DealRow,
  CurrencyCode,
  DEFAULT_MONTHLY_QUOTA_CLP,
  DEFAULT_EXCHANGE_RATE,
  formatCurrency,
} from './data/pipeline';
import { calculateKpis, getMonthlySeries, KpiKey } from './utils/kpi';
import KpiCard from './components/KpiCard';
import ForecastChart from './components/ForecastChart';
import SalesTable from './components/SalesTable';
import KanbanBoard from './components/KanbanBoard';
import { ClientLogo, VendorBadge } from './components/ClientLogo';
import CduAgentDrawer from './components/CduAgentDrawer';
import PersistentTimeline from './components/PersistentTimeline';
import ClientTimeAnalysis from './components/ClientTimeAnalysis';
import KpiMathInspector from './components/KpiMathInspector';

const initialDeals = loadPipeline();

export function App() {
  const [deals, setDeals] = useState<DealRow[]>(initialDeals);
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'kanban' | 'cotizaciones' | 'forecast' | 'agent'
  >('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Todos');
  const [activeKpi, setActiveKpi] = useState<KpiKey>('weightedPipeline');
  const [kpiBlockFilter, setKpiBlockFilter] = useState<
    'Todos' | 'Forecast' | 'Cotizaciones' | 'Conversión'
  >('Todos');
  const [currency, setCurrency] = useState<CurrencyCode>('CLP');
  const [exchangeRate] = useState<number>(DEFAULT_EXCHANGE_RATE);
  const [quotaClp, setQuotaClp] = useState<number>(DEFAULT_MONTHLY_QUOTA_CLP);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [selectedDeal, setSelectedDeal] = useState<DealRow | null>(
    initialDeals[0] || null
  );
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // New Opportunity Modal Form State
  const [newClient, setNewClient] = useState('');
  const [newOpp, setNewOpp] = useState('');
  const [newBrand, setNewBrand] = useState('Lenovo');
  const [newAmount, setNewAmount] = useState('3500000');
  const [newProb, setNewProb] = useState('60');
  const [newCategory, setNewCategory] = useState<'Commit' | 'Best Case' | 'Pipeline'>('Best Case');

  const [selectedClient, setSelectedClient] = useState<string>('Todos');

  // Client aggregation for filter dropdown and analysis
  const clientStatsList = useMemo(() => {
    const map = new Map<string, { client: string; count: number; won: number; open: number }>();
    deals.forEach((d) => {
      const existing = map.get(d.client) || { client: d.client, count: 0, won: 0, open: 0 };
      existing.count += 1;
      if (d.status === 'Closed Won') existing.won += d.estimatedAmount;
      if (d.status === 'Abierta') existing.open += d.estimatedAmount;
      map.set(d.client, existing);
    });
    return Array.from(map.values()).sort((a, b) => (b.won + b.open) - (a.won + a.open));
  }, [deals]);

  const clientFilteredDeals = useMemo(() => {
    if (selectedClient === 'Todos') return deals;
    return deals.filter((d) => d.client === selectedClient);
  }, [deals, selectedClient]);

  const monthlySeries = useMemo(
    () => getMonthlySeries(clientFilteredDeals, quotaClp),
    [clientFilteredDeals, quotaClp]
  );

  // Timeline Range State (Desde / Hasta indices over monthlySeries, default covering all 24 months)
  const [rangeStartIdx, setRangeStartIdx] = useState<number>(0);
  const [rangeEndIdx, setRangeEndIdx] = useState<number>(23);

  const safeStartIdx = Math.max(
    0,
    Math.min(rangeStartIdx, Math.max(0, monthlySeries.length - 1))
  );
  const safeEndIdx = Math.max(
    safeStartIdx,
    Math.min(rangeEndIdx, Math.max(0, monthlySeries.length - 1))
  );

  const rangeSortStart = monthlySeries[safeStartIdx]?.sortKey;
  const rangeSortEnd = monthlySeries[safeEndIdx]?.sortKey;

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const availablePeriods = useMemo(() => {
    const map = new Map<string, string>();
    deals.forEach((d) => {
      if (d.closeMonth) {
        map.set(d.closeMonth, d.closeMonthSort);
      }
    });
    const sorted = Array.from(map.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map((e) => e[0]);
    return ['Todos', ...sorted];
  }, [deals]);

  const kpis = useMemo(
    () =>
      calculateKpis(
        clientFilteredDeals,
        selectedPeriod,
        quotaClp,
        rangeSortStart,
        rangeSortEnd
      ),
    [clientFilteredDeals, selectedPeriod, quotaClp, rangeSortStart, rangeSortEnd]
  );

  const periodFilteredDeals = useMemo(() => {
    if (selectedPeriod !== 'Todos') {
      return clientFilteredDeals.filter((d) => d.closeMonth === selectedPeriod);
    }
    return clientFilteredDeals.filter((d) => {
      const k = d.closeMonthSort || '9999-99';
      if (rangeSortStart && k < rangeSortStart) return false;
      if (rangeSortEnd && k > rangeSortEnd) return false;
      return true;
    });
  }, [clientFilteredDeals, selectedPeriod, rangeSortStart, rangeSortEnd]);

  // Top 5 deals dynamically ranked according to the active KPI card
  const top5Deals = useMemo(() => {
    let list = [...periodFilteredDeals];
    switch (activeKpi) {
      case 'weightedPipeline':
        list.sort((a, b) => b.weightedPipeline - a.weightedPipeline);
        break;
      case 'pipelineCoverage':
      case 'activePipelineValue':
        list = list.filter((d) => d.status === 'Abierta');
        list.sort((a, b) => b.estimatedAmount - a.estimatedAmount);
        break;
      case 'forecastAccuracy':
        list.sort(
          (a, b) =>
            b.probability - a.probability || b.estimatedAmount - a.estimatedAmount
        );
        break;
      case 'weightedGrossMarginPct':
        list.sort(
          (a, b) => (b.estimatedMarginPct || 0) - (a.estimatedMarginPct || 0)
        );
        break;
      case 'winRatePct':
      case 'averageDealSizeWon':
        list.sort((a, b) => {
          if (a.status === 'Closed Won' && b.status !== 'Closed Won') return -1;
          if (b.status === 'Closed Won' && a.status !== 'Closed Won') return 1;
          return b.estimatedAmount - a.estimatedAmount;
        });
        break;
      case 'averageSalesCycleDays':
        list.sort((a, b) => b.estimatedAmount - a.estimatedAmount);
        break;
      default:
        list.sort((a, b) => b.weightedPipeline - a.weightedPipeline);
        break;
    }
    return list.slice(0, 5);
  }, [periodFilteredDeals, activeKpi]);

  const fmt = (val: number, compact = false) =>
    formatCurrency(val, currency, exchangeRate, compact);

  // Stage Breakdown for Concentric / Editorial Bar
  const stageBreakdown = useMemo(() => {
    const open = periodFilteredDeals.filter((d) => d.status === 'Abierta');
    const groups = [
      { label: 'Aprobación / OC (Commit)', stages: ['Aprobación / OC'], color: '#C6F432' },
      { label: 'Propuesta / Negociación', stages: ['Propuesta', 'Negociación'], color: '#00B4D8' },
      { label: 'Cotización Formal', stages: ['Cotización'], color: '#38BDF8' },
      { label: 'Calificación / Levantamiento', stages: ['Calificación', 'Levantamiento', 'Prospección'], color: '#64748B' },
    ];
    const total = open.reduce((s, d) => s + d.estimatedAmount, 0) || 1;
    return groups.map((g) => {
      const items = open.filter((d) => g.stages.includes(d.stage));
      const amount = items.reduce((s, d) => s + d.estimatedAmount, 0);
      const weighted = items.reduce((s, d) => s + d.weightedPipeline, 0);
      return {
        ...g,
        count: items.length,
        amount,
        weighted,
        pct: Math.round((amount / total) * 100),
      };
    });
  }, [periodFilteredDeals]);

  // Client Grouping for Editorial Forecast View
  const clientGroups = useMemo(() => {
    const open = periodFilteredDeals.filter((d) => d.status === 'Abierta');
    const map = new Map<
      string,
      { client: string; total: number; weighted: number; count: number; brands: Set<string>; topForecast: string }
    >();
    open.forEach((d) => {
      const cur = map.get(d.client) || {
        client: d.client,
        total: 0,
        weighted: 0,
        count: 0,
        brands: new Set<string>(),
        topForecast: d.forecastCategory,
      };
      cur.total += d.estimatedAmount;
      cur.weighted += d.weightedPipeline;
      cur.count += 1;
      cur.brands.add(d.brand);
      if (d.forecastCategory === 'Commit') cur.topForecast = 'Commit';
      else if (d.forecastCategory === 'Best Case' && cur.topForecast !== 'Commit')
        cur.topForecast = 'Best Case';
      map.set(d.client, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [periodFilteredDeals]);

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.trim() || !newOpp.trim()) return;
    const amt = Number(newAmount) || 0;
    const prb = Number(newProb) || 50;
    const newRow: DealRow = {
      id: `deal-custom-${Date.now()}`,
      code: `COT-${1325 + deals.length}`,
      client: newClient.trim(),
      opportunity: newOpp.trim(),
      brand: newBrand.trim() || 'TECNOVOA',
      businessType: 'Producto',
      estimatedAmount: amt,
      stage: prb >= 90 ? 'Aprobación / OC' : prb >= 60 ? 'Propuesta' : 'Cotización',
      probability: prb,
      pipelineEntryDate: '2026-11-05',
      pipelineEntryMonth: 'Noviembre 2026',
      pipelineEntrySort: '2026-11',
      estimatedCloseDate: '2026-11-22',
      closeMonth: selectedPeriod === 'Todos' ? 'Noviembre 2026' : selectedPeriod,
      closeMonthSort: '2026-11',
      weightedPipeline: Math.round((amt * prb) / 100),
      forecastCategory: newCategory,
      status: 'Abierta',
      nextAction: 'Seguimiento comercial de propuesta recién emitida',
      nextActionDate: '2026-11-12',
      notes: 'Oportunidad ingresada desde Dashboard Comercial TECNOVOA.',
      estimatedMarginPct: 22.0,
    };
    setDeals([newRow, ...deals]);
    setSelectedDeal(newRow);
    setShowNewModal(false);
    setNewClient('');
    setNewOpp('');
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Vista General',
      shortLabel: 'Inicio',
      icon: LayoutDashboard,
      badge: '8 KPIs',
    },
    {
      id: 'kanban',
      label: 'Pipeline Kanban',
      shortLabel: 'Kanban',
      icon: Kanban,
      badge: `${kpis.openDealsCount}`,
    },
    {
      id: 'cotizaciones',
      label: 'Matriz Cotizaciones',
      shortLabel: 'Cotiz.',
      icon: FileSpreadsheet,
      badge: `${periodFilteredDeals.length}`,
    },
    {
      id: 'forecast',
      label: 'Forecast & Cuentas',
      shortLabel: 'Cuentas',
      icon: TrendingUp,
      badge: 'Editorial',
    },
    {
      id: 'agent',
      label: 'Agente IA Comercial',
      shortLabel: 'Agente IA',
      icon: Bot,
      badge: 'AI SDK',
    },
  ] as const;

  const activePeriodLabel =
    selectedPeriod === 'Todos'
      ? `${monthlySeries[safeStartIdx]?.month || 'Ago 2026'} → ${
          monthlySeries[safeEndIdx]?.month || 'Mar 2027'
        }`
      : selectedPeriod;

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen flex flex-col lg:flex-row bg-[#F5F1E8] text-[#101725] dark:bg-[#0B132B] dark:text-slate-100 font-sans transition-colors duration-200 pb-16 lg:pb-0">
        {/* Left Navigation Sidebar (Desktop lg+) */}
        <aside className="w-64 shrink-0 border-r border-[#DDD4C5] dark:border-slate-800/80 bg-[#FFFDF8] dark:bg-[#070C1C] flex-col justify-between p-4 hidden lg:flex sticky top-0 h-screen overflow-y-auto">
          <div>
            {/* Brand Header */}
            <div className="pb-4 mb-5 border-b border-[#DDD4C5] dark:border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00B4D8] animate-pulse" />
                  <span className="font-mono text-xs uppercase tracking-widest text-[#2A5FFF] dark:text-[#00B4D8] font-bold">
                    TECNOVOA B2B
                  </span>
                </div>
                <h1 className="font-serif text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
                  Forecast CDU
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  KAM: Cristian Díaz U.
                </p>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                      active
                        ? 'bg-[#2A5FFF] text-white dark:bg-[#00B4D8]/15 dark:text-[#00B4D8] border border-transparent dark:border-[#00B4D8]/30 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-[#101D38]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        active
                          ? 'bg-white/20 text-white dark:bg-[#00B4D8]/20 dark:text-[#00B4D8]'
                          : 'bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Top 5 Negocios según el filtro del KPI activo */}
            <div className="mt-5 p-3 rounded-xl border border-[#DDD4C5] dark:border-slate-800 bg-[#F5F1E8]/70 dark:bg-[#101D38]/70">
              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-300 dark:border-slate-800">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Award className="w-4 h-4 text-[#2A5FFF] dark:text-[#00B4D8] shrink-0" />
                  <span className="text-xs font-mono uppercase font-bold text-slate-800 dark:text-white truncate">
                    Top 5 · {activeKpi}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-[#C6F432] font-bold shrink-0">
                  {top5Deals.length} deals
                </span>
              </div>

              <div className="space-y-1.5">
                {top5Deals.map((d, idx) => {
                  const isSelected = selectedDeal?.id === d.id;
                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDeal(d)}
                      className={`p-2 rounded-lg border transition cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'border-[#2A5FFF] bg-[#2A5FFF]/15 dark:border-[#00B4D8] dark:bg-[#00B4D8]/20 shadow-sm'
                          : 'border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#070C1C]/80 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-mono font-black text-slate-400 w-4">
                          #{idx + 1}
                        </span>
                        <ClientLogo client={d.client} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {d.client}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {d.code} · {d.brand}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-slate-900 dark:text-white block">
                          {fmt(d.estimatedAmount, true)}
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-[#C6F432]">
                          {d.probability}% prob
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedDeal && (
                <div className="mt-2.5 pt-2 border-t border-slate-300 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                  <span className="text-[10px] text-slate-400 uppercase block">Seleccionado:</span>
                  <span className="font-bold text-slate-900 dark:text-white truncate block">
                    {selectedDeal.client} · {selectedDeal.opportunity}
                  </span>
                  <div className="flex justify-between mt-1 text-[10px]">
                    <span>Neto: {fmt(selectedDeal.estimatedAmount, false)}</span>
                    <span className="text-[#00B4D8] font-bold">W: {fmt(selectedDeal.weightedPipeline, false)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Quota Config */}
          <div className="pt-4 border-t border-[#DDD4C5] dark:border-slate-800/80 text-xs">
            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
              Meta Mensual CDU (CLP)
            </label>
            <input
              type="number"
              step={500000}
              value={quotaClp}
              onChange={(e) => setQuotaClp(Number(e.target.value) || 15000000)}
              className="w-full px-2.5 py-1.5 rounded-lg font-mono text-xs bg-white dark:bg-[#101D38] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <p className="text-[11px] text-slate-400 mt-2">
              Planilla: CDU Pipeline Forecast REPARADO ({deals.length} filas)
            </p>
          </div>
        </aside>

        {/* Mobile Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[82vw] bg-[#FFFDF8] dark:bg-[#070C1C] h-full p-4 flex flex-col justify-between z-10 border-r border-slate-800 overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#2A5FFF] dark:text-[#00B4D8] font-bold">
                      TECNOVOA B2B
                    </span>
                    <h2 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                      Forecast CDU
                    </h2>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                          active
                            ? 'bg-[#2A5FFF] text-white dark:bg-[#00B4D8]/20 dark:text-[#00B4D8]'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800">
                          {item.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  Meta Mensual CDU (CLP)
                </label>
                <input
                  type="number"
                  step={500000}
                  value={quotaClp}
                  onChange={(e) => setQuotaClp(Number(e.target.value) || 15000000)}
                  className="w-full px-2.5 py-1.5 rounded-lg font-mono text-xs bg-white dark:bg-[#101D38] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Responsive Editorial Header */}
          <header className="sticky top-0 z-20 backdrop-blur-md bg-[#FFFDF8]/90 dark:bg-[#0B132B]/90 border-b border-[#DDD4C5] dark:border-slate-800/80 px-3.5 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101D38] text-slate-700 dark:text-slate-200"
                aria-label="Abrir menú"
              >
                <Menu className="w-4 h-4" />
              </button>

              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 block truncate">
                  TECNOVOA · UNIDAD COMERCIAL B2B
                </span>
                <h2 className="text-base sm:text-xl font-serif font-bold text-slate-900 dark:text-white truncate">
                  Dashboard de Ventas & Forecast CDU
                </h2>
              </div>
            </div>

            {/* Right Controls: Period Filter, Currency Switch, Theme Toggle, Quick CTA */}
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              {/* Period Filter Pill */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#101D38] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <Calendar className="w-3.5 h-3.5 text-[#2A5FFF] dark:text-[#00B4D8] shrink-0" />
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer max-w-[140px] sm:max-w-none truncate"
                >
                  {availablePeriods.map((p) => (
                    <option
                      key={p}
                      value={p}
                      className="bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white"
                    >
                      {p === 'Todos' ? 'Rango Línea de Tiempo' : p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Currency Switch */}
              <div className="flex items-center bg-slate-100 dark:bg-[#101D38] p-0.5 sm:p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setCurrency('CLP')}
                  className={`px-2 py-1 rounded-lg font-semibold transition ${
                    currency === 'CLP'
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-[#00B4D8] dark:text-[#0B132B]'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  CLP
                </button>
                <button
                  onClick={() => setCurrency('USD')}
                  className={`px-2 py-1 rounded-lg font-semibold transition ${
                    currency === 'USD'
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-[#00B4D8] dark:text-[#0B132B]'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  USD
                </button>
              </div>

              {/* Dark/Light Switch */}
              <button
                onClick={toggleTheme}
                title="Alternar Modo Editorial Claro / Oscuro TECNOVOA"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101D38] text-slate-700 dark:text-slate-200 hover:border-[#00B4D8] transition"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Primary CTA */}
              <button
                onClick={() => setShowNewModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#2A5FFF] text-white dark:bg-[#00B4D8] dark:text-[#0B132B] hover:opacity-95 transition shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Nueva Cotización</span>
              </button>
            </div>
          </header>

          {/* Línea de Tiempo Siempre Presente across all tabs */}
          <PersistentTimeline
            monthlySeries={monthlySeries}
            rangeStartIdx={safeStartIdx}
            rangeEndIdx={safeEndIdx}
            onRangeChange={(s, e) => {
              setRangeStartIdx(s);
              setRangeEndIdx(e);
            }}
            selectedPeriod={selectedPeriod}
            onSelectPeriod={(p) => setSelectedPeriod(p)}
            selectedClient={selectedClient}
            onSelectClient={(c) => setSelectedClient(c)}
            clientList={clientStatsList}
            currency={currency}
            exchangeRate={exchangeRate}
            totalDeals={clientFilteredDeals.length}
          />

          {/* Main Workspace Body */}
          <main className="p-3.5 sm:p-6 space-y-5 sm:space-y-6 max-w-[1600px] w-full mx-auto">
            {activeTab === 'dashboard' && (
              <>
                {/* Top Zone: Left Dynamic KPI Analytical Chart (2/3) + Right Quota & Balance Card (1/3) */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                  <div className="xl:col-span-2">
                    <ForecastChart
                      monthlyData={monthlySeries}
                      currency={currency}
                      exchangeRate={exchangeRate}
                      quotaClp={quotaClp}
                      activeKpi={activeKpi}
                      rangeStartIdx={safeStartIdx}
                      rangeEndIdx={safeEndIdx}
                      onRangeChange={(s, e) => {
                        setRangeStartIdx(s);
                        setRangeEndIdx(e);
                        setSelectedPeriod('Todos');
                      }}
                    />
                  </div>

                  {/* Right Dynamic KPI Math Inspector Card (Cambia al hacer clic en cualquier KPI) */}
                  <div className="xl:col-span-1">
                    <KpiMathInspector
                      activeKpi={activeKpi}
                      kpis={kpis}
                      quotaClp={quotaClp}
                      currency={currency}
                      exchangeRate={exchangeRate}
                      activePeriodLabel={activePeriodLabel}
                    />
                  </div>
                </div>

                {/* Section 2: The 8 Strategic Interactive KPIs */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
                        Matriz Interactiva de 8 KPIs Estratégicos (Toca un KPI para graficarlo arriba)
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Métricas calculadas en vivo sobre la ventana activa ({activePeriodLabel})
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-white dark:bg-[#101D38] p-1 rounded-xl border border-[#DDD4C5] dark:border-slate-800 text-xs overflow-x-auto max-w-full">
                      {(['Todos', 'Forecast', 'Cotizaciones', 'Conversión'] as const).map(
                        (b) => (
                          <button
                            key={b}
                            onClick={() => setKpiBlockFilter(b)}
                            className={`px-3 py-1 rounded-lg font-medium transition whitespace-nowrap ${
                              kpiBlockFilter === b
                                ? 'bg-[#2A5FFF] text-white dark:bg-[#00B4D8] dark:text-[#0B132B]'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {b}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <KpiCard
                    kpis={kpis}
                    currency={currency}
                    exchangeRate={exchangeRate}
                    selectedBlock={kpiBlockFilter}
                    activeKpi={activeKpi}
                    onSelectKpi={(key) => setActiveKpi(key)}
                  />
                </div>

                {/* Section 3: Interactive Responsive Data Table */}
                <SalesTable
                  data={periodFilteredDeals}
                  currency={currency}
                  exchangeRate={exchangeRate}
                  onSelectDeal={(d) => setSelectedDeal(d)}
                  selectedDealId={selectedDeal?.id}
                />

                {/* Section 4: Bottom Three Operational Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Card 1: Pipeline Distribution by Stage */}
                  <div className="rounded-xl p-5 border bg-white/95 border-[#DDD4C5] dark:bg-[#101D38]/90 dark:border-slate-800/80 shadow-sm">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#2A5FFF] dark:text-[#00B4D8] font-semibold">
                      Embudo Comercial
                    </span>
                    <h4 className="text-base font-serif font-bold text-slate-900 dark:text-white mt-0.5 mb-3">
                      Distribución por Etapa ({activePeriodLabel})
                    </h4>

                    <div className="space-y-3">
                      {stageBreakdown.map((st) => (
                        <div key={st.label}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-medium text-slate-700 dark:text-slate-200">
                              {st.label}{' '}
                              <span className="text-slate-400 font-mono">({st.count})</span>
                            </span>
                            <span className="font-mono font-semibold text-slate-900 dark:text-white">
                              {fmt(st.amount, true)}{' '}
                              <span className="text-[10px] text-slate-400">({st.pct}%)</span>
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#0B132B] overflow-hidden">
                            <div
                              style={{
                                width: `${Math.max(4, st.pct)}%`,
                                backgroundColor: st.color,
                              }}
                              className="h-full rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card 2: Recent Activity & Next Actions Log */}
                  <div className="rounded-xl p-5 border bg-white/95 border-[#DDD4C5] dark:bg-[#101D38]/90 dark:border-slate-800/80 shadow-sm">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#2A5FFF] dark:text-[#00B4D8] font-semibold">
                      Bitácora Operativa
                    </span>
                    <h4 className="text-base font-serif font-bold text-slate-900 dark:text-white mt-0.5 mb-3">
                      Próximas Acciones & Cierres Recientes
                    </h4>

                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {periodFilteredDeals.slice(0, 6).map((d) => (
                        <div
                          key={d.id}
                          onClick={() => setSelectedDeal(d)}
                          className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B132B] border border-slate-200/60 dark:border-slate-800/80 flex items-start justify-between gap-2 cursor-pointer hover:border-[#00B4D8]"
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <ClientLogo client={d.client} size="sm" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                {d.status === 'Closed Won' ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                ) : (
                                  <Clock className="w-3 h-3 text-[#00B4D8] shrink-0" />
                                )}
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {d.client} · {d.code}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                                {d.nextAction || d.opportunity}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-semibold text-slate-900 dark:text-[#C6F432] shrink-0">
                            {fmt(d.estimatedAmount, true)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card 3: Metas y Proyecciones (Executive Focus) */}
                  <div className="rounded-xl p-5 border bg-white/95 border-[#DDD4C5] dark:bg-[#101D38]/90 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 dark:text-[#C6F432] font-semibold">
                        Control de Ingresos
                      </span>
                      <h4 className="text-base font-serif font-bold text-slate-900 dark:text-white mt-0.5 mb-2">
                        Metas y Proyecciones Gerenciales
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Con una cuota mensual de{' '}
                        <strong className="font-mono">{fmt(quotaClp, false)}</strong>, el
                        pipeline ponderado actual aporta{' '}
                        <strong className="font-mono text-emerald-600 dark:text-[#C6F432]">
                          {fmt(kpis.weightedPipeline, false)}
                        </strong>{' '}
                        adicionales a lo ya facturado ({fmt(kpis.closedWonAmount, false)}).
                      </p>

                      <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Cierre Seguro (Won + Commit):</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {fmt(kpis.closedWonAmount + kpis.commitAmount, false)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Escenario Best Case:</span>
                          <span className="font-mono font-bold text-[#2A5FFF] dark:text-[#00B4D8]">
                            {fmt(
                              kpis.closedWonAmount + kpis.commitAmount + kpis.bestCaseAmount,
                              false
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Cobertura sobre cuota restante:</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-[#C6F432]">
                            {kpis.pipelineCoverage.toFixed(2)}× (Óptimo ≥3.0×)
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('agent')}
                      className="mt-4 w-full py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white dark:bg-[#00B4D8]/20 dark:text-[#00B4D8] border border-transparent dark:border-[#00B4D8]/40 hover:opacity-90 transition"
                    >
                      Auditar con Agente IA Comercial →
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'kanban' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-white">
                      Tablero Kanban de Oportunidades Abiertas ({activePeriodLabel})
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Organizado por etapa del embudo comercial TECNOVOA con logos de clientes y partners
                    </p>
                  </div>
                </div>
                <KanbanBoard
                  data={periodFilteredDeals}
                  currency={currency}
                  exchangeRate={exchangeRate}
                  onSelectDeal={(d) => setSelectedDeal(d)}
                />
              </div>
            )}

            {activeTab === 'cotizaciones' && (
              <SalesTable
                data={periodFilteredDeals}
                currency={currency}
                exchangeRate={exchangeRate}
                onSelectDeal={(d) => setSelectedDeal(d)}
                selectedDealId={selectedDeal?.id}
              />
            )}

            {activeTab === 'forecast' && (
              <div className="space-y-6">
                <ForecastChart
                  monthlyData={monthlySeries}
                  currency={currency}
                  exchangeRate={exchangeRate}
                  quotaClp={quotaClp}
                  activeKpi={activeKpi}
                  rangeStartIdx={safeStartIdx}
                  rangeEndIdx={safeEndIdx}
                  onRangeChange={(s, e) => {
                    setRangeStartIdx(s);
                    setRangeEndIdx(e);
                    setSelectedPeriod('Todos');
                  }}
                />

                {/* Comprehensive Client Time Analysis (Matriz Temporal de Clientes 2026-2027) */}
                <ClientTimeAnalysis
                  deals={deals}
                  selectedClient={selectedClient}
                  onSelectClient={(c) => setSelectedClient(c)}
                  currency={currency}
                  exchangeRate={exchangeRate}
                />
              </div>
            )}

            {activeTab === 'agent' && (
              <CduAgentDrawer
                selectedPeriod={selectedPeriod}
                currency={currency}
                quotaClp={quotaClp}
                exchangeRate={exchangeRate}
              />
            )}
          </main>
        </div>

        {/* Fixed Mobile Bottom Navigation Bar (< lg) */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#FFFDF8]/95 dark:bg-[#070C1C]/95 backdrop-blur-md border-t border-[#DDD4C5] dark:border-slate-800 grid grid-cols-5 px-1 py-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium transition ${
                  active
                    ? 'text-[#2A5FFF] dark:text-[#00B4D8] font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span className="truncate max-w-[64px]">{item.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Modal for New Quote / Opportunity */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-[#DDD4C5] dark:border-slate-700 bg-[#FFFDF8] dark:bg-[#101D38] p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
                  Registrar Nueva Cotización / Oportunidad
                </h3>
                <button
                  onClick={() => setShowNewModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateDeal} className="space-y-3.5 mt-4 text-xs">
                <div>
                  <label className="block text-slate-500 dark:text-slate-300 mb-1">
                    Cliente / Cuenta Corporativa
                  </label>
                  <input
                    type="text"
                    required
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    placeholder="Ej. Positron Pharma, EDIFICIO SNAP, Puerto de Arica..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-300 mb-1">
                    Oportunidad / Solución Cotizada
                  </label>
                  <input
                    type="text"
                    required
                    value={newOpp}
                    onChange={(e) => setNewOpp(e.target.value)}
                    placeholder="Ej. Renovación Firewalls Fortinet (COT 1326)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-300 mb-1">
                      Marca / Fabricante
                    </label>
                    <input
                      type="text"
                      value={newBrand}
                      onChange={(e) => setNewBrand(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-300 mb-1">
                      Categoría Forecast
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white"
                    >
                      <option value="Commit">Commit</option>
                      <option value="Best Case">Best Case</option>
                      <option value="Pipeline">Pipeline</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-300 mb-1">
                      Monto Estimado Neto (CLP)
                    </label>
                    <input
                      type="number"
                      required
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-slate-300 mb-1">
                      Probabilidad (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={newProb}
                      onChange={(e) => setNewProb(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg font-semibold bg-[#2A5FFF] text-white dark:bg-[#00B4D8] dark:text-[#0B132B]"
                  >
                    Guardar en Pipeline
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

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
  ShieldAlert,
  Building2,
  Calendar,
  ArrowUpRight,
  X,
} from 'lucide-react';
import {
  loadPipeline,
  DealRow,
  CurrencyCode,
  DEFAULT_MONTHLY_QUOTA_CLP,
  DEFAULT_EXCHANGE_RATE,
  formatCurrency,
} from './data/pipeline';
import { calculateKpis, getMonthlySeries } from './utils/kpi';
import KpiCard from './components/KpiCard';
import ForecastChart from './components/ForecastChart';
import SalesTable from './components/SalesTable';
import KanbanBoard from './components/KanbanBoard';

const initialDeals = loadPipeline();

export function App() {
  const [deals, setDeals] = useState<DealRow[]>(initialDeals);
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'kanban' | 'cotizaciones' | 'forecast'
  >('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Noviembre 2026');
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

  // New Opportunity Modal Form State
  const [newClient, setNewClient] = useState('');
  const [newOpp, setNewOpp] = useState('');
  const [newBrand, setNewBrand] = useState('Lenovo');
  const [newAmount, setNewAmount] = useState('3500000');
  const [newProb, setNewProb] = useState('60');
  const [newCategory, setNewCategory] = useState<'Commit' | 'Best Case' | 'Pipeline'>('Best Case');

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
    () => calculateKpis(deals, selectedPeriod, quotaClp),
    [deals, selectedPeriod, quotaClp]
  );

  const monthlySeries = useMemo(
    () => getMonthlySeries(deals, quotaClp),
    [deals, quotaClp]
  );

  const periodFilteredDeals = useMemo(() => {
    if (selectedPeriod === 'Todos') return deals;
    return deals.filter((d) => d.closeMonth === selectedPeriod);
  }, [deals, selectedPeriod]);

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

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen flex bg-[#F5F1E8] text-[#101725] dark:bg-[#0B132B] dark:text-slate-100 font-sans transition-colors duration-200">
        {/* Left Navigation Sidebar */}
        <aside className="w-64 shrink-0 border-r border-[#DDD4C5] dark:border-slate-800/80 bg-[#FFFDF8] dark:bg-[#070C1C] flex flex-col justify-between p-4 hidden lg:flex">
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
              {[
                {
                  id: 'dashboard',
                  label: 'Vista General & KPIs',
                  icon: LayoutDashboard,
                  badge: '8 KPIs',
                },
                {
                  id: 'kanban',
                  label: 'Pipeline Kanban',
                  icon: Kanban,
                  badge: `${kpis.openDealsCount}`,
                },
                {
                  id: 'cotizaciones',
                  label: 'Matriz Cotizaciones',
                  icon: FileSpreadsheet,
                  badge: `${deals.length}`,
                },
                {
                  id: 'forecast',
                  label: 'Forecast & Cuentas Clave',
                  icon: TrendingUp,
                  badge: 'Editorial',
                },
              ].map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
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

            {/* Selected Deal Quick Inspector in Sidebar */}
            {selectedDeal && (
              <div className="mt-6 p-3.5 rounded-xl border border-[#DDD4C5] dark:border-slate-800 bg-[#F5F1E8]/60 dark:bg-[#101D38]/70">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#2A5FFF] dark:text-[#00B4D8] font-bold">
                    Ficha Activa · {selectedDeal.code}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-[#C6F432]">
                    {selectedDeal.probability}%
                  </span>
                </div>
                <p className="text-xs font-serif font-bold text-slate-900 dark:text-white">
                  {selectedDeal.client}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                  {selectedDeal.opportunity}
                </p>
                <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Neto:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {fmt(selectedDeal.estimatedAmount, false)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono mt-1">
                  <span className="text-slate-500">Weighted:</span>
                  <span className="font-bold text-emerald-700 dark:text-[#C6F432]">
                    {fmt(selectedDeal.weightedPipeline, false)}
                  </span>
                </div>
                {selectedDeal.nextAction && (
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      Próxima Acción ({selectedDeal.nextActionDate || 'Pendiente'}):
                    </span>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">
                      {selectedDeal.nextAction}
                    </p>
                  </div>
                )}
              </div>
            )}
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

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Editorial Bar */}
          <header className="sticky top-0 z-20 backdrop-blur-md bg-[#FFFDF8]/90 dark:bg-[#0B132B]/90 border-b border-[#DDD4C5] dark:border-slate-800/80 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 block">
                  TECNOVOA · UNIDAD COMERCIAL B2B
                </span>
                <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-white">
                  Dashboard de Ventas & Cobertura de Forecast
                </h2>
              </div>

              {/* Period Filter Pill */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#101D38] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <Calendar className="w-3.5 h-3.5 text-[#2A5FFF] dark:text-[#00B4D8]" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Período:</span>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  {availablePeriods.map((p) => (
                    <option
                      key={p}
                      value={p}
                      className="bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white"
                    >
                      {p === 'Todos' ? 'Todos los períodos (Ago 26 - Mar 27)' : p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Global Controls: Currency Switch, Theme Toggle, Quick CTA */}
            <div className="flex items-center gap-2.5">
              {/* Mobile Nav Switcher */}
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as any)}
                className="lg:hidden px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#101D38]"
              >
                <option value="dashboard">Vista General</option>
                <option value="kanban">Kanban</option>
                <option value="cotizaciones">Cotizaciones</option>
                <option value="forecast">Forecast</option>
              </select>

              {/* Currency Switch */}
              <div className="flex items-center bg-slate-100 dark:bg-[#101D38] p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setCurrency('CLP')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    currency === 'CLP'
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-[#00B4D8] dark:text-[#0B132B]'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  CLP $
                </button>
                <button
                  onClick={() => setCurrency('USD')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
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
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#2A5FFF] text-white dark:bg-[#00B4D8] dark:text-[#0B132B] hover:opacity-95 transition shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nueva Cotización</span>
              </button>
            </div>
          </header>

          {/* Main Workspace Body */}
          <main className="p-6 space-y-6 max-w-[1600px] w-full mx-auto">
            {activeTab === 'dashboard' && (
              <>
                {/* Top Zone: Left Analytical Chart (2/3) + Right Quota & Balance Card (1/3) */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                  <div className="xl:col-span-2">
                    <ForecastChart
                      monthlyData={monthlySeries}
                      currency={currency}
                      exchangeRate={exchangeRate}
                      quotaClp={quotaClp}
                    />
                  </div>

                  {/* Right Quota & Quick Win Balance Module */}
                  <div className="rounded-xl p-5 border bg-white/95 border-[#DDD4C5] dark:bg-[#101D38]/90 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-[#C6F432] font-semibold">
                          Salud de Cuota · {selectedPeriod}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          Meta: {fmt(quotaClp, false)}
                        </span>
                      </div>

                      <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white mt-2">
                        Proyección Comercial (Facturado + Weighted)
                      </h3>

                      <div className="mt-2 flex items-baseline gap-3">
                        <span className="text-3xl font-serif font-bold text-slate-900 dark:text-white">
                          {fmt(kpis.projectedTotalAmount, false)}
                        </span>
                        <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-[#C6F432]">
                          {kpis.projectedAttainmentPct.toFixed(1)}% de la meta
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-[#0B132B] overflow-hidden flex">
                          <div
                            style={{
                              width: `${Math.min(100, kpis.quotaAttainmentPct)}%`,
                            }}
                            className="bg-emerald-500 h-full"
                            title="Facturado (Closed Won)"
                          />
                          <div
                            style={{
                              width: `${Math.min(
                                100 - Math.min(100, kpis.quotaAttainmentPct),
                                (kpis.commitAmount / quotaClp) * 100
                              )}%`,
                            }}
                            className="bg-[#00B4D8] h-full"
                            title="Commit Abierto"
                          />
                          <div
                            style={{
                              width: `${Math.min(
                                100,
                                (kpis.weightedPipeline / quotaClp) * 100
                              )}%`,
                            }}
                            className="bg-[#C6F432]/80 h-full"
                            title="Weighted Pipeline"
                          />
                        </div>
                        <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1.5">
                          <span>Facturado: {fmt(kpis.closedWonAmount, true)}</span>
                          <span>Commit: {fmt(kpis.commitAmount, true)}</span>
                          <span>Best Case: {fmt(kpis.bestCaseAmount, true)}</span>
                        </div>
                      </div>

                      {/* Breakdown Grid */}
                      <div className="mt-4 grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B132B]">
                          <span className="text-[10px] font-mono uppercase text-slate-400 block">
                            Facturado (Closed Won)
                          </span>
                          <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {fmt(kpis.closedWonAmount, false)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {kpis.wonDealsCount} facturas emitidas
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B132B]">
                          <span className="text-[10px] font-mono uppercase text-slate-400 block">
                            Faltante Meta (Gap)
                          </span>
                          <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                            {fmt(kpis.remainingQuota, false)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Cubierto {kpis.pipelineCoverage.toFixed(1)}× por pipeline
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B132B]">
                          <span className="text-[10px] font-mono uppercase text-slate-400 block">
                            Forecast (Commit+Best)
                          </span>
                          <span className="text-sm font-mono font-bold text-[#2A5FFF] dark:text-[#00B4D8]">
                            {fmt(kpis.forecastTotal, false)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {((kpis.forecastTotal / quotaClp) * 100).toFixed(0)}% sobre meta
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B132B]">
                          <span className="text-[10px] font-mono uppercase text-slate-400 block">
                            Leads / Ops Gestionadas
                          </span>
                          <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                            {kpis.totalDealsCount} Deals
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-[#C6F432] block">
                            {kpis.qualifiedRatioPct.toFixed(0)}% Calificados (≥40%)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Prioridad: cerrar Commit + Best Case vigentes
                      </span>
                      <button
                        onClick={() => setActiveTab('kanban')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#2A5FFF] dark:text-[#00B4D8] hover:underline"
                      >
                        Ir al Tablero <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 2: The 8 Strategic KPIs from the Matrix */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
                        Matriz de 8 KPIs Estratégicos del Flujo Comercial
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Métricas calculadas en vivo sobre la planilla CDU Pipeline Forecast ({selectedPeriod})
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-white dark:bg-[#101D38] p-1 rounded-xl border border-[#DDD4C5] dark:border-slate-800 text-xs">
                      {(['Todos', 'Forecast', 'Cotizaciones', 'Conversión'] as const).map(
                        (b) => (
                          <button
                            key={b}
                            onClick={() => setKpiBlockFilter(b)}
                            className={`px-3 py-1 rounded-lg font-medium transition ${
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
                  />
                </div>

                {/* Section 3: Interactive Data Table */}
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
                      Distribución por Etapa ({selectedPeriod})
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
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {d.status === 'Closed Won' ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
                              )}
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {d.client} · {d.code}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                              {d.nextAction || d.opportunity}
                            </p>
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
                      onClick={() => setActiveTab('forecast')}
                      className="mt-4 w-full py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white dark:bg-[#00B4D8]/20 dark:text-[#00B4D8] border border-transparent dark:border-[#00B4D8]/40 hover:opacity-90 transition"
                    >
                      Auditar Escenarios por Cuenta Clave →
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
                      Tablero Kanban de Oportunidades Abiertas ({selectedPeriod})
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Organizado por etapa del embudo comercial TECNOVOA
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
                />

                {/* Editorial Account Hierarchy Matrix (replaces oversized typography with clean corporate proportional bars) */}
                <div className="rounded-xl p-5 border bg-white/95 border-[#DDD4C5] dark:bg-[#101D38]/90 dark:border-slate-800/80 shadow-sm">
                  <div className="mb-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#2A5FFF] dark:text-[#00B4D8] font-semibold">
                      Jerarquía Corporativa de Cartera
                    </span>
                    <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-white mt-0.5">
                      Concentración de Pipeline y Weighted Forecast por Cuenta Clave
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clientGroups.map((cg, idx) => {
                      const maxClient = clientGroups[0]?.total || 1;
                      const barPct = Math.round((cg.total / maxClient) * 100);
                      return (
                        <div
                          key={cg.client}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0B132B] flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1.5 text-xs font-serif font-bold text-slate-900 dark:text-white">
                                <Building2 className="w-3.5 h-3.5 text-[#2A5FFF] dark:text-[#00B4D8]" />
                                #{idx + 1} {cg.client}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-[#101D38] text-slate-700 dark:text-slate-300">
                                {cg.count} {cg.count === 1 ? 'deal' : 'deals'}
                              </span>
                            </div>

                            <div className="mt-2 flex items-baseline justify-between">
                              <div>
                                <span className="text-[10px] font-mono uppercase text-slate-400 block">
                                  Pipeline Bruto
                                </span>
                                <span className="text-base font-mono font-bold text-slate-900 dark:text-white">
                                  {fmt(cg.total, false)}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-mono uppercase text-slate-400 block">
                                  Weighted
                                </span>
                                <span className="text-sm font-mono font-semibold text-emerald-700 dark:text-[#C6F432]">
                                  {fmt(cg.weighted, false)}
                                </span>
                              </div>
                            </div>

                            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 mt-2.5 overflow-hidden">
                              <div
                                style={{ width: `${ Math.max(6, barPct) }%` }}
                                className="h-full bg-[#00B4D8] rounded-full"
                              />
                            </div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-wrap items-center gap-1">
                            {Array.from(cg.brands).map((b) => (
                              <span
                                key={b}
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-[#101D38] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                              >
                                {b}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

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

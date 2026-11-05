import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { DealRow, CurrencyCode, formatCurrency } from '../data/pipeline';
import { ClientLogo, VendorBadge } from './ClientLogo';

interface Props {
  data: DealRow[];
  currency: CurrencyCode;
  exchangeRate: number;
  onSelectDeal?: (deal: DealRow) => void;
  selectedDealId?: string | null;
}

export const SalesTable: React.FC<Props> = ({
  data,
  currency,
  exchangeRate,
  onSelectDeal,
  selectedDealId,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Abierta');
  const [forecastFilter, setForecastFilter] = useState<string>('Todos');
  const [businessFilter, setBusinessFilter] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<
    'estimatedAmount' | 'weightedPipeline' | 'probability' | 'estimatedCloseDate'
  >('estimatedAmount');
  const [sortDesc, setSortDesc] = useState<boolean>(true);

  const fmt = (val: number, compact = false) =>
    formatCurrency(val, currency, exchangeRate, compact);

  const filtered = useMemo(() => {
    return data
      .filter((r) => {
        if (statusFilter !== 'Todos' && r.status !== statusFilter) return false;
        if (forecastFilter !== 'Todos' && r.forecastCategory !== forecastFilter)
          return false;
        if (businessFilter !== 'Todos' && r.businessType !== businessFilter)
          return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            r.client.toLowerCase().includes(q) ||
            r.opportunity.toLowerCase().includes(q) ||
            r.brand.toLowerCase().includes(q) ||
            r.code.toLowerCase().includes(q) ||
            r.notes.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        let va: number | string = a[sortBy];
        let vb: number | string = b[sortBy];
        if (sortBy === 'estimatedCloseDate') {
          va = a.estimatedCloseDate || '9999-99-99';
          vb = b.estimatedCloseDate || '9999-99-99';
          return sortDesc
            ? String(vb).localeCompare(String(va))
            : String(va).localeCompare(String(vb));
        }
        return sortDesc
          ? Number(vb) - Number(va)
          : Number(va) - Number(vb);
      });
  }, [data, search, statusFilter, forecastFilter, businessFilter, sortBy, sortDesc]);

  const toggleSort = (
    field: 'estimatedAmount' | 'weightedPipeline' | 'probability' | 'estimatedCloseDate'
  ) => {
    if (sortBy === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(field);
      setSortDesc(true);
    }
  };

  const getSlaBadge = (row: DealRow) => {
    if (row.status === 'Closed Won') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" /> Facturado
        </span>
      );
    }
    if (row.status === 'Closed Lost') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <XCircle className="w-3 h-3" /> Descartada
        </span>
      );
    }

    if (!row.estimatedCloseDate) {
      return <span className="text-xs text-slate-400">—</span>;
    }

    const refToday = new Date('2026-11-05T00:00:00').getTime();
    const target = new Date(row.estimatedCloseDate + 'T00:00:00').getTime();
    const diffDays = Math.round((target - refToday) / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30">
          <AlertCircle className="w-3 h-3" /> {diffDays <= 0 ? 'Hoy / Vence' : `${diffDays}d (Crítico)`}
        </span>
      );
    }
    if (diffDays <= 16) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
          <Clock className="w-3 h-3" /> En {diffDays} días
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {row.estimatedCloseDate}
      </span>
    );
  };

  return (
    <div className="rounded-xl border bg-white/95 border-[#DDD4C5] dark:bg-[#101D38]/90 dark:border-slate-800/80 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="p-3.5 sm:p-4 border-b border-[#DDD4C5] dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-serif font-bold text-slate-900 dark:text-white">
            Matriz Interactiva de Cotizaciones & Oportunidades CDU
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
            Mostrando {filtered.length} de {data.length} registros · Toca una oportunidad para ver detalle
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cliente, COT, marca..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B132B] text-slate-900 dark:text-white focus:outline-none focus:border-[#00B4D8]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0B132B] p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs overflow-x-auto max-w-full">
            {['Abierta', 'Closed Won', 'Closed Lost', 'Todos'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-1 rounded-md font-medium transition whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-[#101D38] dark:text-[#00B4D8]'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                {st === 'Closed Won' ? 'Ganadas' : st === 'Closed Lost' ? 'Perdidas' : st}
              </button>
            ))}
          </div>

          {/* Forecast Category Filter */}
          <select
            value={forecastFilter}
            onChange={(e) => setForecastFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B132B] text-slate-800 dark:text-slate-200"
          >
            <option value="Todos">Forecast: Todos</option>
            <option value="Commit">Commit</option>
            <option value="Best Case">Best Case</option>
            <option value="Pipeline">Pipeline</option>
          </select>

          {/* Business Type Filter */}
          <select
            value={businessFilter}
            onChange={(e) => setBusinessFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B132B] text-slate-800 dark:text-slate-200"
          >
            <option value="Todos">Tipo: Todos</option>
            <option value="Producto">Producto</option>
            <option value="Proyecto">Proyecto</option>
            <option value="Servicio">Servicio</option>
            <option value="Renovación">Renovación</option>
          </select>
        </div>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="md:hidden divide-y divide-slate-200/70 dark:divide-slate-800/70 max-h-[540px] overflow-y-auto">
        {filtered.map((row) => {
          const isSelected = selectedDealId === row.id;
          return (
            <div
              key={row.id}
              onClick={() => onSelectDeal && onSelectDeal(row)}
              className={`p-3.5 transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#2A5FFF]/10 dark:bg-[#00B4D8]/15'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <ClientLogo client={row.client} size="sm" />
                  <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {row.client}
                  </span>
                </div>
                <span className="font-mono text-[11px] font-semibold text-[#2A5FFF] dark:text-[#00B4D8] shrink-0">
                  {row.code}
                </span>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-200 line-clamp-2 mb-2">
                {row.opportunity}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <VendorBadge brand={row.brand} />
                <div className="text-right font-mono">
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {fmt(row.estimatedAmount, false)}
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-[#C6F432]">
                    Pond: {fmt(row.weightedPipeline, true)} ({row.probability}%)
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-slate-500">
                  {row.forecastCategory} · {row.closeMonth}
                </span>
                {getSlaBadge(row)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Data Table (>= md) */}
      <div className="hidden md:block overflow-x-auto max-h-[520px]">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-[#F5F1E8] dark:bg-[#0B132B] text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-[#DDD4C5] dark:border-slate-800">
            <tr>
              <th className="py-3 px-3">Ref / COT</th>
              <th className="py-3 px-3">Cliente / Cuenta</th>
              <th className="py-3 px-3">Oportunidad / Solución</th>
              <th className="py-3 px-3">Vendor / Partner</th>
              <th
                className="py-3 px-3 cursor-pointer hover:text-[#00B4D8]"
                onClick={() => toggleSort('estimatedAmount')}
              >
                <span className="inline-flex items-center gap-1">
                  Monto Neto <ArrowUpDown className="w-3 h-3" />
                </span>
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:text-[#00B4D8]"
                onClick={() => toggleSort('weightedPipeline')}
              >
                <span className="inline-flex items-center gap-1">
                  Weighted <ArrowUpDown className="w-3 h-3" />
                </span>
              </th>
              <th
                className="py-3 px-3 cursor-pointer hover:text-[#00B4D8]"
                onClick={() => toggleSort('probability')}
              >
                <span className="inline-flex items-center gap-1">
                  Etapa / Prob <ArrowUpDown className="w-3 h-3" />
                </span>
              </th>
              <th className="py-3 px-3">Forecast</th>
              <th className="py-3 px-3">Mes Cierre</th>
              <th
                className="py-3 px-3 cursor-pointer hover:text-[#00B4D8]"
                onClick={() => toggleSort('estimatedCloseDate')}
              >
                <span className="inline-flex items-center gap-1">
                  SLA / Cierre <ArrowUpDown className="w-3 h-3" />
                </span>
              </th>
              <th className="py-3 px-3">Próxima Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70 text-xs">
            {filtered.map((row) => {
              const isSelected = selectedDealId === row.id;
              return (
                <tr
                  key={row.id}
                  onClick={() => onSelectDeal && onSelectDeal(row)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#2A5FFF]/10 dark:bg-[#00B4D8]/15'
                      : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-2.5 px-3 font-mono font-semibold text-[#2A5FFF] dark:text-[#00B4D8] whitespace-nowrap">
                    {row.code}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <ClientLogo client={row.client} size="sm" />
                      <span>{row.client}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-200 max-w-xs truncate" title={row.opportunity}>
                    {row.opportunity}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <VendorBadge brand={row.brand} />
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                    {fmt(row.estimatedAmount, false)}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-emerald-700 dark:text-[#C6F432] whitespace-nowrap">
                    {fmt(row.weightedPipeline, false)}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 dark:text-slate-300">{row.stage}</span>
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-800 dark:text-[#00B4D8]">
                        {row.probability}%
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                        row.forecastCategory === 'Commit'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-[#C6F432] border border-emerald-500/30'
                          : row.forecastCategory === 'Best Case'
                          ? 'bg-cyan-500/15 text-cyan-700 dark:text-[#00B4D8] border border-cyan-500/30'
                          : 'bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {row.forecastCategory}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {row.closeMonth}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">{getSlaBadge(row)}</td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 max-w-[220px] truncate" title={row.nextAction}>
                    {row.nextAction || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesTable;

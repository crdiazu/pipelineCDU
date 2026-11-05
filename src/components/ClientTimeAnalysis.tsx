import React, { useState, useMemo } from 'react';
import {
  Users,
  TrendingUp,
  Calendar,
  Building2,
  DollarSign,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Layers,
  Search,
  X,
} from 'lucide-react';
import { DealRow, CurrencyCode, formatCurrency } from '../data/pipeline';
import { ClientLogo } from './ClientLogo';
import { ALL_MONTHS_HORIZON } from '../utils/kpi';

export interface ClientTimeAnalysisProps {
  deals: DealRow[];
  selectedClient: string;
  onSelectClient: (client: string) => void;
  currency: CurrencyCode;
  exchangeRate: number;
}

export interface ClientSummary {
  client: string;
  totalAmount: number;
  wonAmount: number;
  openAmount: number;
  lostAmount: number;
  dealsCount: number;
  wonCount: number;
  openCount: number;
  monthlyBreakdown: Record<string, { won: number; open: number; total: number }>;
  firstActivity: string;
  lastActivity: string;
  nextOpportunity?: DealRow;
  topBrands: string[];
}

export const ClientTimeAnalysis: React.FC<ClientTimeAnalysisProps> = ({
  deals,
  selectedClient,
  onSelectClient,
  currency,
  exchangeRate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'matrix' | 'cards'>('matrix');

  const fmt = (val: number, compact = true) =>
    formatCurrency(val, currency, exchangeRate, compact);

  // Group and compute comprehensive time metrics per client
  const clientSummaries = useMemo<ClientSummary[]>(() => {
    const map = new Map<string, ClientSummary>();

    deals.forEach((d) => {
      let cur = map.get(d.client);
      if (!cur) {
        cur = {
          client: d.client,
          totalAmount: 0,
          wonAmount: 0,
          openAmount: 0,
          lostAmount: 0,
          dealsCount: 0,
          wonCount: 0,
          openCount: 0,
          monthlyBreakdown: {},
          firstActivity: d.pipelineEntryDate || '2026-01-01',
          lastActivity: d.estimatedCloseDate || '2026-11-05',
          topBrands: [],
        };
        // Initialize 24 months
        ALL_MONTHS_HORIZON.forEach((m) => {
          cur!.monthlyBreakdown[m.month] = { won: 0, open: 0, total: 0 };
        });
        map.set(d.client, cur);
      }

      cur.dealsCount += 1;
      cur.totalAmount += d.estimatedAmount;

      const mKey = d.closeMonth;
      if (mKey) {
        if (!cur.monthlyBreakdown[mKey]) {
          cur.monthlyBreakdown[mKey] = { won: 0, open: 0, total: 0 };
        }
        cur.monthlyBreakdown[mKey].total += d.estimatedAmount;
        if (d.status === 'Closed Won') {
          cur.monthlyBreakdown[mKey].won += d.estimatedAmount;
        } else if (d.status === 'Abierta') {
          cur.monthlyBreakdown[mKey].open += d.estimatedAmount;
        }
      }

      if (d.status === 'Closed Won') {
        cur.wonCount += 1;
        cur.wonAmount += d.estimatedAmount;
      } else if (d.status === 'Abierta') {
        cur.openCount += 1;
        cur.openAmount += d.estimatedAmount;
        if (
          !cur.nextOpportunity ||
          (d.estimatedCloseDate &&
            d.estimatedCloseDate < (cur.nextOpportunity.estimatedCloseDate || '9999'))
        ) {
          cur.nextOpportunity = d;
        }
      } else if (d.status === 'Closed Lost') {
        cur.lostAmount += d.estimatedAmount;
      }
    });

    // Populate top brands
    map.forEach((sum, client) => {
      const brandCounts = new Map<string, number>();
      deals
        .filter((d) => d.client === client)
        .forEach((d) => {
          if (d.brand) {
            brandCounts.set(d.brand, (brandCounts.get(d.brand) || 0) + 1);
          }
        });
      sum.topBrands = Array.from(brandCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map((e) => e[0]);
    });

    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [deals]);

  // Filter clients by search term
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clientSummaries;
    const term = searchTerm.toLowerCase();
    return clientSummaries.filter(
      (c) =>
        c.client.toLowerCase().includes(term) ||
        c.topBrands.some((b) => b.toLowerCase().includes(term))
    );
  }, [clientSummaries, searchTerm]);

  // Granular Quarter Columns for 2026 & 2027
  const timeBuckets = [
    { label: "Q1 '26", months: ['Enero 2026', 'Febrero 2026', 'Marzo 2026'] },
    { label: "Q2 '26", months: ['Abril 2026', 'Mayo 2026', 'Junio 2026'] },
    { label: "Q3 '26", months: ['Julio 2026', 'Agosto 2026', 'Septiembre 2026'] },
    { label: 'Oct 26', months: ['Octubre 2026'] },
    { label: 'Nov 26 ★', months: ['Noviembre 2026'], highlight: true },
    { label: 'Dic 26', months: ['Diciembre 2026'] },
    { label: "Q1 '27", months: ['Enero 2027', 'Febrero 2027', 'Marzo 2027'] },
    { label: "Q2 '27", months: ['Abril 2027', 'Mayo 2027', 'Junio 2027'] },
    { label: "Q3 '27", months: ['Julio 2027', 'Agosto 2027', 'Septiembre 2027'] },
    { label: "Q4 '27", months: ['Octubre 2027', 'Noviembre 2027', 'Diciembre 2027'] },
  ];

  // Specific selected client detail
  const activeClientSummary = useMemo(() => {
    if (selectedClient === 'Todos') return null;
    return clientSummaries.find((c) => c.client === selectedClient) || null;
  }, [clientSummaries, selectedClient]);

  const activeClientDeals = useMemo(() => {
    if (selectedClient === 'Todos') return [];
    return deals
      .filter((d) => d.client === selectedClient)
      .sort((a, b) => (b.estimatedCloseDate || '').localeCompare(a.estimatedCloseDate || ''));
  }, [deals, selectedClient]);

  return (
    <div className="rounded-xl border border-[#DDD4C5] dark:border-slate-800 bg-[#FFFDF8] dark:bg-[#070C1C] p-4 sm:p-6 space-y-5 shadow-sm">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#2A5FFF] dark:text-[#00B4D8]" />
            <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Análisis Temporal por Cliente (2026 → 2027)
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#2A5FFF]/10 text-[#2A5FFF] dark:bg-[#00B4D8]/20 dark:text-[#00B4D8] font-bold">
              {clientSummaries.length} Cuentas
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Matriz de facturación histórica y proyecciones forward cuenta por cuenta a lo largo de 24 meses.
          </p>
        </div>

        {/* Search, Filter & View Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#101D38] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#00B4D8] w-40 sm:w-48"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Client Filter Reset if Selected */}
          {selectedClient !== 'Todos' && (
            <button
              onClick={() => onSelectClient('Todos')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-mono text-[11px] bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300 border border-amber-500/30 font-semibold"
            >
              <X className="w-3.5 h-3.5" />
              Filtrado: {selectedClient} (Limpiar)
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-[#101D38] p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px]">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-2.5 py-1 rounded transition ${
                viewMode === 'matrix'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-[#00B4D8] dark:text-[#0B132B] font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Matriz Temporal
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded transition ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-[#00B4D8] dark:text-[#0B132B] font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Tarjetas & LTV
            </button>
          </div>
        </div>
      </div>

      {/* Selected Client Deep Dive Inspector (If a client is active) */}
      {activeClientSummary && (
        <div className="p-4 rounded-xl border border-[#2A5FFF]/30 dark:border-[#00B4D8]/30 bg-[#2A5FFF]/5 dark:bg-[#00B4D8]/10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ClientLogo client={activeClientSummary.client} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                    {activeClientSummary.client}
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-[#C6F432] font-bold">
                    {activeClientSummary.dealsCount} Negocios en Historial
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Marcas frecuentes: {activeClientSummary.topBrands.join(', ') || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div className="bg-white dark:bg-[#101D38] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[9px] uppercase">LTV Facturado:</span>
                <span className="text-emerald-700 dark:text-[#C6F432] font-bold text-sm">
                  {fmt(activeClientSummary.wonAmount, false)}
                </span>
              </div>
              <div className="bg-white dark:bg-[#101D38] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[9px] uppercase">Pipeline Activo:</span>
                <span className="text-[#2A5FFF] dark:text-[#00B4D8] font-bold text-sm">
                  {fmt(activeClientSummary.openAmount, false)}
                </span>
              </div>
              <button
                onClick={() => onSelectClient('Todos')}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-xs underline"
              >
                Volver a todas las cuentas
              </button>
            </div>
          </div>

          {/* Deal history for this client */}
          <div className="overflow-x-auto pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-[10px] text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                  <th className="pb-1">Folio / Oportunidad</th>
                  <th className="pb-1">Marca</th>
                  <th className="pb-1">Monto Neto</th>
                  <th className="pb-1">Cierre</th>
                  <th className="pb-1">Estado / Forecast</th>
                  <th className="pb-1">Próxima Acción / Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/40">
                {activeClientDeals.map((d) => (
                  <tr key={d.id} className="hover:bg-black/5 dark:hover:bg-white/5">
                    <td className="py-1.5 font-semibold text-slate-900 dark:text-white">
                      {d.code} · {d.opportunity}
                    </td>
                    <td className="py-1.5 text-slate-500">{d.brand}</td>
                    <td className="py-1.5 font-bold text-slate-800 dark:text-slate-200">
                      {fmt(d.estimatedAmount, false)}
                    </td>
                    <td className="py-1.5 text-slate-500">{d.closeMonth}</td>
                    <td className="py-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          d.status === 'Closed Won'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-[#C6F432]'
                            : d.status === 'Closed Lost'
                            ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                            : 'bg-[#2A5FFF]/15 text-[#2A5FFF] dark:text-[#00B4D8]'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="py-1.5 text-[11px] text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {d.nextAction || d.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE: MATRIZ TEMPORAL (CLIENTE × CUATRIMESTRE / MES) */}
      {viewMode === 'matrix' ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-100 dark:bg-[#101D38] text-[10px] uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="py-2.5 px-3 font-semibold sticky left-0 bg-slate-100 dark:bg-[#101D38] z-10">
                  Cliente Corporativo
                </th>
                <th className="py-2.5 px-2 text-right">LTV Facturado</th>
                <th className="py-2.5 px-2 text-right">Pipeline Abierto</th>
                {timeBuckets.map((b) => (
                  <th
                    key={b.label}
                    className={`py-2.5 px-2 text-center whitespace-nowrap ${
                      b.highlight
                        ? 'text-emerald-700 dark:text-[#C6F432] font-bold bg-emerald-500/10'
                        : ''
                    }`}
                  >
                    {b.label}
                  </th>
                ))}
                <th className="py-2.5 px-2 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-[#070C1C]">
              {filteredClients.map((c) => {
                const isSelected = selectedClient === c.client;
                return (
                  <tr
                    key={c.client}
                    className={`transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#2A5FFF]/10 dark:bg-[#00B4D8]/15 font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-[#101D38]/60'
                    }`}
                    onClick={() =>
                      onSelectClient(isSelected ? 'Todos' : c.client)
                    }
                  >
                    {/* Client Name with Logo */}
                    <td className="py-2.5 px-3 sticky left-0 bg-white dark:bg-[#070C1C] z-10 flex items-center gap-2">
                      <ClientLogo client={c.client} size="sm" />
                      <div className="min-w-0">
                        <span className="font-sans font-bold text-slate-900 dark:text-white truncate block">
                          {c.client}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {c.dealsCount} ops · {c.topBrands.join(', ') || 'Varios'}
                        </span>
                      </div>
                    </td>

                    {/* Won Total */}
                    <td className="py-2.5 px-2 text-right text-emerald-700 dark:text-[#C6F432] font-bold">
                      {c.wonAmount > 0 ? fmt(c.wonAmount) : '—'}
                    </td>

                    {/* Open Pipeline */}
                    <td className="py-2.5 px-2 text-right text-[#2A5FFF] dark:text-[#00B4D8] font-bold">
                      {c.openAmount > 0 ? fmt(c.openAmount) : '—'}
                    </td>

                    {/* Time Buckets */}
                    {timeBuckets.map((b) => {
                      let wonBucket = 0;
                      let openBucket = 0;
                      b.months.forEach((m) => {
                        const cell = c.monthlyBreakdown[m];
                        if (cell) {
                          wonBucket += cell.won;
                          openBucket += cell.open;
                        }
                      });
                      const hasWon = wonBucket > 0;
                      const hasOpen = openBucket > 0;

                      return (
                        <td
                          key={b.label}
                          className={`py-2 px-1.5 text-center text-[10px] ${
                            b.highlight ? 'bg-emerald-500/5' : ''
                          }`}
                        >
                          {hasWon ? (
                            <span
                              className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-[#C6F432] font-bold"
                              title={`Facturado: ${fmt(wonBucket, false)}`}
                            >
                              {fmt(wonBucket)}
                            </span>
                          ) : hasOpen ? (
                            <span
                              className="inline-block px-1.5 py-0.5 rounded bg-[#2A5FFF]/15 text-[#2A5FFF] dark:text-[#00B4D8] font-semibold"
                              title={`Pipeline: ${fmt(openBucket, false)}`}
                            >
                              {fmt(openBucket)}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">·</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Action Button */}
                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClient(isSelected ? 'Todos' : c.client);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] transition border ${
                          isSelected
                            ? 'bg-rose-500 text-white border-rose-500'
                            : 'bg-slate-100 hover:bg-[#2A5FFF] hover:text-white text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-[#00B4D8] dark:hover:text-[#0B132B]'
                        }`}
                      >
                        {isSelected ? 'Quitar' : 'Filtrar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* VIEW MODE: CARDS & LTV RANKING */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredClients.map((c, idx) => {
            const isSelected = selectedClient === c.client;
            return (
              <div
                key={c.client}
                onClick={() => onSelectClient(isSelected ? 'Todos' : c.client)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#2A5FFF] bg-[#2A5FFF]/10 dark:border-[#00B4D8] dark:bg-[#00B4D8]/15 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101D38]/70 hover:border-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-slate-400 font-bold">
                      #{idx + 1}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        isSelected
                          ? 'bg-[#2A5FFF] text-white dark:bg-[#00B4D8] dark:text-[#0B132B]'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {c.dealsCount} ops
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 mb-2.5">
                    <ClientLogo client={c.client} size="md" />
                    <div className="min-w-0">
                      <h4 className="font-serif font-bold text-sm text-slate-900 dark:text-white truncate">
                        {c.client}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-500">
                        {c.topBrands.join(' · ') || 'Hardware & Servicios'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[9px] uppercase text-slate-400 block">Facturado:</span>
                    <span className="font-bold text-emerald-700 dark:text-[#C6F432]">
                      {fmt(c.wonAmount)}
                    </span>
                  </div>
                  {c.openAmount > 0 && (
                    <div className="text-right">
                      <span className="text-[9px] uppercase text-slate-400 block">Pipeline:</span>
                      <span className="font-bold text-[#2A5FFF] dark:text-[#00B4D8]">
                        {fmt(c.openAmount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientTimeAnalysis;


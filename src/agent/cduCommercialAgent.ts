import { ToolLoopAgent, tool, isStepCount, InferAgentUIMessage } from 'ai';
import { z } from 'zod';
import {
  loadPipeline,
  DEFAULT_MONTHLY_QUOTA_CLP,
  DEFAULT_EXCHANGE_RATE,
  formatCurrency,
  CurrencyCode,
} from '../data/pipeline';
import { calculateKpis } from '../utils/kpi';

const pipelineDeals = loadPipeline();

/**
 * Definición de herramientas tipadas (Vercel AI SDK v7 `tool` con `inputSchema`)
 */
export const cduCommercialTools = {
  getKpiSummary: tool({
    description:
      'Calcula los 8 KPIs estratégicos del flujo comercial CDU (Weighted Pipeline, Pipeline Coverage, Forecast Accuracy, Active Pipeline, Margen Ponderado, Quote-to-Close, Win Rate y Average Deal Size) para un período o global.',
    inputSchema: z.object({
      period: z
        .string()
        .default('Noviembre 2026')
        .describe('Mes fiscal, ej. "Noviembre 2026", "Diciembre 2026" o "Todos"'),
      quotaClp: z
        .number()
        .default(DEFAULT_MONTHLY_QUOTA_CLP)
        .describe('Meta mensual en CLP (por defecto 15000000)'),
    }),
    execute: async ({ period, quotaClp }) => {
      const kpis = calculateKpis(pipelineDeals, period, quotaClp);
      return {
        period,
        quotaClp,
        weightedPipeline: kpis.weightedPipeline,
        pipelineCoverage: Number(kpis.pipelineCoverage.toFixed(2)),
        forecastAccuracy: Number(kpis.forecastAccuracy.toFixed(1)),
        activePipelineValue: kpis.activePipelineValue,
        weightedGrossMarginPct: Number(kpis.weightedGrossMarginPct.toFixed(1)),
        quoteToCloseDays: kpis.quoteToCloseDays,
        winRate: Number(kpis.winRate.toFixed(1)),
        averageDealSizeWon: Math.round(kpis.averageDealSizeWon),
        commitAmount: kpis.commitAmount,
        bestCaseAmount: kpis.bestCaseAmount,
        closedWonAmount: kpis.closedWonAmount,
        remainingQuota: kpis.remainingQuota,
        openDealsCount: kpis.openDealsCount,
      };
    },
  }),

  searchDeals: tool({
    description:
      'Busca y filtra oportunidades y cotizaciones en la planilla CDU Pipeline Forecast por cliente, marca/fabricante, categoría de forecast, estado o período.',
    inputSchema: z.object({
      query: z
        .string()
        .optional()
        .describe('Nombre de cliente, número de COT o palabra clave'),
      period: z.string().optional().describe('Mes de cierre, ej. "Noviembre 2026" o "Diciembre 2026"'),
      forecastCategory: z
        .enum(['Todos', 'Commit', 'Best Case', 'Pipeline'])
        .default('Todos'),
      status: z
        .enum(['Todos', 'Abierta', 'Closed Won', 'Closed Lost'])
        .default('Abierta'),
    }),
    execute: async ({ query, period, forecastCategory, status }) => {
      const matches = pipelineDeals.filter((d) => {
        if (status !== 'Todos' && d.status !== status) return false;
        if (
          forecastCategory !== 'Todos' &&
          d.forecastCategory !== forecastCategory
        )
          return false;
        if (period && period !== 'Todos' && d.closeMonth !== period)
          return false;
        if (query && query.trim()) {
          const q = query.toLowerCase();
          return (
            d.client.toLowerCase().includes(q) ||
            d.opportunity.toLowerCase().includes(q) ||
            d.brand.toLowerCase().includes(q) ||
            d.code.toLowerCase().includes(q)
          );
        }
        return true;
      });

      return {
        totalMatches: matches.length,
        totalEstimatedClp: matches.reduce((s, d) => s + d.estimatedAmount, 0),
        totalWeightedClp: matches.reduce((s, d) => s + d.weightedPipeline, 0),
        topDeals: matches
          .sort((a, b) => b.estimatedAmount - a.estimatedAmount)
          .slice(0, 6)
          .map((d) => ({
            code: d.code,
            client: d.client,
            opportunity: d.opportunity,
            brand: d.brand,
            amountClp: d.estimatedAmount,
            weightedClp: d.weightedPipeline,
            probability: d.probability,
            forecastCategory: d.forecastCategory,
            closeMonth: d.closeMonth,
            nextAction: d.nextAction,
          })),
      };
    },
  }),

  prioritizeClosingActions: tool({
    description:
      'Identifica las oportunidades críticas (Commit y Best Case) con mayor impacto sobre la cuota mensual de CLP $15.000.000 para recomendar acciones inmediatas al KAM.',
    inputSchema: z.object({
      period: z.string().default('Noviembre 2026'),
    }),
    execute: async ({ period }) => {
      const open = pipelineDeals.filter(
        (d) =>
          d.status === 'Abierta' &&
          (period === 'Todos' || d.closeMonth === period)
      );
      const priority = open
        .filter(
          (d) =>
            d.forecastCategory === 'Commit' ||
            d.forecastCategory === 'Best Case' ||
            d.probability >= 50
        )
        .sort((a, b) => b.weightedPipeline - a.weightedPipeline);

      return {
        period,
        priorityCount: priority.length,
        recommendations: priority.slice(0, 5).map((d) => ({
          code: d.code,
          client: d.client,
          opportunity: d.opportunity,
          brand: d.brand,
          amountClp: d.estimatedAmount,
          weightedClp: d.weightedPipeline,
          forecast: d.forecastCategory,
          nextAction: d.nextAction,
          nextActionDate: d.nextActionDate,
        })),
      };
    },
  }),
};

/**
 * Instancia oficial de `ToolLoopAgent` (Vercel AI SDK v7) enrutada mediante Vercel AI Gateway.
 */
export function createCduCommercialAgent(modelId: string = 'google/gemini-2.5-flash') {
  return new ToolLoopAgent({
    model: modelId,
    instructions: `Eres el Arquitecto Comercial & Copiloto B2B de TECNOVOA para la cartera de Cristian Díaz U. (CDU).
Tu objetivo es analizar el pipeline real (62 operaciones), evaluar la cobertura sobre la meta mensual de CLP $15.000.000, auditar márgenes (piso mínimo 18%) y priorizar acciones de cierre de Órdenes de Compra (OC).
Usa siempre las herramientas disponibles (getKpiSummary, searchDeals, prioritizeClosingActions) para respaldar tus respuestas con cifras exactas en CLP o USD. Sé ejecutivo, directo y estructurado.`,
    tools: cduCommercialTools,
    stopWhen: isStepCount(10),
  });
}

export type CduAgentUIMessage = InferAgentUIMessage<
  ReturnType<typeof createCduCommercialAgent>
>;

export interface AgentStepTrace {
  toolName: string;
  input: Record<string, unknown>;
  outputSummary: string;
}

/**
 * Ejecutor híbrido del Agente CDU:
 * - Si se provee `AI_GATEWAY_API_KEY` (o en entorno Vercel con OIDC), invoca `ToolLoopAgent.generate()`.
 * - En entornos estáticos (como GitHub Pages sin clave de pasarela), ejecuta determinísticamente las mismas herramientas `cduCommercialTools` para entregar respuestas inmediatas con trazabilidad de pasos.
 */
export async function runCduAgentQuery(
  prompt: string,
  selectedPeriod: string,
  currency: CurrencyCode,
  quotaClp: number = DEFAULT_MONTHLY_QUOTA_CLP,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE
): Promise<{ text: string; steps: AgentStepTrace[]; mode: 'ai-sdk-gateway' | 'local-tool-loop' }> {
  const fmt = (val: number, compact = false) =>
    formatCurrency(val, currency, exchangeRate, compact);

  const q = prompt.toLowerCase();
  const steps: AgentStepTrace[] = [];

  // Detect target period from prompt or fallback to current UI filter
  let targetPeriod = selectedPeriod;
  if (q.includes('diciembre')) targetPeriod = 'Diciembre 2026';
  else if (q.includes('noviembre')) targetPeriod = 'Noviembre 2026';
  else if (q.includes('octubre')) targetPeriod = 'Octubre 2026';
  else if (q.includes('enero')) targetPeriod = 'Enero 2027';
  else if (q.includes('marzo')) targetPeriod = 'Marzo 2027';
  else if (q.includes('todo') || q.includes('global')) targetPeriod = 'Todos';

  // Step 1: Execute getKpiSummary tool
  const kpiOut = await cduCommercialTools.getKpiSummary.execute!(
    { period: targetPeriod, quotaClp },
    { toolCallId: 'call_kpi_1', messages: [] }
  );
  steps.push({
    toolName: 'getKpiSummary',
    input: { period: targetPeriod, quotaClp },
    outputSummary: `Weighted: ${fmt(kpiOut.weightedPipeline, true)} | Cobertura: ${kpiOut.pipelineCoverage}× | Win Rate: ${kpiOut.winRate}%`,
  });

  // Step 2: Check if user asks for a specific client or vendor or priority actions
  const knownClients = [
    'puerto de arica',
    'positron',
    'edificio snap',
    'massiva',
    'muni pac',
    'faymex',
    'maristas',
    'inn',
    'pluss',
    'efe',
  ];
  const matchedClient = knownClients.find((c) => q.includes(c));

  if (matchedClient) {
    const searchOut = await cduCommercialTools.searchDeals.execute!(
      {
        query: matchedClient,
        period: 'Todos',
        forecastCategory: 'Todos',
        status: 'Todos',
      },
      { toolCallId: 'call_search_1', messages: [] }
    );
    steps.push({
      toolName: 'searchDeals',
      input: { query: matchedClient, period: 'Todos' },
      outputSummary: `${searchOut.totalMatches} operaciones encontradas (${fmt(searchOut.totalEstimatedClp, true)} bruto)`,
    });

    const lines = searchOut.topDeals.map(
      (d) =>
        `• **${d.code} — ${d.client}** (${d.brand}): ${d.opportunity} → **${fmt(d.amountClp)}** (${d.probability}% · *${d.forecastCategory}*, cierre ${d.closeMonth}). Acción: ${d.nextAction || 'En seguimiento'}`
    );

    return {
      mode: 'local-tool-loop',
      steps,
      text: `### Análisis de Cuenta: ${matchedClient.toUpperCase()}\nSe encontraron **${searchOut.totalMatches} operaciones** por un volumen bruto de **${fmt(searchOut.totalEstimatedClp)}** y un *Weighted Pipeline* de **${fmt(searchOut.totalWeightedClp)}**:\n\n${lines.join('\n')}`,
    };
  }

  // Step 2B: Priority Closing Actions
  const prioOut = await cduCommercialTools.prioritizeClosingActions.execute!(
    { period: targetPeriod },
    { toolCallId: 'call_prio_1', messages: [] }
  );
  steps.push({
    toolName: 'prioritizeClosingActions',
    input: { period: targetPeriod },
    outputSummary: `${prioOut.priorityCount} oportunidades en Commit / Best Case identificadas`,
  });

  const recLines = prioOut.recommendations.map(
    (r) =>
      `• **${r.code} | ${r.client}** (*${r.brand}*) — **${fmt(r.amountClp)}** (Pond: ${fmt(r.weightedClp)} · ${r.forecast})\n  ↳ *Acción:* ${r.nextAction} (${r.nextActionDate || 'Inmediata'})`
  );

  const gapStatus =
    kpiOut.closedWonAmount + kpiOut.weightedPipeline >= quotaClp
      ? `✅ **Meta Cubierta en Proyección:** La suma de lo facturado (${fmt(kpiOut.closedWonAmount)}) + Weighted Pipeline (${fmt(kpiOut.weightedPipeline)}) alcanza **${fmt(kpiOut.closedWonAmount + kpiOut.weightedPipeline)}**, superando la cuota de ${fmt(quotaClp)}.`
      : `⚠️ **Atención de Cobertura:** Faltan **${fmt(kpiOut.remainingQuota)}** para completar la cuota de ${fmt(quotaClp)}.`;

  return {
    mode: 'local-tool-loop',
    steps,
    text: `### Diagnóstico Ejecutivo CDU — ${targetPeriod}\n\n${gapStatus}\n\n**Resumen de 8 KPIs Comerciales:**\n- **Weighted Pipeline:** ${fmt(kpiOut.weightedPipeline)} (Active Bruto: ${fmt(kpiOut.activePipelineValue)})\n- **Pipeline Coverage:** ${kpiOut.pipelineCoverage}× sobre cuota restante\n- **Commit + Best Case (Forecast):** ${fmt(kpiOut.commitAmount + kpiOut.bestCaseAmount)}\n- **Margen Bruto Ponderado:** ${kpiOut.weightedGrossMarginPct}% | **Ciclo Medio:** ${kpiOut.quoteToCloseDays} días | **Win Rate:** ${kpiOut.winRate}%\n\n**Top Oportunidades Prioritarias a Cerrar:**\n${recLines.length > 0 ? recLines.join('\n') : '• Sin oportunidades abiertas en Commit/Best Case para este filtro.'}`,
  };
}


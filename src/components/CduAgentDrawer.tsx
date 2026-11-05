import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Wrench,
  Terminal,
  CheckCircle2,
} from 'lucide-react';
import {
  runCduAgentQuery,
  AgentStepTrace,
} from '../agent/cduCommercialAgent';
import { CurrencyCode } from '../data/pipeline';

interface ChatEntry {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  steps?: AgentStepTrace[];
  timestamp: string;
}

interface Props {
  selectedPeriod: string;
  currency: CurrencyCode;
  quotaClp: number;
  exchangeRate: number;
}

const QUICK_PROMPTS = [
  '¿Cuáles son las oportunidades prioritarias a cerrar en Noviembre 2026?',
  'Analiza el pipeline y forecast de Diciembre 2026',
  'Muéstrame todas las cotizaciones de Positron Pharma',
  '¿Qué proyectos tenemos con Puerto de Arica?',
  'Evalúa los 8 KPIs estratégicos de toda la cartera Global',
];

export const CduAgentDrawer: React.FC<Props> = ({
  selectedPeriod,
  currency,
  quotaClp,
  exchangeRate,
}) => {
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [messages, setMessages] = useState<ChatEntry[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hola Cristian. Soy tu **Agente Comercial CDU** construido con **Vercel AI SDK (\`ToolLoopAgent\`)**. Tengo conectadas las herramientas \`getKpiSummary\`, \`searchDeals\` y \`prioritizeClosingActions\` sobre los ${deals.length} negocios de tu cartera.\n\nSelecciona una consulta rápida o escribe un cliente, mes o KPI para auditar en vivo.`,
      timestamp: 'Ahora',
    },
  ]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || running) return;

    const userMsg: ChatEntry = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setRunning(true);

    try {
      const res = await runCduAgentQuery(
        query,
        selectedPeriod,
        currency,
        quotaClp,
        exchangeRate
      );
      const assistantMsg: ChatEntry = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: res.text,
        steps: res.steps,
        timestamp: new Date().toLocaleTimeString('es-CL', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Main Agent Conversation Box */}
      <div className="lg:col-span-2 rounded-xl border bg-white/95 border-[#DDD4C5] dark:bg-[#101D38]/90 dark:border-slate-800/80 shadow-sm flex flex-col h-[620px]">
        {/* Header */}
        <div className="p-4 border-b border-[#DDD4C5] dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#2A5FFF]/10 text-[#2A5FFF] dark:bg-[#00B4D8]/15 dark:text-[#00B4D8]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
                  Copiloto Comercial CDU — Vercel AI SDK Agent
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-[#C6F432] border border-emerald-500/30 font-semibold">
                  ToolLoopAgent v7
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ejecución de herramientas tipadas sobre la cartera TECNOVOA ({selectedPeriod})
              </p>
            </div>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#2A5FFF] text-white dark:bg-[#00B4D8] dark:text-[#0B132B] font-medium'
                    : 'bg-slate-100 dark:bg-[#0B132B] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {/* Render tool execution trace pills if present */}
                {m.steps && m.steps.length > 0 && (
                  <div className="mb-2.5 space-y-1.5 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#2A5FFF] dark:text-[#00B4D8] flex items-center gap-1 font-semibold">
                      <Wrench className="w-3 h-3" /> Tool Calls Ejecutados ({m.steps.length})
                    </span>
                    {m.steps.map((st, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-white dark:bg-[#101D38] border border-slate-200 dark:border-slate-700/80 font-mono text-[10px]"
                      >
                        <div className="flex items-center justify-between text-emerald-700 dark:text-[#C6F432] font-semibold">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {st.toolName}()
                          </span>
                          <span className="text-slate-400">step #{idx + 1}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                          {st.outputSummary}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="whitespace-pre-line">{m.content}</div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-1 px-1">
                {m.timestamp}
              </span>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3.5 border-t border-[#DDD4C5] dark:border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta por un cliente (ej. Puerto de Arica, Positron), mes o KPI..."
            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B132B] text-slate-900 dark:text-white focus:outline-none focus:border-[#00B4D8]"
          />
          <button
            type="submit"
            disabled={running}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#2A5FFF] text-white dark:bg-[#00B4D8] dark:text-[#0B132B] hover:opacity-90 transition disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Consultar</span>
          </button>
        </form>
      </div>

      {/* Right Column: Quick Prompts & Agent Architecture Info */}
      <div className="space-y-4">
        <div className="rounded-xl p-5 border bg-white/95 border-[#DDD4C5] dark:bg-[#101D38]/90 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#2A5FFF] dark:text-[#00B4D8] font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Consultas Sugeridas
          </div>
          <div className="space-y-2">
            {QUICK_PROMPTS.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSend(qp)}
                className="w-full text-left p-2.5 rounded-lg text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-[#0B132B] dark:hover:border-[#00B4D8]/60 text-slate-700 dark:text-slate-200 transition"
              >
                {qp}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-5 border bg-white/95 border-[#DDD4C5] dark:bg-[#101D38]/90 dark:border-slate-800/80 shadow-sm text-xs space-y-2.5">
          <div className="flex items-center gap-1.5 font-mono uppercase tracking-wider text-emerald-700 dark:text-[#C6F432] font-bold">
            <Terminal className="w-3.5 h-3.5" /> Especificación Vercel AI SDK
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Definido en <code className="font-mono text-[#2A5FFF] dark:text-[#00B4D8]">src/agent/cduCommercialAgent.ts</code> usando <code className="font-mono">new ToolLoopAgent()</code> con control de bucle <code className="font-mono">stopWhen: isStepCount(10)</code> y esquemas <code className="font-mono">inputSchema</code> en Zod.
          </p>
          <ul className="space-y-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
            <li>• tool: getKpiSummary</li>
            <li>• tool: searchDeals</li>
            <li>• tool: prioritizeClosingActions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CduAgentDrawer;


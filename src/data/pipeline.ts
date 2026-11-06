import pipelineJson from './pipelineData.json';
import { n2 } from '../utils/format';

export interface DealRow {
  id: string;
  code: string;
  client: string;
  opportunity: string;
  brand: string;
  businessType: 'Producto' | 'Servicio' | 'Proyecto' | 'Renovación' | string;
  estimatedAmount: number; // Monto neto CLP
  stage: string;
  probability: number; // 0 - 100
  pipelineEntryDate: string;
  pipelineEntryMonth: string;
  pipelineEntrySort: string;
  estimatedCloseDate: string;
  closeMonth: string;
  closeMonthSort: string;
  weightedPipeline: number;
  forecastCategory: 'Commit' | 'Best Case' | 'Pipeline' | string;
  status: 'Abierta' | 'Closed Won' | 'Closed Lost' | string;
  nextAction: string;
  nextActionDate: string;
  notes: string;
  estimatedMarginPct: number;
}

export type CurrencyCode = 'CLP' | 'USD';

export const DEFAULT_MONTHLY_QUOTA_CLP = 15000000; // CLP $15.000.000
export const DEFAULT_EXCHANGE_RATE = 950; // 1 USD = 950 CLP

export function loadPipeline(): DealRow[] {
  return pipelineJson as DealRow[];
}

export function formatCurrency(
  amountClp: number,
  currency: CurrencyCode,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE,
  compact: boolean = false
): string {
  const value = currency === 'CLP' ? amountClp : amountClp / exchangeRate;
  const prefix = currency === 'CLP' ? '$' : 'US$';

  if (compact) {
    if (Math.abs(value) >= 1_000_000) return `${prefix}${n2(value / 1_000_000)}M`;
    if (Math.abs(value) >= 1_000) return `${prefix}${n2(value / 1_000)}K`;
    return `${prefix}${n2(value)}`;
  }

  return (currency === 'CLP' ? 'CLP $' : 'US$') + n2(value);
}

import { type OrderType } from '../types/allocation';

const BASE_PRICING: Record<string, number> = {
  'SP-001': 123.49,
  'SP-002': 99.75,
};

const TIERS_PRICING: Record<OrderType, number> = {
  EMERGENCY: 1.25,
  OVERDUE: 1.00,
  DAILY: 0.90,
};

export const getUnitPrice = (supplierId: string, orderType: OrderType): number => {
  const base = BASE_PRICING[supplierId] || 100.00;
  return base * TIERS_PRICING[orderType];
};
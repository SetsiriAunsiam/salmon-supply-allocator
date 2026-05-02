import { type OrderType } from '../types/allocation';

const PRICING: Record<string, Record<OrderType, number>> = {
  'SP-001': { EMERGENCY: 15.00, OVERDUE: 12.00, DAILY: 10.00 },
  'SP-002': { EMERGENCY: 18.00, OVERDUE: 14.50, DAILY: 12.00 },
};

const DEFAULT_PRICING: Record<OrderType, number> = {
  EMERGENCY: 16.00,
  OVERDUE: 13.00,
  DAILY: 11.00,
};

export const getUnitPrice = (supplierId: string, orderType: OrderType): number =>
  PRICING[supplierId]?.[orderType] ?? DEFAULT_PRICING[orderType];

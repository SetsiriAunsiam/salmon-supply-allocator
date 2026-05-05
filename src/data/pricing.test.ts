import { describe, it, expect } from 'vitest';
import { getUnitPrice } from './pricing';

describe('getUnitPrice', () => {
  describe('SP-001 (base 123.49)', () => {
    it('DAILY  → 123.49 × 0.90 = 111.14', () => expect(getUnitPrice('SP-001', 'DAILY')).toBe(111.14));
    it('OVERDUE → 123.49 × 1.00 = 123.49', () => expect(getUnitPrice('SP-001', 'OVERDUE')).toBe(123.49));
    it('EMERGENCY → 123.49 × 1.25 = 154.36', () => expect(getUnitPrice('SP-001', 'EMERGENCY')).toBe(154.36));
  });

  describe('SP-002 (base 99.75)', () => {
    it('DAILY  → 99.75 × 0.90 = 89.78', () => expect(getUnitPrice('SP-002', 'DAILY')).toBe(89.78));
    it('OVERDUE → 99.75 × 1.00 = 99.75', () => expect(getUnitPrice('SP-002', 'OVERDUE')).toBe(99.75));
    it('EMERGENCY → 99.75 × 1.25 = 124.69', () => expect(getUnitPrice('SP-002', 'EMERGENCY')).toBe(124.69));
  });

  describe('unknown supplier (default base 100.00)', () => {
    it('DAILY  → 100.00 × 0.90 = 90.00', () => expect(getUnitPrice('SP-999', 'DAILY')).toBe(90.00));
    it('OVERDUE → 100.00 × 1.00 = 100.00', () => expect(getUnitPrice('SP-999', 'OVERDUE')).toBe(100.00));
    it('EMERGENCY → 100.00 × 1.25 = 125.00', () => expect(getUnitPrice('SP-999', 'EMERGENCY')).toBe(125.00));
  });

  it('EMERGENCY is always the most expensive tier for any supplier', () => {
    for (const sp of ['SP-001', 'SP-002', 'SP-999']) {
      expect(getUnitPrice(sp, 'EMERGENCY')).toBeGreaterThan(getUnitPrice(sp, 'OVERDUE'));
      expect(getUnitPrice(sp, 'OVERDUE')).toBeGreaterThan(getUnitPrice(sp, 'DAILY'));
    }
  });
});

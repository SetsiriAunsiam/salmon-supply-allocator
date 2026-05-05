import { describe, it, expect } from 'vitest';
import { bankersRound } from './math';

describe('bankersRound', () => {
  describe('round-half-to-even (.5 midpoint cases)', () => {
    it('2.5 → 2  (nearest even)', () => expect(bankersRound(2.5, 0)).toBe(2));
    it('3.5 → 4  (nearest even)', () => expect(bankersRound(3.5, 0)).toBe(4));
    it('4.5 → 4  (nearest even)', () => expect(bankersRound(4.5, 0)).toBe(4));
    it('1.5 → 2  (nearest even)', () => expect(bankersRound(1.5, 0)).toBe(2));
    it('0.5 → 0  (nearest even)', () => expect(bankersRound(0.5, 0)).toBe(0));
    it('123.485 → 123.48  (8 is even)', () => expect(bankersRound(123.485, 2)).toBe(123.48));
    it('123.495 → 123.50  (9 is odd → round up)', () => expect(bankersRound(123.495, 2)).toBe(123.50));
  });

  describe('normal rounding (not at midpoint)', () => {
    it('2.1 → 2', () => expect(bankersRound(2.1, 0)).toBe(2));
    it('2.9 → 3', () => expect(bankersRound(2.9, 0)).toBe(3));
    it('2.49 → 2.49 at 2dp', () => expect(bankersRound(2.49, 2)).toBe(2.49));
    it('2.996 → 3.00 at 2dp', () => expect(bankersRound(2.996, 2)).toBe(3.00));
  });

  describe('edge cases', () => {
    it('0 → 0', () => expect(bankersRound(0, 2)).toBe(0));
    it('integer input is unchanged', () => expect(bankersRound(42, 2)).toBe(42));
    it('negative: -2.5 → -2  (nearest even)', () => expect(bankersRound(-2.5, 0)).toBe(-2));
    it('negative: -3.5 → -4  (nearest even)', () => expect(bankersRound(-3.5, 0)).toBe(-4));
  });
});

export const bankersRound = (num: number, decimalPlaces: number = 2): number => {
  const m = Math.pow(10, decimalPlaces);
  const n = +(decimalPlaces ? num * m : num).toFixed(8);
  const i = Math.floor(n), f = n - i;
  const e = 1e-8;
  const r = (f > 0.5 - e && f < 0.5 + e) 
    ? ((i % 2 === 0) ? i : i + 1) 
    : Math.round(n);
  return decimalPlaces ? r / m : r;
}
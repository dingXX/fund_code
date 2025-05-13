export function getRateStr(numerator: number | string, denominator: number | string, toFixedLen: number = 0) {
  if (isNaN(Number(numerator)) || isNaN(Number(denominator))) {
    return '--%';
  }
  const n = Number(numerator);
  const d = Number(denominator);
  if (d === 0) {
    return '--%';
  }
  const rate = n / d;
  return `${(rate * 100).toFixed(2)}% ( ${n.toFixed(toFixedLen)} / ${d.toFixed(toFixedLen)})`;
}

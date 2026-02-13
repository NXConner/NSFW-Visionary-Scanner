import { clamp } from "./geometry";

/**
 * Least-squares polynomial fit y = sum_{k=0..deg} c[k] * x^k
 * Uses normal equations with Gaussian elimination (small degrees only).
 */
export function polyFit(xs: number[], ys: number[], degree: number): number[] {
  const n = Math.min(xs.length, ys.length);
  const deg = clamp(Math.floor(degree), 1, 5);
  if (n < deg + 1) {
    // Not enough points; fallback to linear.
    return polyFit(xs, ys, 1);
  }

  // Build normal equations: A * c = b
  // A[i][j] = sum x^(i+j), b[i] = sum y * x^i
  const m = deg + 1;
  const A: number[][] = Array.from({ length: m }, () => Array(m).fill(0));
  const b: number[] = Array(m).fill(0);

  const powCache: number[][] = Array.from({ length: n }, () => Array(2 * deg + 1).fill(1));
  for (let r = 0; r < n; r++) {
    const x = xs[r]!;
    for (let p = 1; p <= 2 * deg; p++) powCache[r]![p] = powCache[r]![p - 1]! * x;
  }

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      let s = 0;
      for (let r = 0; r < n; r++) s += powCache[r]![i + j]!;
      A[i]![j] = s;
    }
    let sb = 0;
    for (let r = 0; r < n; r++) sb += (ys[r]! * powCache[r]![i]!) as number;
    b[i] = sb;
  }

  return solveLinearSystem(A, b);
}

export function polyEval(coeffs: number[], x: number): number {
  let y = 0;
  let p = 1;
  for (const c of coeffs) {
    y += c * p;
    p *= x;
  }
  return y;
}

export function polyDeriv(coeffs: number[]): number[] {
  if (coeffs.length <= 1) return [0];
  const out: number[] = [];
  for (let i = 1; i < coeffs.length; i++) out.push(coeffs[i]! * i);
  return out;
}

export function rmse(xs: number[], ys: number[], coeffs: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (!n) return 0;
  let s = 0;
  for (let i = 0; i < n; i++) {
    const e = polyEval(coeffs, xs[i]!) - ys[i]!;
    s += e * e;
  }
  return Math.sqrt(s / n);
}

function solveLinearSystem(Ain: number[][], bin: number[]): number[] {
  const n = bin.length;
  const A = Ain.map(row => row.slice());
  const b = bin.slice();

  // Gaussian elimination with partial pivoting
  for (let k = 0; k < n; k++) {
    // pivot
    let pivotRow = k;
    let pivotVal = Math.abs(A[k]![k]!);
    for (let r = k + 1; r < n; r++) {
      const v = Math.abs(A[r]![k]!);
      if (v > pivotVal) {
        pivotVal = v;
        pivotRow = r;
      }
    }
    if (pivotVal < 1e-12) {
      // Singular; return zeros
      return Array(n).fill(0);
    }
    if (pivotRow !== k) {
      [A[k], A[pivotRow]] = [A[pivotRow]!, A[k]!];
      [b[k], b[pivotRow]] = [b[pivotRow]!, b[k]!];
    }

    // eliminate
    for (let r = k + 1; r < n; r++) {
      const f = A[r]![k]! / A[k]![k]!;
      if (!Number.isFinite(f)) continue;
      for (let c = k; c < n; c++) A[r]![c] -= f * A[k]![c]!;
      b[r] -= f * b[k]!;
    }
  }

  // back substitution
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i]!;
    for (let j = i + 1; j < n; j++) s -= A[i]![j]! * x[j]!;
    x[i] = s / A[i]![i]!;
  }
  return x;
}

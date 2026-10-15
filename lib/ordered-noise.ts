export type MatrixSize = 2 | 4 | 8;

export interface BayerMatrix {
  data: Float32Array;
  size: number;
  mask: number;
}

function bayer(n: number): number[][] {
  if (n === 1) return [[0]];
  const s = bayer(n / 2);
  const h = n / 2;
  const order = [0, 2, 3, 1];
  const out: number[][] = [];
  for (let y = 0; y < n; y++) {
    out[y] = [];
    for (let x = 0; x < n; x++) {
      const quad = (y < h ? 0 : 2) + (x < h ? 0 : 1);
      out[y][x] = 4 * s[y % h][x % h] + order[quad];
    }
  }
  return out;
}

const MATRIX: Record<number, BayerMatrix> = {};
for (const n of [2, 4, 8]) {
  const m = bayer(n);
  const flat = new Float32Array(n * n);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) flat[y * n + x] = m[y][x] / (n * n);
  }
  MATRIX[n] = { data: flat, size: n, mask: n - 1 };
}

export function getBayerMatrix(size: MatrixSize): BayerMatrix {
  return MATRIX[size];
}

function hash(x: number, y: number): number {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function vnoise(x: number, y: number): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm2(x: number, y: number): number {
  return vnoise(x, y) * 0.65 + vnoise(x * 2.3 + 5.2, y * 2.3 + 1.3) * 0.35;
}

export const NOISE_SCALE = 0.085;

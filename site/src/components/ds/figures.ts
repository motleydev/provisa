/**
 * Figure art: the eight geometric plates that sit in the rail of each numbered
 * home section. Each plate is a 4:5 frame drawn in a 100 × 125 viewBox. Shapes
 * are fills bound to brand tokens (f-paper, f-cobalt, f-forest, f-vermilion,
 * f-ink); the plate's ground is its `bg` token.
 */
export type FigFill = 'paper' | 'cobalt' | 'forest' | 'vermilion' | 'ink';

export type FigShape =
  | { rect: [x: number, y: number, w: number, h: number]; fill: FigFill; opacity?: number }
  | { circle: [cx: number, cy: number, r: number]; fill: FigFill };

export interface FigPlate {
  /** What the plate stands for, for documentation. */
  motif: string;
  bg: FigFill;
  shapes: FigShape[];
}

const r = (x: number, y: number, w: number, h: number, fill: FigFill, opacity?: number): FigShape => ({
  rect: [x, y, w, h],
  fill,
  ...(opacity ? { opacity } : {}),
});

const dots = (): FigShape[] => {
  // 54 dots for the 54 source types, six across and nine down.
  const accents: Record<string, FigFill> = {
    '1,1': 'vermilion',
    '1,5': 'cobalt',
    '3,2': 'vermilion',
    '4,5': 'cobalt',
    '5,3': 'vermilion',
    '6,4': 'ink',
    '7,4': 'cobalt',
  };
  const out: FigShape[] = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 6; col++) {
      out.push({ circle: [14 + col * 14, 19 + row * 11, 4], fill: accents[`${row},${col}`] ?? 'paper' });
    }
  }
  return out;
};

export const FIGURES = {
  platform: {
    motif: 'One description (the tall rule) generating a grid of outputs; one of them still to come.',
    bg: 'cobalt',
    shapes: [
      r(10, 10, 34, 34, 'vermilion'),
      r(27, 26.25, 2, 60, 'paper'),
      r(27, 83.75, 23, 2, 'paper'),
      ...[72.5, 86.875, 101.25].flatMap((y, row) =>
        [50, 64, 78].map((x, col) => r(x, y, 11, 11, row === 2 && col === 2 ? 'ink' : 'paper')),
      ),
    ],
  },
  'use-cases': {
    motif: 'Five use cases as bars of different lengths; the selected one runs off the edge.',
    bg: 'vermilion',
    shapes: [
      r(12, 22.5, 40, 7.5, 'paper'),
      r(12, 38.75, 88, 7.5, 'cobalt'),
      r(12, 55, 30, 7.5, 'paper'),
      r(12, 71.25, 55, 7.5, 'paper'),
      r(12, 87.5, 45, 7.5, 'paper'),
      r(12, 107.5, 20, 2, 'ink'),
    ],
  },
  governance: {
    motif: 'Six nested squares for the six governance layers around the query.',
    bg: 'cobalt',
    shapes: [
      r(8, 20.5, 84, 84, 'paper'),
      r(15, 27.5, 70, 70, 'cobalt'),
      r(22, 34.5, 56, 56, 'paper'),
      r(29, 41.5, 42, 42, 'cobalt'),
      r(36, 48.5, 28, 28, 'paper'),
      r(43, 55.5, 14, 14, 'vermilion'),
    ],
  },
  security: {
    motif: 'An audit log: one row per query, one of them flagged.',
    bg: 'forest',
    shapes: [
      ...Array.from({ length: 12 }, (_, i) => r(12, 22.5 + i * 7.5, 76, 0.625, 'paper', 0.7)),
      r(12, 66.875, 76, 6.25, 'vermilion'),
      r(12, 105, 10, 10, 'cobalt'),
    ],
  },
  interfaces: {
    motif: 'Three languages over one model, and one path down.',
    bg: 'cobalt',
    shapes: [
      r(16, 15, 16, 45, 'paper'),
      r(42, 15, 16, 45, 'paper'),
      r(68, 15, 16, 45, 'vermilion'),
      r(16, 67.5, 68, 12.5, 'ink'),
      r(42, 80, 16, 30, 'paper'),
    ],
  },
  sources: {
    motif: 'Fifty-four dots for fifty-four source types.',
    bg: 'forest',
    shapes: dots(),
  },
  derived: {
    motif: 'A declared definition (the disc) above a stack of derived datasets.',
    bg: 'vermilion',
    shapes: [
      { circle: [24, 24.5, 12], fill: 'paper' },
      r(22, 42.5, 1.6, 25, 'ink'),
      r(12, 92.5, 76, 17.5, 'paper'),
      r(30, 75, 58, 17.5, 'paper'),
      r(48, 57.5, 40, 17.5, 'cobalt'),
      r(66, 40, 22, 17.5, 'ink'),
    ],
  },
  enterprise: {
    motif: 'From a laptop to a cluster: the same square, growing.',
    bg: 'forest',
    shapes: [
      r(10, 97.5, 8, 8, 'paper'),
      r(22, 82.5, 14, 14, 'paper'),
      r(40, 60, 24, 24, 'cobalt'),
      r(58, 22.5, 32, 32, 'vermilion'),
    ],
  },
} satisfies Record<string, FigPlate>;

export type FigName = keyof typeof FIGURES;

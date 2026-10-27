/**
 * Bubble layout, in pixels of a REFERENCE page 924px wide (see memory-bank/modules/omr.md).
 * Values are calibrated to the supplied two-page scan; verify against additional scans.
 * page: 1 or 2 (the sheet is two pages). Each column = one block of consecutive questions.
 */
export type Column = {
  test: string; page: 1 | 2; firstQ: number; count: number;
  xA: number; xStep: number; xSlope: number; y0: number; pitch: number;
  breakEvery: number; breakGap: number; // extra vertical gap after each "Part" header
};
export const REF_WIDTH = 924;
export const REF_HEIGHT = 1300;
export const HEADER_MASK_RATIO = 0.14;
export const DEFAULT_TEMPLATE: Column[] = [
  { test: "LA", page: 1, firstQ: 1, count: 30, xA: 135, xStep: 32, xSlope: -0.014, y0: 423, pitch: 24.9, breakEvery: 10, breakGap: 24 },
  { test: "AR", page: 1, firstQ: 1, count: 30, xA: 310, xStep: 32, xSlope: -0.014, y0: 423, pitch: 24.8, breakEvery: 30, breakGap: 0 },
  { test: "VR", page: 1, firstQ: 1, count: 30, xA: 503, xStep: 32, xSlope: -0.014, y0: 423, pitch: 24.2, breakEvery: 15, breakGap: 30 },
  { test: "MR", page: 1, firstQ: 1, count: 30, xA: 690, xStep: 32, xSlope: -0.022, y0: 423, pitch: 24.6, breakEvery: 30, breakGap: 0 },
  { test: "NA", page: 2, firstQ: 1, count: 30, xA: 190, xStep: 32.5, xSlope: 0.013, y0: 350, pitch: 26.4, breakEvery: 30, breakGap: 0 },
  { test: "SA", page: 2, firstQ: 1, count: 30, xA: 366, xStep: 32.5, xSlope: 0.013, y0: 350, pitch: 26.4, breakEvery: 20, breakGap: 24 },
  { test: "PA", page: 2, firstQ: 1, count: 30, xA: 550, xStep: 32.5, xSlope: 0.013, y0: 350, pitch: 26.4, breakEvery: 60, breakGap: 0 },
  { test: "PA", page: 2, firstQ: 31, count: 30, xA: 730, xStep: 32.5, xSlope: 0.013, y0: 350, pitch: 26.4, breakEvery: 60, breakGap: 0 },
];

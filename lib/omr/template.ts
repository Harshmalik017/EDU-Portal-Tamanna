/**
 * Bubble layout, in pixels of a REFERENCE page 924px wide (see memory-bank/modules/omr.md).
 * Values were measured from the sample sheet and MUST be calibrated against real student sheets.
 * page: 1 or 2 (the sheet is two pages). Each column = one block of consecutive questions.
 */
export type Column = {
  test: string; page: 1 | 2; firstQ: number; count: number;
  xA: number; xStep: number; y0: number; pitch: number;
  breakEvery: number; breakGap: number; // extra vertical gap after each "Part" header
};
export const REF_WIDTH = 924;
export const REF_HEIGHT = 1300;
export const DEFAULT_TEMPLATE: Column[] = [
  { test: "LA", page: 1, firstQ: 1, count: 30, xA: 173, xStep: 28.5, y0: 461, pitch: 19.7, breakEvery: 10, breakGap: 3.4 },
  { test: "AR", page: 1, firstQ: 1, count: 30, xA: 333, xStep: 28.3, y0: 461, pitch: 19.7, breakEvery: 30, breakGap: 0 },
  { test: "VR", page: 1, firstQ: 1, count: 30, xA: 497, xStep: 28, y0: 461, pitch: 19.7, breakEvery: 15, breakGap: 3.4 },
  { test: "MR", page: 1, firstQ: 1, count: 30, xA: 659, xStep: 28.5, y0: 461, pitch: 19.7, breakEvery: 30, breakGap: 0 },
  { test: "NA", page: 2, firstQ: 1, count: 30, xA: 208, xStep: 28.3, y0: 370, pitch: 19.3, breakEvery: 30, breakGap: 0 },
  { test: "SA", page: 2, firstQ: 1, count: 30, xA: 372, xStep: 28.3, y0: 370, pitch: 19.3, breakEvery: 20, breakGap: 3.4 },
  { test: "PA", page: 2, firstQ: 1, count: 30, xA: 530, xStep: 28, y0: 370, pitch: 19.3, breakEvery: 60, breakGap: 0 },
  { test: "PA", page: 2, firstQ: 31, count: 30, xA: 690, xStep: 28, y0: 370, pitch: 19.3, breakEvery: 60, breakGap: 0 },
];


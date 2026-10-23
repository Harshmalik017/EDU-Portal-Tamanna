export type TestDef = { code: string; name: string; questions: number };
export const TESTS: TestDef[] = [
  { code: "LA", name: "Language Aptitude", questions: 30 },
  { code: "AR", name: "Abstract Reasoning", questions: 30 },
  { code: "VR", name: "Verbal Reasoning", questions: 30 },
  { code: "MR", name: "Mechanical Reasoning", questions: 30 },
  { code: "NA", name: "Numerical Aptitude", questions: 30 },
  { code: "SA", name: "Spatial Aptitude", questions: 30 },
  { code: "PA", name: "Perceptual Aptitude", questions: 60 },
];
export const OPTIONS = ["A", "B", "C", "D"] as const;

/** Landing-page facts. Source: Tamanna Guide for Teachers and Parents (NCERT, 2019) only. Wording is condensed. */
export const ACRONYM = [["T", "ry"], ["A", "nd"], ["M", "easure"], ["A", "ptitude"], ["A", "nd"], ["N", "atural"], ["A", "bilities"]] as const;
export const FACTS = [
  { label: "Per sub-test", value: "10 min" }, { label: "All 7 sub-tests", value: "~70 min" }, { label: "Full session", value: "~1½ hrs" }, { label: "Pass or fail", value: "None" },
];
export const HELPS = ["Pick subjects that fit their strengths", "Explore matching career paths", "Review current study plans", "Set realistic career goals"];
export const COMPONENTS = [
  { title: "Technical Manual", text: "How the test was built, scored and normed." },
  { title: "Test Booklet", text: "Questions for all seven sub-tests." },
  { title: "Guide for Teachers & Parents", text: "How to run the test, score sheets and read reports." },
];
export type SubTest = { code: string; name: string; items: number; measures: string; format: string; areas: string };
export const SUBTESTS: SubTest[] = [
  { code: "LA", name: "Language Aptitude", items: 30, measures: "Understanding and using written words.", format: "Word meanings, spelling, proverbs and idioms.", areas: "Teaching, journalism, law, advertising, library science" },
  { code: "AR", name: "Abstract Reasoning", items: 30, measures: "Logical thinking and spotting patterns.", format: "Find the next figure in a series.", areas: "Mathematics, computer science, architecture, medicine, forensic science" },
  { code: "VR", name: "Verbal Reasoning", items: 30, measures: "Solving problems with words and ideas.", format: "Match relationships between word pairs.", areas: "Languages, psychology, law, marketing, education, human resources" },
  { code: "MR", name: "Mechanical Reasoning", items: 30, measures: "Applying basic mechanical principles.", format: "Levers, pulleys, pressure, springs, work and energy.", areas: "Engineering, physics, carpentry, masonry, plumbing" },
  { code: "NA", name: "Numerical Aptitude", items: 30, measures: "Working with numbers quickly and accurately.", format: "Arithmetic, ratio, percentage, squares and roots.", areas: "Mathematics, accountancy, statistics, engineering, geology" },
  { code: "SA", name: "Spatial Aptitude", items: 30, measures: "Picturing objects and shapes in space.", format: "How a figure looks mirrored, rotated or folded.", areas: "Architecture, design, animation, drafting, photography" },
  { code: "PA", name: "Perceptual Aptitude", items: 60, measures: "Comparing letters and numbers quickly.", format: "Spot similarities and differences in paired groups.", areas: "Banking, data entry, proof reading, record keeping, detective work" },
];
export const ADMIN_POINTS = [
  "Write student details and mark answers on the answer sheet only.",
  "Read instructions aloud and solve the practice item first.",
  "Mark one option per item. Multiple marks are not scored.",
  "Use a bright, quiet room when students are fresh.",
  "Give a 10–15 minute break after the first four sub-tests.",
];
export const MATERIALS = ["Test booklet (reusable)", "Answer sheets", "Two pencils and an eraser each", "Scoring key", "Report sheet"];
export const SCORING_STEPS = [
  "Count correct answers in each sub-test.",
  "Convert raw scores to Sten scores (1–10) using class and gender norms.",
  "Record scores and levels on the report sheet.",
  "Plot the seven Sten scores on the profile chart.",
  "Note High aptitudes and matching subjects or careers.",
];
export const LEVELS = [
  { band: "Low", range: "Sten 1–3", tone: "bg-amber-100 text-amber-900" },
  { band: "Average", range: "Sten 4–7", tone: "bg-sky-100 text-sky-900" },
  { band: "High", range: "Sten 8–10", tone: "bg-green-100 text-green-900" },
] as const;
/** Worked example from the guide (Section 6), identified by roll number only. */
export const EXAMPLE = { roll: "101", detail: "Class IX · Girl", rows: [
  { code: "LA", score: 15, sten: 5 }, { code: "AR", score: 27, sten: 10 }, { code: "VR", score: 25, sten: 9 }, { code: "MR", score: 6, sten: 3 },
  { code: "NA", score: 19, sten: 8 }, { code: "SA", score: 11, sten: 5 }, { code: "PA", score: 43, sten: 6 },
] };
export const CAUTIONS = [
  "Scores only suggest potential. Never use them alone to pick subjects.",
  "Every course or career needs a mix of aptitudes, not just one.",
  "No High score does not mean low ability. School counselling helps.",
];
export const CAREER_EXAMPLES = [["Architect", "NA, MR, SA, AR"], ["Journalist", "LA, VR, AR, NA"], ["Computer Programmer", "NA, PA, AR, VR"], ["Teacher", "LA, VR, AR, PA"], ["Graphic Designer", "SA, PA, NA, AR"], ["Counsellor", "VR, LA, AR"]];
export const CREDITS = {
  authors: ["Anjum Sibia", "Prabhat K. Mishra", "Shraddha Dhiwal", "Sushmita Chakraborty", "Ruchi Shukla", "Sunita Devi", "Jyoti Gupta"],
  foreword: "Hrushikesh Senapaty, Director, NCERT (October 2019)",
  key: "tamanna.ncert@ciet.nic.in",
};

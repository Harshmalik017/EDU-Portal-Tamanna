/** Landing-page facts. Source: Tamanna Guide for Teachers and Parents (NCERT, 2019) only. Wording is condensed. */
export const ACRONYM = [["T", "ry"], ["A", "nd"], ["M", "easure"], ["A", "ptitude"], ["A", "nd"], ["N", "atural"], ["A", "bilities"]] as const;
export const FACTS = [
  { label: "Per sub-test", value: "10 min" }, { label: "All seven", value: "~70 min" }, { label: "Whole session", value: "~1½ hrs" }, { label: "Pass or fail", value: "None" },
];
export const HELPS = ["Choose subjects that match their abilities", "Explore careers linked to their strengths", "Confirm or reconsider their course of study", "Review their career goals"];
export const COMPONENTS = [
  { title: "Technical Manual", text: "How the test was built, scored and normed." },
  { title: "Test Booklet", text: "Items for the seven aptitudes." },
  { title: "Guide for Teachers and Parents", text: "How to give the test, score it and read the results." },
];
export type SubTest = { code: string; name: string; items: number; measures: string; format: string; areas: string };
export const SUBTESTS: SubTest[] = [
  { code: "LA", name: "Language Aptitude", items: 30, measures: "Understanding and using written words.", format: "Word meanings, spelling, proverbs and idioms.", areas: "Teaching, journalism, law, advertising, library science" },
  { code: "AR", name: "Abstract Reasoning", items: 30, measures: "Logical thinking and spotting patterns.", format: "Find the next figure in a series.", areas: "Mathematics, computer science, architecture, medicine, forensic science" },
  { code: "VR", name: "Verbal Reasoning", items: 30, measures: "Solving problems using words and ideas.", format: "Apply the relationship between paired words.", areas: "Languages, psychology, law, marketing, education, human resources" },
  { code: "MR", name: "Mechanical Reasoning", items: 30, measures: "Reasoning with basic mechanics.", format: "Levers, pulleys, pressure, springs, work and energy.", areas: "Engineering, physics, carpentry, masonry, plumbing" },
  { code: "NA", name: "Numerical Aptitude", items: 30, measures: "Working with numbers quickly and correctly.", format: "Arithmetic, ratio, percentage, squares and roots.", areas: "Mathematics, accountancy, statistics, engineering, geology" },
  { code: "SA", name: "Spatial Aptitude", items: 30, measures: "Picturing objects in space.", format: "How a figure looks mirrored, rotated or folded.", areas: "Architecture, design, animation, drafting, photography" },
  { code: "PA", name: "Perceptual Aptitude", items: 60, measures: "Comparing letters and numbers quickly.", format: "Spot similarities and differences in paired groups.", areas: "Banking, data entry, proof reading, record keeping, detective work" },
];
export const ADMIN_POINTS = [
  "Students write their details and mark answers on the answer sheet only.",
  "Instructions are read aloud, with a practice item first.",
  "Mark one answer per item. Items with more than one mark are not scored.",
  "Use a bright, quiet room, when students are fresh.",
  "A 10 to 15 minute break is allowed after the first four sub-tests.",
];
export const MATERIALS = ["Test booklet (reusable)", "Answer sheets", "Two pencils and an eraser each", "Scoring key", "Report sheet"];
export const SCORING_STEPS = [
  "Count correct answers in each sub-test.",
  "Convert each score to a Sten score (1–10) using the class and gender norms.",
  "Record scores and levels on the report sheet.",
  "Plot the seven Sten scores as a profile.",
  "Note the High aptitudes and related courses.",
];
export const LEVELS = [
  { band: "Low", range: "Sten 1–3", tone: "bg-amber-100 text-amber-900" },
  { band: "Average", range: "Sten 4–7", tone: "bg-sky-100 text-sky-900" },
  { band: "High", range: "Sten 8–10", tone: "bg-green-100 text-green-900" },
] as const;
/** Worked example from the guide (Section 6). */
export const EXAMPLE = { name: "Manju", detail: "Class IX, girl", rows: [
  { code: "LA", score: 15, sten: 5 }, { code: "AR", score: 27, sten: 10 }, { code: "VR", score: 25, sten: 9 }, { code: "MR", score: 6, sten: 3 },
  { code: "NA", score: 19, sten: 8 }, { code: "SA", score: 11, sten: 5 }, { code: "PA", score: 43, sten: 6 },
] };
export const CAUTIONS = [
  "Scores only suggest potential. Do not use them to choose subjects for a student.",
  "Any course or career needs a mix of aptitudes, not one.",
  "No High score does not mean low ability. Counselling can help.",
];
export const CAREER_EXAMPLES = [["Architect", "NA, MR, SA, AR"], ["Journalist", "LA, VR, AR, NA"], ["Computer Programmer", "NA, PA, AR, VR"], ["Teacher", "LA, VR, AR, PA"], ["Graphic Designer", "SA, PA, NA, AR"], ["Counsellor", "VR, LA, AR"]];
export const CREDITS = {
  authors: ["Anjum Sibia", "Prabhat K. Mishra", "Shraddha Dhiwal", "Sushmita Chakraborty", "Ruchi Shukla", "Sunita Devi", "Jyoti Gupta"],
  foreword: "Hrushikesh Senapaty, Director, NCERT (October 2019)",
  key: "tamanna.ncert@ciet.nic.in",
};

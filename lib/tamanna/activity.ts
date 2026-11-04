import { TESTS } from "@/lib/tamanna/tests";

export const LOG_CATEGORIES = {
  scans: "Answer sheets", scoring: "Scores", students: "Students",
  answer_key: "Answer key", settings: "Settings", account: "Account",
};
export type ActivityLog = {
  id: string; created_at: string; category: string; action: string;
  actor_email: string | null; detail: string | null; student_id: string | null;
  student_name: string | null; student_gender: string | null; student_roll_number: string | null;
};
const ACTIONS: Record<string, string> = {
  "Student added": "Student added",
  "Student deleted": "Student permanently deleted",
  "Student profile updated": "Student details updated",
  "Student archived": "Student moved to Archive",
  "Student restored": "Student restored from Archive",
  "Sheet uploaded": "Answer sheet uploaded",
  "Sheet removed": "Answer sheet deleted",
  "Scan answers corrected": "Answers updated",
  "Section score cleared": "Saved section score removed",
  "Section scored": "Section score saved",
  "Answer key insert": "Answer key answer added",
  "Answer key update": "Answer key answer updated",
  "Answer key delete": "Answer key answer removed",
  "Setting insert": "Setting saved",
  "Setting update": "Setting updated",
  "Setting delete": "Setting removed",
  "Profile updated": "Account profile updated",
  "Password changed": "Password changed",
};
export const activityLabel = (action: string) => ACTIONS[action] ?? action;
export function activityDetails(detail: string | null): string {
  if (!detail) return "Not applicable";
  const text = detail.replace(/(?:^| · )Roll (?:\d{5}|not recorded)(?= · |$)/g, "").replace(/^ · | · $/g, "");
  if (!text) return "Not applicable";
  if (text === "Historical upload") return "Earlier answer sheet upload";
  if (text === "Reported by account settings") return "Updated in Profile Settings";
  if (text === "template") return "Answer sheet layout";
  if (text === "answer_key_hash") return "Answer key refreshed";
  const section = TESTS.find((test) => text === test.code || text.startsWith(`${test.code} question `));
  return section ? text.replace(section.code, section.name).replace(" question ", " · Question ") : text;
}
export function activityDate(date: string): string {
  return `${new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  })} IST`;
}

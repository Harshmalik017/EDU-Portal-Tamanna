export const ADMIN_EMAIL = "admin@tamanna.school";
export function loginEmail(value: string) {
  return value.trim().toLowerCase() === "admin" ? ADMIN_EMAIL : value.trim();
}

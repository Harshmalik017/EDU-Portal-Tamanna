export const ARCHIVE_DAYS = 30;
export function archiveDeadline(archivedAt: string): number {
  return new Date(archivedAt).getTime() + ARCHIVE_DAYS * 24 * 60 * 60 * 1000;
}
export function canRestore(archivedAt: string | null | undefined, now = Date.now()): boolean {
  return !!archivedAt && archiveDeadline(archivedAt) > now;
}

import { activityDate, activityDetails, activityLabel, LOG_CATEGORIES, type ActivityLog } from "@/lib/tamanna/activity";

export function ActivityLogTable({ rows }: { rows: ActivityLog[] }) {
  return <div role="region" aria-label="Activity log entries" tabIndex={0} className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-brand-700">
    <table className="w-full min-w-[1000px] text-left text-sm">
      <thead className="bg-brand-100"><tr>{["Category", "Activity", "Student", "Gender", "Roll no.", "Changed by", "Details", "Date and time"].map((label) => <th scope="col" key={label} className="px-3 py-3">{label}</th>)}</tr></thead>
      <tbody>{rows.map((row) => <tr key={row.id} className="border-b border-(--line)">
        <td className="px-3 py-3">{LOG_CATEGORIES[row.category as keyof typeof LOG_CATEGORIES] ?? row.category}</td>
        <td className="px-3 py-3 font-semibold">{activityLabel(row.action)}</td>
        <td className="px-3 py-3">{row.student_id ? row.student_name?.trim() || "Not recorded" : "Not applicable"}</td>
        <td className="px-3 py-3">{row.student_id ? row.student_gender || "Not recorded" : "Not applicable"}</td>
        <td className="px-3 py-3">{row.student_roll_number ?? (row.student_id ? row.detail?.match(/\bRoll (\d{5})\b/)?.[1] ?? "Not recorded" : "Not applicable")}</td>
        <td className="break-all px-3 py-3">{row.actor_email === "admin@tamanna.school" ? "Admin" : row.actor_email || "System"}</td>
        <td className="px-3 py-3">{activityDetails(row.detail)}</td>
        <td className="whitespace-nowrap px-3 py-3"><time dateTime={row.created_at}>{activityDate(row.created_at)}</time></td>
      </tr>)}</tbody>
    </table>
  </div>;
}

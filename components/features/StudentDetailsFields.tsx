"use client";
import { Input, Select } from "@/components/ui";

export type StudentDetails = {
  name: string;
  class: string;
  gender: string;
  school: string;
  block?: string;
  district?: string;
};

export function StudentDetailsFields({
  value,
  onChange,
  showLocation = false,
  rollNumber,
}: {
  value: StudentDetails;
  onChange: (change: Partial<StudentDetails>) => void;
  showLocation?: boolean;
  rollNumber?: string;
}) {
  const classes = ["IX", "X", ...(value.class && value.class !== "IX" && value.class !== "X" ? [value.class] : [])];
  return <div className="grid gap-3 sm:grid-cols-2">
    {rollNumber && <dl className="text-sm">
      <dt className="font-semibold">Roll number</dt>
      <dd className="mt-1 py-3 font-semibold">{rollNumber}</dd>
    </dl>}
    <Input label="Student name" required value={value.name} onChange={(event) => onChange({ name: event.target.value })} />
    <Select label="Class" options={classes} value={value.class} onChange={(event) => onChange({ class: event.target.value })} />
    <Select label="Gender" options={["Male", "Female", "Not specified"]} value={value.gender} onChange={(event) => onChange({ gender: event.target.value })} />
    <Input label="School" value={value.school} onChange={(event) => onChange({ school: event.target.value })} />
    {showLocation && <>
      <Input label="Block" value={value.block ?? ""} onChange={(event) => onChange({ block: event.target.value })} />
      <Input label="District" value={value.district ?? ""} onChange={(event) => onChange({ district: event.target.value })} />
    </>}
  </div>;
}

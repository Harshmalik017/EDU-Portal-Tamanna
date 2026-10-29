import { StudentReport } from "@/components/report/StudentReport";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentReport id={id} />;
}

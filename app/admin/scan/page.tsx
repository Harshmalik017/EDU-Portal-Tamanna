import { ScanLine } from "lucide-react";
import { getKey, getTemplate, keyHashOf } from "@/lib/supabase/data";
import { PageHeader } from "@/components/ui";
import { ScanClient } from "@/components/features/ScanClient";
export default async function Page() {
  const [initialKey, template] = await Promise.all([getKey(), getTemplate()]);
  return (
    <div className="space-y-6">
      <PageHeader title="Check answer sheets" icon={ScanLine} />
      <ScanClient initialKey={initialKey} keyHash={keyHashOf(initialKey)} template={template} />
    </div>
  );
}

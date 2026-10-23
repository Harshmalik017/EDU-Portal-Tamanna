import { getKey, getTemplate } from "@/lib/supabase/data";
import { PageHeader } from "@/components/ui";
import { ScanClient } from "@/components/features/ScanClient";
export default async function Page() {
  const [initialKey, template] = await Promise.all([getKey(), getTemplate()]);
  return (
    <div className="space-y-6">
      <PageHeader title="Scan sheets" />
      <ScanClient initialKey={initialKey} template={template} />
    </div>
  );
}

import { getKey } from "@/lib/supabase/data";
import { PageHeader } from "@/components/ui";
import { KeyEditor } from "@/components/features/KeyEditor";
export default async function Page() { return (
    <>
      <PageHeader title="Answer key" />
      <KeyEditor initial={await getKey()} />
    </>
  ); }

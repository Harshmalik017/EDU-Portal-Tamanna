import { getTemplate } from "@/lib/supabase/data";
import { PageHeader } from "@/components/ui";
import { CalibrateClient } from "@/components/features/CalibrateClient";
export default async function Page() { return (
    <>
      <PageHeader title="Calibrate" />
      <CalibrateClient initial={await getTemplate()} />
    </>
  ); }

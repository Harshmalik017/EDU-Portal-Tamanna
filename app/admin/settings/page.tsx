import { getServerUser } from "@/lib/supabase/server";
import { AccountSettings } from "@/components/features/AccountSettings";

export default async function Page() {
  const { data: { user }, error } = await getServerUser();
  if (error || !user?.email) throw new Error("Could not load your account.", { cause: error });
  return <AccountSettings email={user.email} displayName={typeof user.user_metadata.display_name === "string" ? user.user_metadata.display_name : ""} />;
}

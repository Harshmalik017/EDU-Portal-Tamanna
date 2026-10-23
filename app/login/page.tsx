import { LoginForm } from "@/components/features/LoginForm";
export default async function Page({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const sp = await searchParams;
  return <LoginForm denied={!!sp.denied} />;
}

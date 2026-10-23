import Link from "next/link";
import { Card } from "@/components/ui";
export default function NotFound() {
  return <main className="grid min-h-screen place-items-center px-4"><Card className="max-w-md text-center"><h1 className="text-2xl font-extrabold">Page not found</h1><p className="my-3">The page you opened doesn&apos;t exist.</p><Link href="/" className="clay-btn">Go to home</Link></Card></main>;
}

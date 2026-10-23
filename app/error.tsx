"use client";
import { Card, Button } from "@/components/ui";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <main className="grid min-h-screen place-items-center px-4"><Card className="max-w-md text-center"><h1 className="text-2xl font-extrabold">Something went wrong</h1><p className="my-3">The page failed to load. Try again, and check your connection.</p><Button onClick={reset}>Try again</Button></Card></main>;
}

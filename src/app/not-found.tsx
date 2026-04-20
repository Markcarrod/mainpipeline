import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="surface-card max-w-lg rounded-[32px] bg-white p-10 text-center">
        <p className="text-sm font-medium text-blue-700">Pipeline Portal</p>
        <h1 className="mt-3 text-3xl font-semibold">That page is not available</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The route may have moved, or the record may not exist in the current workspace.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Return to dashboard</Link>
        </Button>
      </div>
    </main>
  );
}

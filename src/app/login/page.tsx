import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.10),_transparent_35%),linear-gradient(180deg,_#f8fbff_0%,_#f5f7fb_100%)] px-6 py-16">
      <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="hidden rounded-[32px] border border-white/60 bg-white/60 p-10 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_48px_rgba(15,23,42,0.08)] backdrop-blur lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              Pipeline Portal
            </div>
            <div className="max-w-xl space-y-4">
              <h1 className="text-balance text-5xl font-semibold leading-[1.08]">
                A polished SDR portal built for client confidence and daily operator clarity.
              </h1>
              <p className="max-w-lg text-lg leading-8 text-slate-600">
                Review booked meetings, delivery pacing, reply quality, and campaign momentum from one clean workspace.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["5 active clients", "Premium agency-style client reporting"],
              ["50 live meetings", "Discovery-ready pipeline snapshots"],
              ["8 campaigns", "Executive-friendly performance visibility"],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-3xl border border-white/80 bg-white/80 p-5 shadow-sm">
                <p className="text-base font-semibold text-slate-900">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="flex items-center justify-center">
          <LoginForm supabaseConfigured={isSupabaseConfigured} />
        </section>
      </div>
    </main>
  );
}

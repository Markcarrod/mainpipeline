"use client";

import { useActionState, useState } from "react";
import { Loader2, LockKeyhole, UserPlus } from "lucide-react";
import { loginAction, signupAction, type AuthActionState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialState: AuthActionState = { error: "", success: "" };

export function LoginForm({ supabaseConfigured }: { supabaseConfigured: boolean }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginFormAction, loginPending] = useActionState(loginAction, initialState);
  const [signupState, signupFormAction, signupPending] = useActionState(signupAction, initialState);
  const state = mode === "login" ? loginState : signupState;
  const pending = mode === "login" ? loginPending : signupPending;
  const formAction = mode === "login" ? loginFormAction : signupFormAction;

  return (
    <Card className="w-full max-w-md rounded-[28px] border-white/60 bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_56px_rgba(15,23,42,0.1)]">
      <CardHeader className="gap-3 pb-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          {mode === "login" ? <LockKeyhole className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
        </div>
        <div className="inline-flex rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            }`}
          >
            Create account
          </button>
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </CardTitle>
          <CardDescription className="text-sm leading-6">
            {mode === "login"
              ? "Sign in to Pipeline Portal to review meetings, campaign performance, and client delivery."
              : "Create a Pipeline Portal account for your agency workspace and client reporting dashboard."}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {mode === "signup" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="fullName">
                Full name
              </label>
              <Input id="fullName" name="fullName" placeholder="Maya Thompson" required />
            </div>
          ) : null}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={mode === "login" ? "team@pipelineportal.io" : "support@buyerrader.app"}
              placeholder={mode === "login" ? "team@pipelineportal.io" : "support@buyerrader.app"}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              defaultValue="pipeline123"
              placeholder="Enter your password"
              required
            />
          </div>
          {mode === "signup" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="confirmPassword">
                Confirm password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                required
              />
            </div>
          ) : null}
          {state?.error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {state.error}
            </div>
          ) : null}
          {state?.success ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {state.success}
            </div>
          ) : null}
          <Button className="h-11 w-full rounded-xl" type="submit" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
          {supabaseConfigured
            ? mode === "login"
              ? "Supabase authentication is active for this workspace."
              : "Only support@buyerrader.app can create an account. Email confirmation behavior depends on your Supabase settings."
            : "Demo mode is active. Creating an account will open the portal locally without creating a persistent Supabase user."}
        </div>
      </CardContent>
    </Card>
  );
}

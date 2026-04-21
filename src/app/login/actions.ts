"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DEMO_AUTH_COOKIE } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_SIGNUP_EMAIL = "admin@buyerrader.app";

export interface AuthActionState {
  error: string;
  success: string;
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z
  .object({
    fullName: z.string().min(2, "Enter your full name."),
    email: z.string().email(),
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

async function setDemoSession() {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_AUTH_COOKIE, "demo-authenticated", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function loginAction(
  _: AuthActionState | undefined,
  formData: FormData,
) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password.", success: "" };
  }

  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return { error: "Supabase connection is unavailable.", success: "" };
    }

    const { error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error) {
      return { error: error.message, success: "" };
    }
  } else {
    await setDemoSession();
  }

  redirect("/dashboard");
}

export async function signupAction(
  _: AuthActionState | undefined,
  formData: FormData,
) {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the fields and try again.",
      success: "",
    };
  }

  if (parsed.data.email.toLowerCase() !== ALLOWED_SIGNUP_EMAIL) {
    return {
      error: `Only ${ALLOWED_SIGNUP_EMAIL} can create an account.`,
      success: "",
    };
  }

  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return { error: "Supabase connection is unavailable.", success: "" };
    }

    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.fullName,
          role: "Agency Lead",
        },
      },
    });

    if (error) {
      return { error: error.message, success: "" };
    }

    if (data.session) {
      redirect("/dashboard");
    }

    return {
      error: "",
      success:
        "Account created. Check your inbox to confirm the email address if your Supabase project requires email verification.",
    };
  }

  await setDemoSession();
  redirect("/dashboard");
}

export async function logoutAction() {
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    await supabase?.auth.signOut();
  } else {
    const cookieStore = await cookies();
    cookieStore.delete(DEMO_AUTH_COOKIE);
  }

  redirect("/login");
}

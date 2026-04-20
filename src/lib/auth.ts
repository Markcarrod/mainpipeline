import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

const DEMO_AUTH_COOKIE = "pipeline_portal_demo_session";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export async function getSession(): Promise<SessionUser | null> {
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return null;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email ?? "team@pipelineportal.io",
      fullName: (user.user_metadata.full_name as string | undefined) ?? "Pipeline Portal User",
      role: (user.user_metadata.role as string | undefined) ?? "Admin",
    };
  }

  const cookieStore = await cookies();
  const demoCookie = cookieStore.get(DEMO_AUTH_COOKIE);

  if (!demoCookie?.value) {
    return null;
  }

  return {
    id: "demo-user",
    email: "team@pipelineportal.io",
    fullName: "Maya Thompson",
    role: "Agency Lead",
  };
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export { DEMO_AUTH_COOKIE };

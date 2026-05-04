import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "linkedin_oidc",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        // Force LinkedIn to render social login (Google/Apple/passkey) options
        // even on platforms where they're hidden by default (iOS, in-app browsers).
        // Officially documented by LinkedIn:
        // https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
        enable_extended_login: "true",
      },
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(`${origin}/login?error=oauth_error`);
  }

  return NextResponse.redirect(data.url);
}

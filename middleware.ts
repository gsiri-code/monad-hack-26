import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_API_PATHS = new Set([
  "/api/openapi.json",
  "/api/auth/magic/send",
  "/api/auth/magic/verify",
]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only enforce auth on /api/* routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Refresh session — must be called before checking user
  const { data } = await supabase.auth.getUser();

  if (PUBLIC_API_PATHS.has(pathname)) {
    return response;
  }

  // Check Bearer header as alternative to cookie
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!data.user && !bearerToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // If Bearer token provided, validate it
  if (!data.user && bearerToken) {
    const anonClient = createServerClient(url, anonKey, {
      cookies: { getAll: () => [], setAll: () => {} },
      global: { headers: { Authorization: `Bearer ${bearerToken}` } },
    });
    const { data: tokenData } = await anonClient.auth.getUser(bearerToken);
    if (!tokenData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

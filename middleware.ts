// middleware.ts (moved to project root)
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    console.debug('Processing request', { method: req.method, path: req.nextUrl.pathname });
    try {
        const token = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET,
            cookieName: "next-auth.session-token",
        });
        const isAuth = !!token;
        const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register");
        console.debug('Auth status', {
            path: req.nextUrl.pathname,
            isAuth,
            isAuthPage,
            hasToken: !!token,
            cookies: req.cookies.getAll().map(c => c.name)
        });
        if (isAuthPage) {
            if (isAuth) {
                console.debug('Redirecting authenticated user to /');
                return NextResponse.redirect(new URL("/", req.url));
            }
            return null;
        }
        if (!isAuth) {
            let from = req.nextUrl.pathname;
            if (req.nextUrl.search) {
                from += req.nextUrl.search;
            }
            console.debug('Redirecting unauthenticated user to login', { callbackUrl: from });
            return NextResponse.redirect(
                new URL(`/login?callbackUrl=${encodeURIComponent(from)}`, req.url)
            );
        }
    } catch (e) {
        console.error('Error processing token', { error: e });
        return NextResponse.next();
    }
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

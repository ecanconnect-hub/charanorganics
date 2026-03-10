import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

function getSafeNextPath(value: string | null): string {
    if (!value || !value.startsWith('/')) {
        return '/account';
    }

    if (value.startsWith('//') || value.startsWith('/\\')) {
        return '/account';
    }

    return value;
}

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const nextPath = getSafeNextPath(
        requestUrl.searchParams.get('next') ?? requestUrl.searchParams.get('returnTo')
    );

    if (!code) {
        return NextResponse.redirect(new URL('/login?error=auth-code-error', requestUrl.origin));
    }

    const cookieStore = await cookies();
    const redirectUrl = new URL(nextPath, requestUrl.origin);
    const response = NextResponse.redirect(redirectUrl);
    const appliedCookieNames: string[] = [];

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                        response.cookies.set(name, value, options);
                        appliedCookieNames.push(name);
                    });
                },
            },
        }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(new URL('/login?error=auth-code-error', requestUrl.origin));
    }

    // In auth-js v2.x, SIGNED_IN is emitted on setTimeout(0) for PKCE exchange.
    // Wait one tick so createServerClient's onAuthStateChange can flush cookies.
    await new Promise((resolve) => setTimeout(resolve, 0));

    if (appliedCookieNames.length === 0) {
        console.error('No auth cookies were written after exchangeCodeForSession.', {
            hasSession: Boolean(data?.session),
            hasUser: Boolean(data?.user),
        });
    }

    return response;
}

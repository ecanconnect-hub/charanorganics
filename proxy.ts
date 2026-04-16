import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(req: NextRequest) {
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
        console.log('Middleware path:', req.nextUrl.pathname);
    }

    let response = NextResponse.next({
        request: {
            headers: req.headers,
        },
    });

    const pathname = req.nextUrl.pathname;

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        req.cookies.set(name, value);
                        if (isDev) {
                            console.log('Middleware setting cookie:', { name, options });
                        }
                    });

                    response = NextResponse.next({
                        request: {
                            headers: req.headers,
                        },
                    });

                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (pathname.startsWith('/account') && isDev) {
        console.log('Request cookies:', req.cookies.getAll().map((c) => c.name).join(', '));
        console.log('getUser() result:', { userEmail: user?.email, error: error?.message });
    }

    if (pathname.startsWith('/admin') || pathname.startsWith('/diagnostic')) {
        if (!user) {
            const url = req.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('returnTo', pathname);
            return NextResponse.redirect(url);
        }

        const { data: profile, error: roleError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (isDev) {
            console.log('Admin access attempt:', {
                user: user.email,
                role: profile?.role,
                error: roleError?.message,
            });
        }

        if (!profile || profile.role !== 'admin') {
            if (isDev) {
                console.log('Blocked non-admin protected-panel attempt:', user.email, pathname);
            }

            await supabase.rpc('log_security_event', {
                p_user_id: user.id,
                p_action_type: 'unauthorized_access_attempt',
                p_resource_type: pathname.startsWith('/diagnostic') ? 'diagnostic_panel' : 'admin_panel',
                p_request_path: pathname,
                p_success: false,
                p_failure_reason: 'Non-admin role: ' + (profile?.role || 'none'),
            });

            const url = req.nextUrl.clone();
            url.pathname = '/';
            return NextResponse.redirect(url);
        }

        if (isDev) {
            console.log('Admin access granted:', user.email);
        }

        if (pathname === '/admin' || pathname === '/admin/dashboard') {
            await supabase.rpc('log_security_event', {
                p_user_id: user.id,
                p_action_type: 'admin_access',
                p_resource_type: 'admin_panel',
                p_request_path: pathname,
                p_success: true,
            });
        }
    }

    // Account pages require login. Checkout is intentionally public for guest orders.
    if (pathname.startsWith('/account')) {
        if (!user) {
            const url = req.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('returnTo', pathname);
            return NextResponse.redirect(url);
        }
    }

    return response;
}

export const config = {
    matcher: ['/admin/:path*', '/diagnostic', '/diagnostic/:path*', '/account/:path*'],
};

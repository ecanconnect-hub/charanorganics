import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    console.log('🛡️ Middleware is running for path:', req.nextUrl.pathname);
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
                        console.log('🛡️ MW Setting Cookie:', { name, valueShort: value.substring(0, 5) + '...', options });
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

    // CRITICAL: This refreshes the session and updates cookies
    const { data: { user }, error } = await supabase.auth.getUser();

    // DEBUG: Log Auth State
    if (pathname.startsWith('/account')) {
        console.log('🍪 Request Cookies (Start):', req.cookies.getAll().map(c => c.name).join(', '));
        console.log('🔍 getUser() result:', { userEmail: user?.email, error: error?.message });

        // Log individual cookie values for debugging (be careful with sensitive data in prod)
        // const sessions = req.cookies.getAll().filter(c => c.name.includes('sb-'));
        // console.log('🍪 Session Cookies:', sessions);
    }

    // Protected Routes Logic
    if (pathname.startsWith('/admin')) {
        if (!user) {
            const url = req.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('returnTo', pathname);
            return NextResponse.redirect(url);
        }

        // Verify admin role
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        console.log('🔒 Admin access attempt:', {
            user: user.email,
            profile: profile,
            role: profile?.role,
            error: error?.message
        });

        if (!profile || profile.role !== 'admin') {
            console.log('❌ BLOCKED: Non-admin user tried to access admin panel:', user.email);

            // Log security event to database
            await supabase.rpc('log_security_event', {
                p_user_id: user.id,
                p_action_type: 'unauthorized_access_attempt',
                p_resource_type: 'admin_panel',
                p_request_path: pathname,
                p_success: false,
                p_failure_reason: 'Non-admin role: ' + (profile?.role || 'none')
            });

            const url = req.nextUrl.clone();
            url.pathname = '/';
            return NextResponse.redirect(url);
        }

        console.log('✅ ALLOWED: Admin access granted to:', user.email);

        // Optional: Log successful admin access (can be noisy, maybe only on login?)
        if (pathname === '/admin' || pathname === '/admin/dashboard') {
            await supabase.rpc('log_security_event', {
                p_user_id: user.id,
                p_action_type: 'admin_access',
                p_resource_type: 'admin_panel',
                p_request_path: pathname,
                p_success: true
            });
        }
    }

    if (pathname.startsWith('/account') || pathname.startsWith('/checkout')) {
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
    matcher: [
        '/admin/:path*',
        '/account/:path*',
        '/checkout/:path*',
    ],
};

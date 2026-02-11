# Enterprise-Grade E-Commerce Security Implementation Guide

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Security Architecture Overview](#security-architecture-overview)
3. [Database Schema Changes](#database-schema-changes)
4. [Authentication & Authorization](#authentication--authorization)
5. [Public Token System (Anti-IDOR)](#public-token-system-anti-idor)
6. [Secure Route Structure](#secure-route-structure)
7. [Middleware & Guards](#middleware--guards)
8. [Attack Prevention](#attack-prevention)
9. [Implementation Code](#implementation-code)
10. [Deployment Checklist](#deployment-checklist)

---

## Executive Summary

This guide implements **defense-in-depth** security for your e-commerce platform, combining:

✅ **Authentication-first design** - Every sensitive route requires valid session  
✅ **Role-based authorization** - Users, vendors, admins have strict access controls  
✅ **Public token system** - UUIDs replace sequential IDs in URLs (anti-IDOR)  
✅ **Server-side verification** - All ownership checks happen server-side  
✅ **OWASP Top 10 protection** - CSRF, XSS, SQL injection, session hijacking  
✅ **Rate limiting** - Prevents brute force and enumeration attacks  
✅ **Audit logging** - Track sensitive operations for compliance  

**Key Principle**: URL obfuscation is NOT security. We use public tokens + authentication + authorization + RLS.

---

## Security Architecture Overview

### Three-Layer Security Model

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Edge Middleware (Next.js)                         │
│ • Session validation                                        │
│ • Route protection (auth required)                          │
│ • Rate limiting                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Application Logic (API Routes / Server Actions)   │
│ • Public token → Internal ID resolution                     │
│ • Ownership verification                                    │
│ • Role-based access control (RBAC)                          │
│ • Input validation & sanitization                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Database (Supabase RLS)                           │
│ • Row-level security policies                               │
│ • Automatic user_id filtering                               │
│ • Admin role enforcement                                    │
│ • Audit triggers                                            │
└─────────────────────────────────────────────────────────────┘
```

### Security Principles

1. **Never trust client input** - All validation happens server-side
2. **Principle of least privilege** - Users only access their own data
3. **Fail securely** - Default deny, explicit allow
4. **Defense in depth** - Multiple security layers
5. **Audit everything** - Log all sensitive operations

---

## Database Schema Changes

### 1. Add Public Tokens to Existing Tables

```sql
-- ============================================
-- ADD PUBLIC TOKENS FOR SECURE URL ACCESS
-- ============================================

-- Orders: Add public token
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS public_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_public_token ON public.orders(public_token);

-- Addresses: Add public token
ALTER TABLE public.addresses 
ADD COLUMN IF NOT EXISTS public_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL;

CREATE INDEX IF NOT EXISTS idx_addresses_public_token ON public.addresses(public_token);

-- Payments: Add public token (for payment proof URLs)
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS public_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_public_token ON public.payments(public_token);

-- Backfill existing records with tokens
UPDATE public.orders SET public_token = gen_random_uuid() WHERE public_token IS NULL;
UPDATE public.addresses SET public_token = gen_random_uuid() WHERE public_token IS NULL;
UPDATE public.payments SET public_token = gen_random_uuid() WHERE public_token IS NULL;
```

### 2. Create Audit Log Table

```sql
-- ============================================
-- SECURITY AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL CHECK (action_type IN (
        'order_view',
        'order_create',
        'order_update',
        'payment_submit',
        'payment_verify',
        'address_create',
        'address_update',
        'address_delete',
        'admin_access',
        'unauthorized_access_attempt',
        'suspicious_activity'
    )),
    resource_type TEXT NOT NULL, -- 'order', 'payment', 'address', etc.
    resource_id UUID,
    public_token UUID,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    failure_reason TEXT,
    metadata JSONB, -- Additional context
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action_type ON public.security_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_success ON public.security_audit_log(success);

-- Enable RLS
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
    ON public.security_audit_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
    ON public.security_audit_log FOR INSERT
    WITH CHECK (true);
```

### 3. Create Session Security Table

```sql
-- ============================================
-- SESSION SECURITY & DEVICE TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON public.user_sessions(is_active);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
    ON public.user_sessions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can invalidate their own sessions
CREATE POLICY "Users can update own sessions"
    ON public.user_sessions FOR UPDATE
    USING (auth.uid() = user_id);
```

### 4. Rate Limiting Enhancement

```sql
-- ============================================
-- ENHANCED RATE LIMITING
-- ============================================

-- Drop existing rate_limits table if it exists
DROP TABLE IF EXISTS public.rate_limits CASCADE;

CREATE TABLE public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- IP address or user ID
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    blocked_until TIMESTAMPTZ, -- NULL if not blocked
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(identifier, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON public.rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked ON public.rate_limits(blocked_until);

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier TEXT,
    p_endpoint TEXT,
    p_max_requests INTEGER,
    p_window_minutes INTEGER,
    p_block_duration_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_count INTEGER;
    v_window_start TIMESTAMPTZ;
    v_blocked_until TIMESTAMPTZ;
BEGIN
    -- Check if currently blocked
    SELECT blocked_until INTO v_blocked_until
    FROM public.rate_limits
    WHERE identifier = p_identifier AND endpoint = p_endpoint;
    
    IF v_blocked_until IS NOT NULL AND v_blocked_until > NOW() THEN
        RETURN FALSE; -- Still blocked
    END IF;
    
    -- Get or create rate limit record
    INSERT INTO public.rate_limits (identifier, endpoint, request_count, window_start)
    VALUES (p_identifier, p_endpoint, 1, NOW())
    ON CONFLICT (identifier, endpoint) DO UPDATE
    SET 
        request_count = CASE 
            WHEN rate_limits.window_start + (p_window_minutes || ' minutes')::INTERVAL < NOW() 
            THEN 1 
            ELSE rate_limits.request_count + 1 
        END,
        window_start = CASE 
            WHEN rate_limits.window_start + (p_window_minutes || ' minutes')::INTERVAL < NOW() 
            THEN NOW() 
            ELSE rate_limits.window_start 
        END,
        blocked_until = NULL,
        updated_at = NOW()
    RETURNING request_count, window_start INTO v_current_count, v_window_start;
    
    -- Check if limit exceeded
    IF v_current_count > p_max_requests THEN
        -- Block the identifier
        UPDATE public.rate_limits
        SET blocked_until = NOW() + (p_block_duration_minutes || ' minutes')::INTERVAL
        WHERE identifier = p_identifier AND endpoint = p_endpoint;
        
        RETURN FALSE; -- Rate limit exceeded
    END IF;
    
    RETURN TRUE; -- Request allowed
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Authentication & Authorization

### 1. Enhanced Middleware with Session Validation

Create `lib/auth/session.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function getServerSession() {
    const cookieStore = cookies();
    
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
        return null;
    }
    
    // Verify session is still valid in database
    const { data: user } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('id', session.user.id)
        .single();
    
    if (!user) {
        return null;
    }
    
    return {
        session,
        user,
    };
}

export async function requireAuth() {
    const sessionData = await getServerSession();
    
    if (!sessionData) {
        throw new Error('Unauthorized');
    }
    
    return sessionData;
}

export async function requireAdmin() {
    const sessionData = await requireAuth();
    
    if (sessionData.user.role !== 'admin') {
        throw new Error('Forbidden: Admin access required');
    }
    
    return sessionData;
}
```

### 2. Authorization Helper Functions

Create `lib/auth/authorization.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

export async function canAccessOrder(userId: string, orderPublicToken: string): Promise<boolean> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for this check
    );
    
    const { data: order } = await supabase
        .from('orders')
        .select('user_id, id')
        .eq('public_token', orderPublicToken)
        .single();
    
    if (!order) {
        return false;
    }
    
    // Log access attempt
    await logSecurityEvent({
        userId,
        actionType: 'order_view',
        resourceType: 'order',
        resourceId: order.id,
        publicToken: orderPublicToken,
        success: order.user_id === userId,
        failureReason: order.user_id !== userId ? 'Ownership mismatch' : null,
    });
    
    return order.user_id === userId;
}

export async function canAccessAddress(userId: string, addressPublicToken: string): Promise<boolean> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    
    const { data: address } = await supabase
        .from('addresses')
        .select('user_id, id')
        .eq('public_token', addressPublicToken)
        .single();
    
    if (!address) {
        return false;
    }
    
    await logSecurityEvent({
        userId,
        actionType: 'address_view',
        resourceType: 'address',
        resourceId: address.id,
        publicToken: addressPublicToken,
        success: address.user_id === userId,
        failureReason: address.user_id !== userId ? 'Ownership mismatch' : null,
    });
    
    return address.user_id === userId;
}

export async function canAccessPayment(userId: string, paymentPublicToken: string): Promise<boolean> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    
    const { data: payment } = await supabase
        .from('payments')
        .select('id, order:orders!inner(user_id)')
        .eq('public_token', paymentPublicToken)
        .single();
    
    if (!payment || !payment.order) {
        return false;
    }
    
    await logSecurityEvent({
        userId,
        actionType: 'payment_view',
        resourceType: 'payment',
        resourceId: payment.id,
        publicToken: paymentPublicToken,
        success: payment.order.user_id === userId,
        failureReason: payment.order.user_id !== userId ? 'Ownership mismatch' : null,
    });
    
    return payment.order.user_id === userId;
}

async function logSecurityEvent(event: {
    userId: string;
    actionType: string;
    resourceType: string;
    resourceId: string;
    publicToken: string;
    success: boolean;
    failureReason: string | null;
}) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    
    await supabase.from('security_audit_log').insert({
        user_id: event.userId,
        action_type: event.actionType,
        resource_type: event.resourceType,
        resource_id: event.resourceId,
        public_token: event.publicToken,
        success: event.success,
        failure_reason: event.failureReason,
    });
}
```

---

## Public Token System (Anti-IDOR)

### How It Works

**Problem**: Sequential IDs like `/order/123` allow attackers to enumerate orders:
```
/order/1    → Try
/order/2    → Try
/order/3    → Try
...
/order/999  → Found someone else's order!
```

**Solution**: Use cryptographically random UUIDs as public tokens:
```
/order/a7f3c8d9-4b2e-4f1a-9c8d-7e6f5a4b3c2d  → Impossible to guess
```

### Implementation Rules

1. **Never expose internal database IDs** in URLs or API responses
2. **Always use public_token** for URL parameters
3. **Resolve token → ID server-side** before database queries
4. **Verify ownership** after resolution
5. **Log all access attempts** for audit trail

### Example Flow

```typescript
// ❌ INSECURE - Exposes internal ID
app.get('/api/order/:orderId', async (req, res) => {
    const { orderId } = req.params; // Internal ID exposed!
    const order = await db.orders.findById(orderId);
    // Missing ownership check!
    res.json(order);
});

// ✅ SECURE - Uses public token
app.get('/api/order/:orderToken', async (req, res) => {
    const { orderToken } = req.params; // Public UUID
    const userId = req.user.id; // From authenticated session
    
    // 1. Resolve token to internal ID
    const order = await db.orders.findByPublicToken(orderToken);
    
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }
    
    // 2. Verify ownership
    if (order.user_id !== userId) {
        await logUnauthorizedAccess(userId, orderToken);
        return res.status(403).json({ error: 'Forbidden' });
    }
    
    // 3. Return data (without internal ID)
    res.json({
        orderToken: order.public_token,
        status: order.status,
        total: order.total_amount,
        // ... other safe fields
    });
});
```

---

## Secure Route Structure

### Public Routes (No Authentication Required)

```
/                           → Homepage
/shop                       → Product listing
/shop?category=organic      → Filtered products
/product/[slug]             → Product details (SEO-friendly slug)
/about                      → About page
/contact                    → Contact page
/login                      → Login page
/signup                     → Signup page
/forgot-password            → Password reset request
```

**Security Notes**:
- Product slugs are SEO-friendly (e.g., `/product/organic-turmeric-powder`)
- No sensitive data exposed
- Rate limit login/signup endpoints

### Authenticated User Routes (Require Login)

```
/account                                    → User dashboard
/account/profile                            → Edit profile
/account/orders                             → Order list
/account/orders/[orderToken]                → Order details (UUID token)
/account/addresses                          → Address list
/account/addresses/[addressToken]           → Edit address (UUID token)
/account/addresses/[addressToken]/delete    → Delete address
/account/wishlist                           → Wishlist
/account/security                           → Change password
/checkout                                   → Checkout flow
/checkout/payment/[orderToken]              → Payment submission
```

**Security Notes**:
- All routes protected by middleware
- UUID tokens prevent enumeration
- Ownership verified server-side
- RLS policies enforce user_id filtering

### Admin Routes (Require Admin Role)

```
/admin                          → Admin dashboard
/admin/orders                   → All orders
/admin/orders/[orderToken]      → Order management
/admin/payments                 → Payment verification queue
/admin/payments/[paymentToken]  → Verify payment
/admin/products                 → Product management
/admin/users                    → User management
/admin/audit                    → Security audit logs
```

**Security Notes**:
- Double-layer protection: middleware + RLS
- All actions logged to audit trail
- Admin role verified on every request
- CSRF tokens on state-changing operations

---

## Middleware & Guards

### Enhanced Middleware Implementation

Update `middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Rate limiting configuration
const RATE_LIMITS = {
    '/api/auth/login': { maxRequests: 5, windowMinutes: 15 },
    '/api/auth/signup': { maxRequests: 3, windowMinutes: 60 },
    '/api/order': { maxRequests: 10, windowMinutes: 1 },
    '/api/payment': { maxRequests: 5, windowMinutes: 5 },
};

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const pathname = req.nextUrl.pathname;
    
    // Get client IP for rate limiting
    const clientIp = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    
    // Initialize Supabase Client
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    
    // ============================================
    // RATE LIMITING
    // ============================================
    
    // Check rate limits for sensitive endpoints
    for (const [endpoint, limits] of Object.entries(RATE_LIMITS)) {
        if (pathname.startsWith(endpoint)) {
            const isAllowed = await checkRateLimit(
                clientIp,
                endpoint,
                limits.maxRequests,
                limits.windowMinutes
            );
            
            if (!isAllowed) {
                return new NextResponse(
                    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
                    { status: 429, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }
    }
    
    // ============================================
    // ADMIN ROUTES PROTECTION
    // ============================================
    
    if (pathname.startsWith('/admin')) {
        // Require authentication
        if (!session) {
            const url = req.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('returnTo', pathname);
            url.searchParams.set('error', 'auth_required');
            return NextResponse.redirect(url);
        }
        
        // Verify admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
        
        if (!profile || profile.role !== 'admin') {
            // Log unauthorized admin access attempt
            await logSecurityEvent(supabase, {
                user_id: session.user.id,
                action_type: 'unauthorized_access_attempt',
                resource_type: 'admin_panel',
                ip_address: clientIp,
                user_agent: req.headers.get('user-agent') || '',
                success: false,
                failure_reason: 'Insufficient privileges',
            });
            
            return new NextResponse(
                JSON.stringify({ error: 'Forbidden: Admin access required' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }
        
        // Log admin access
        await logSecurityEvent(supabase, {
            user_id: session.user.id,
            action_type: 'admin_access',
            resource_type: 'admin_panel',
            ip_address: clientIp,
            user_agent: req.headers.get('user-agent') || '',
            success: true,
        });
    }
    
    // ============================================
    // USER ROUTES PROTECTION
    // ============================================
    
    if (pathname.startsWith('/account') || pathname.startsWith('/checkout')) {
        if (!session) {
            const url = req.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('returnTo', pathname);
            return NextResponse.redirect(url);
        }
    }
    
    // ============================================
    // SECURITY HEADERS
    // ============================================
    
    // Add security headers
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('X-XSS-Protection', '1; mode=block');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=()'
    );
    
    // HTTPS enforcement in production
    if (process.env.NODE_ENV === 'production' && !req.url.startsWith('https://')) {
        res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    return res;
}

async function checkRateLimit(
    identifier: string,
    endpoint: string,
    maxRequests: number,
    windowMinutes: number
): Promise<boolean> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: identifier,
        p_endpoint: endpoint,
        p_max_requests: maxRequests,
        p_window_minutes: windowMinutes,
    });
    
    if (error) {
        console.error('Rate limit check failed:', error);
        return true; // Fail open to avoid blocking legitimate users
    }
    
    return data === true;
}

async function logSecurityEvent(supabase: any, event: any) {
    try {
        await supabase.from('security_audit_log').insert(event);
    } catch (error) {
        console.error('Failed to log security event:', error);
    }
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/account/:path*',
        '/checkout/:path*',
        '/api/:path*',
    ],
};
```

---

## Attack Prevention

### 1. IDOR (Insecure Direct Object Reference) Prevention

**Attack Scenario**:
```
User A tries to access User B's order:
GET /api/order/123  → Returns User B's order (VULNERABLE)
```

**Prevention**:
```typescript
// ✅ SECURE Implementation
export async function GET(
    req: Request,
    { params }: { params: { orderToken: string } }
) {
    const session = await requireAuth();
    const { orderToken } = params;
    
    // 1. Verify ownership
    const canAccess = await canAccessOrder(session.user.id, orderToken);
    
    if (!canAccess) {
        return NextResponse.json(
            { error: 'Order not found or access denied' },
            { status: 404 } // Use 404 instead of 403 to avoid info leakage
        );
    }
    
    // 2. Fetch order (RLS will double-check)
    const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('public_token', orderToken)
        .eq('user_id', session.user.id) // Explicit check
        .single();
    
    return NextResponse.json(order);
}
```

### 2. CSRF (Cross-Site Request Forgery) Prevention

**Attack Scenario**:
```html
<!-- Attacker's website -->
<form action="https://yoursite.com/api/order/delete" method="POST">
    <input type="hidden" name="orderToken" value="victim-order-token">
</form>
<script>document.forms[0].submit();</script>
```

**Prevention**:

Install CSRF protection:
```bash
npm install @edge-csrf/nextjs
```

Create `lib/csrf.ts`:
```typescript
import { createCsrfProtect } from '@edge-csrf/nextjs';

export const csrfProtect = createCsrfProtect({
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
    },
});
```

Use in API routes:
```typescript
import { csrfProtect } from '@/lib/csrf';

export async function POST(req: Request) {
    // Verify CSRF token
    const csrfError = await csrfProtect(req);
    if (csrfError) {
        return NextResponse.json(
            { error: 'Invalid CSRF token' },
            { status: 403 }
        );
    }
    
    // Process request...
}
```

### 3. XSS (Cross-Site Scripting) Prevention

**Attack Scenario**:
```javascript
// User submits malicious review
const review = "<script>alert('XSS')</script>";
```

**Prevention**:

1. **Input Validation**:
```typescript
import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

const reviewSchema = z.object({
    rating: z.number().min(1).max(5),
    reviewText: z.string()
        .min(10)
        .max(200)
        .refine((text) => {
            // Block script tags
            return !/<script|javascript:|onerror=/i.test(text);
        }, 'Invalid characters detected'),
});

export async function submitReview(data: unknown) {
    // 1. Validate schema
    const validated = reviewSchema.parse(data);
    
    // 2. Sanitize HTML
    const sanitized = DOMPurify.sanitize(validated.reviewText, {
        ALLOWED_TAGS: [], // No HTML allowed
        ALLOWED_ATTR: [],
    });
    
    // 3. Save to database
    await supabase.from('reviews').insert({
        review_text: sanitized,
        rating: validated.rating,
    });
}
```

2. **Output Encoding** (React does this automatically):
```tsx
// ✅ SAFE - React escapes by default
<p>{userReview}</p>

// ❌ DANGEROUS - Never use dangerouslySetInnerHTML with user input
<div dangerouslySetInnerHTML={{ __html: userReview }} />
```

### 4. SQL Injection Prevention

**Attack Scenario**:
```sql
-- Vulnerable query
SELECT * FROM orders WHERE order_id = '${userInput}';

-- Attacker input: ' OR '1'='1
SELECT * FROM orders WHERE order_id = '' OR '1'='1'; -- Returns all orders!
```

**Prevention**:

Supabase uses parameterized queries automatically:
```typescript
// ✅ SAFE - Parameterized query
const { data } = await supabase
    .from('orders')
    .select('*')
    .eq('order_id', userInput); // Automatically escaped

// ❌ DANGEROUS - Raw SQL (avoid unless necessary)
const { data } = await supabase.rpc('custom_query', {
    raw_sql: `SELECT * FROM orders WHERE order_id = '${userInput}'`
});
```

### 5. Session Hijacking Prevention

**Attack Scenario**:
- Attacker steals session cookie via XSS or network sniffing
- Attacker uses stolen cookie to impersonate user

**Prevention**:

1. **Secure Cookie Configuration**:
```typescript
// In Supabase client configuration
const supabase = createClient(url, key, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: {
            getItem: (key) => {
                // Custom storage with encryption if needed
                return localStorage.getItem(key);
            },
            setItem: (key, value) => {
                localStorage.setItem(key, value);
            },
            removeItem: (key) => {
                localStorage.removeItem(key);
            },
        },
    },
    cookies: {
        options: {
            secure: true, // HTTPS only
            httpOnly: true, // Not accessible via JavaScript
            sameSite: 'strict', // CSRF protection
            maxAge: 60 * 60 * 24 * 7, // 7 days
        },
    },
});
```

2. **Session Validation**:
```typescript
// Validate session on every sensitive operation
async function validateSession(sessionToken: string, expectedUserId: string) {
    const { data: session } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('user_id', expectedUserId)
        .eq('is_active', true)
        .single();
    
    if (!session) {
        throw new Error('Invalid session');
    }
    
    if (new Date(session.expires_at) < new Date()) {
        throw new Error('Session expired');
    }
    
    // Update last activity
    await supabase
        .from('user_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', session.id);
    
    return session;
}
```

### 6. Enumeration Attack Prevention

**Attack Scenario**:
```
Attacker tries to enumerate valid order tokens:
GET /api/order/00000000-0000-0000-0000-000000000001
GET /api/order/00000000-0000-0000-0000-000000000002
...
```

**Prevention**:

1. **Use UUIDs** (already implemented)
2. **Rate limiting** (already implemented)
3. **Consistent error messages**:

```typescript
// ❌ BAD - Reveals information
if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
}
if (order.user_id !== userId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
}

// ✅ GOOD - Same error for both cases
if (!order || order.user_id !== userId) {
    return NextResponse.json(
        { error: 'Order not found' }, // Don't reveal if it exists
        { status: 404 }
    );
}
```

---

## Implementation Code

### 1. Secure Order Details Page

Create `app/account/orders/[orderToken]/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function OrderDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const { user, loading: authLoading } = useAuth();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    const orderToken = params.orderToken as string;
    
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        
        if (user) {
            fetchOrderDetails();
        }
    }, [user, authLoading, orderToken]);
    
    const fetchOrderDetails = async () => {
        if (!user) return;
        
        setLoading(true);
        
        try {
            // Fetch order using public token
            // RLS will automatically filter by user_id
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        *,
                        product:products (
                            title_en,
                            image_url
                        )
                    ),
                    payment:payments (
                        status,
                        utr_number,
                        created_at
                    )
                `)
                .eq('public_token', orderToken)
                .eq('user_id', user.id) // Explicit ownership check
                .single();
            
            if (error) {
                console.error('Error fetching order:', error);
                
                if (error.code === 'PGRST116') {
                    // No rows returned - either doesn't exist or not owned by user
                    toast.error('Order not found');
                    router.push('/account/orders');
                    return;
                }
                
                throw error;
            }
            
            setOrder(data);
        } catch (error) {
            console.error('Failed to fetch order:', error);
            toast.error('Failed to load order details');
            router.push('/account/orders');
        } finally {
            setLoading(false);
        }
    };
    
    if (loading || authLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }
    
    if (!order) {
        return null;
    }
    
    return (
        <main className="section-padding">
            <div className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-3xl font-bold mb-6">Order Details</h1>
                
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    {/* Order Header */}
                    <div className="mb-6">
                        <p className="text-sm text-gray-500">Order ID</p>
                        <p className="text-xl font-bold">#{order.order_id}</p>
                    </div>
                    
                    {/* Order Status */}
                    <div className="mb-6">
                        <p className="text-sm text-gray-500">Status</p>
                        <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                        }`}>
                            {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                    </div>
                    
                    {/* Order Items */}
                    <div className="mb-6">
                        <h2 className="text-lg font-bold mb-4">Items</h2>
                        <div className="space-y-4">
                            {order.order_items?.map((item: any) => (
                                <div key={item.id} className="flex items-center gap-4">
                                    {item.product?.image_url && (
                                        <img
                                            src={item.product.image_url}
                                            alt={item.product_title_en}
                                            className="w-16 h-16 object-cover rounded-lg"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <p className="font-bold">{item.product_title_en}</p>
                                        <p className="text-sm text-gray-500">
                                            {item.quantity} × ₹{item.unit_price}
                                        </p>
                                    </div>
                                    <p className="font-bold">₹{item.total_price}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Shipping Address */}
                    <div className="mb-6">
                        <h2 className="text-lg font-bold mb-2">Shipping Address</h2>
                        <p>{order.shipping_name}</p>
                        <p>{order.shipping_address}</p>
                        <p>{order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}</p>
                        <p>{order.shipping_phone}</p>
                    </div>
                    
                    {/* Order Total */}
                    <div className="border-t pt-4">
                        <div className="flex justify-between mb-2">
                            <span>Subtotal</span>
                            <span>₹{order.subtotal}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                            <span>Shipping</span>
                            <span>₹{order.shipping_total}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold">
                            <span>Total</span>
                            <span>₹{order.total_amount}</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
```

### 2. Secure API Route for Order Creation

Create `app/api/orders/create/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/session';

// Validation schema
const createOrderSchema = z.object({
    addressToken: z.string().uuid(),
    items: z.array(z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().optional(),
        quantity: z.number().int().positive(),
    })).min(1),
});

export async function POST(req: NextRequest) {
    try {
        // 1. Require authentication
        const { user } = await requireAuth();
        
        // 2. Validate request body
        const body = await req.json();
        const validated = createOrderSchema.parse(body);
        
        // 3. Initialize Supabase with service role for complex operations
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        // 4. Verify address ownership
        const { data: address } = await supabase
            .from('addresses')
            .select('*')
            .eq('public_token', validated.addressToken)
            .eq('user_id', user.id)
            .single();
        
        if (!address) {
            return NextResponse.json(
                { error: 'Invalid address' },
                { status: 400 }
            );
        }
        
        // 5. Fetch and validate products
        const productIds = validated.items.map(item => item.productId);
        const { data: products } = await supabase
            .from('products')
            .select('*')
            .in('id', productIds);
        
        if (!products || products.length !== productIds.length) {
            return NextResponse.json(
                { error: 'Invalid products' },
                { status: 400 }
            );
        }
        
        // 6. Calculate totals
        let subtotal = 0;
        const orderItems = [];
        
        for (const item of validated.items) {
            const product = products.find(p => p.id === item.productId);
            if (!product) continue;
            
            let price = product.current_price;
            let variantLabel = null;
            
            // Handle variants
            if (item.variantId) {
                const { data: variant } = await supabase
                    .from('product_variants')
                    .select('*')
                    .eq('id', item.variantId)
                    .eq('product_id', product.id)
                    .single();
                
                if (variant) {
                    price = variant.price;
                    variantLabel = variant.label;
                }
            }
            
            const itemTotal = price * item.quantity;
            subtotal += itemTotal;
            
            orderItems.push({
                product_id: product.id,
                variant_id: item.variantId || null,
                variant_label: variantLabel,
                product_title_en: product.title_en,
                product_title_te: product.title_te,
                quantity: item.quantity,
                unit_price: price,
                total_price: itemTotal,
            });
        }
        
        // 7. Calculate shipping
        const shippingTotal = subtotal >= 2000 ? 0 : 50;
        const totalAmount = subtotal + shippingTotal;
        
        // 8. Generate order ID
        const orderDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const orderId = `ORD-${orderDate}-${randomSuffix}`;
        
        // 9. Create order with public token
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                order_id: orderId,
                user_id: user.id,
                shipping_name: address.name,
                shipping_phone: address.phone,
                shipping_address: address.address_line,
                shipping_pincode: address.pincode,
                shipping_city: address.city,
                shipping_state: address.state,
                subtotal,
                shipping_total: shippingTotal,
                total_amount: totalAmount,
                status: 'pending_payment',
            })
            .select()
            .single();
        
        if (orderError) {
            console.error('Order creation error:', orderError);
            return NextResponse.json(
                { error: 'Failed to create order' },
                { status: 500 }
            );
        }
        
        // 10. Create order items
        const itemsWithOrderId = orderItems.map(item => ({
            ...item,
            order_id: order.id,
        }));
        
        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsWithOrderId);
        
        if (itemsError) {
            console.error('Order items error:', itemsError);
            // Rollback order
            await supabase.from('orders').delete().eq('id', order.id);
            return NextResponse.json(
                { error: 'Failed to create order items' },
                { status: 500 }
            );
        }
        
        // 11. Create payment record
        const { error: paymentError } = await supabase
            .from('payments')
            .insert({
                order_id: order.id,
                payment_method: 'upi',
                status: 'pending',
            });
        
        if (paymentError) {
            console.error('Payment record error:', paymentError);
        }
        
        // 12. Clear user's cart
        await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id);
        
        // 13. Log order creation
        await supabase.from('security_audit_log').insert({
            user_id: user.id,
            action_type: 'order_create',
            resource_type: 'order',
            resource_id: order.id,
            public_token: order.public_token,
            success: true,
        });
        
        // 14. Return order with public token only
        return NextResponse.json({
            success: true,
            orderToken: order.public_token,
            orderId: order.order_id,
            totalAmount: order.total_amount,
        });
        
    } catch (error) {
        console.error('Order creation failed:', error);
        
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            );
        }
        
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
```

### 3. Secure Payment Submission

Create `app/api/payments/submit/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/session';

const submitPaymentSchema = z.object({
    orderToken: z.string().uuid(),
    utrNumber: z.string().min(12).max(20),
    paymentScreenshot: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
    try {
        // 1. Require authentication
        const { user } = await requireAuth();
        
        // 2. Validate input
        const body = await req.json();
        const validated = submitPaymentSchema.parse(body);
        
        // 3. Initialize Supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        // 4. Verify order ownership
        const { data: order } = await supabase
            .from('orders')
            .select('id, status, user_id')
            .eq('public_token', validated.orderToken)
            .eq('user_id', user.id)
            .single();
        
        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }
        
        if (order.status !== 'pending_payment') {
            return NextResponse.json(
                { error: 'Order is not awaiting payment' },
                { status: 400 }
            );
        }
        
        // 5. Update payment record
        const { error: paymentError } = await supabase
            .from('payments')
            .update({
                utr_number: validated.utrNumber,
                payment_screenshot_url: validated.paymentScreenshot,
                status: 'pending', // Awaiting admin verification
                updated_at: new Date().toISOString(),
            })
            .eq('order_id', order.id);
        
        if (paymentError) {
            console.error('Payment update error:', paymentError);
            return NextResponse.json(
                { error: 'Failed to submit payment' },
                { status: 500 }
            );
        }
        
        // 6. Update order status
        await supabase
            .from('orders')
            .update({
                status: 'payment_verification',
                updated_at: new Date().toISOString(),
            })
            .eq('id', order.id);
        
        // 7. Create admin notification
        await supabase.from('admin_notifications').insert({
            notification_type: 'payment_proof_submitted',
            title: 'New Payment Proof Submitted',
            message: `Payment proof submitted for order ${order.id}`,
            related_order_id: order.id,
        });
        
        // 8. Log payment submission
        await supabase.from('security_audit_log').insert({
            user_id: user.id,
            action_type: 'payment_submit',
            resource_type: 'payment',
            resource_id: order.id,
            public_token: validated.orderToken,
            success: true,
        });
        
        return NextResponse.json({
            success: true,
            message: 'Payment proof submitted successfully',
        });
        
    } catch (error) {
        console.error('Payment submission failed:', error);
        
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid payment data', details: error.errors },
                { status: 400 }
            );
        }
        
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Run all database migration scripts in Supabase SQL Editor
- [ ] Verify RLS policies are enabled on all tables
- [ ] Test public token generation for existing records
- [ ] Verify rate limiting function works
- [ ] Test audit logging functionality
- [ ] Review and update environment variables

### Environment Variables

Add to `.env.local` and Vercel:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Server-side only!

# Security
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_ENABLED=true
```

### Security Headers (Vercel)

Create `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
```

### Post-Deployment Testing

- [ ] Test user registration and login
- [ ] Verify users can only access their own orders
- [ ] Test admin panel access (admin role required)
- [ ] Attempt IDOR attack (should fail)
- [ ] Test rate limiting on login endpoint
- [ ] Verify CSRF protection on state-changing operations
- [ ] Check audit logs are being created
- [ ] Test session expiration and renewal
- [ ] Verify HTTPS enforcement
- [ ] Test payment submission flow

### Monitoring

Set up monitoring for:

- Failed authentication attempts
- Unauthorized access attempts (audit log)
- Rate limit violations
- Unusual order patterns
- Payment verification delays

---

## Summary

This implementation provides **enterprise-grade security** through:

1. **Multi-layer defense**: Middleware → Application → Database
2. **Public tokens**: UUIDs prevent enumeration attacks
3. **Strict authorization**: Ownership verified on every request
4. **Comprehensive logging**: All sensitive operations audited
5. **OWASP protection**: CSRF, XSS, SQL injection, session hijacking
6. **Rate limiting**: Prevents brute force and DoS attacks

**Remember**: Security is not a one-time implementation. Regularly review audit logs, update dependencies, and stay informed about new vulnerabilities.

---

## Support & Questions

For implementation questions or security concerns, refer to:
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)

# Enterprise Security Implementation - Quick Start Guide

## 🎯 Overview

This guide helps you implement enterprise-grade security for your e-commerce platform in a systematic way.

## 📋 Implementation Checklist

### Phase 1: Database Setup (30 minutes)

- [ ] **Step 1**: Run `SECURITY_MIGRATION_TOKENS.sql` in Supabase SQL Editor
  - Adds public_token columns to orders, addresses, payments
  - Creates indexes for performance
  - Backfills existing records
  - Sets up automatic token generation

- [ ] **Step 2**: Run `SECURITY_MIGRATION_AUDIT.sql` in Supabase SQL Editor
  - Creates security_audit_log table
  - Sets up automatic audit triggers
  - Creates security analytics views
  - Enables comprehensive logging

- [ ] **Step 3**: Verify migrations
  ```sql
  -- Check public tokens exist
  SELECT COUNT(*) FROM orders WHERE public_token IS NULL;
  SELECT COUNT(*) FROM addresses WHERE public_token IS NULL;
  SELECT COUNT(*) FROM payments WHERE public_token IS NULL;
  
  -- Should all return 0
  
  -- Check audit log is working
  SELECT * FROM security_audit_log ORDER BY created_at DESC LIMIT 10;
  ```

### Phase 2: Update Environment Variables (5 minutes)

Add to `.env.local`:

```bash
# Existing variables
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# NEW: Add service role key for server-side operations
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Security settings
NODE_ENV=development  # Change to 'production' when deploying
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **IMPORTANT**: Never commit `.env.local` to git. The service role key must be kept secret.

### Phase 3: Update Middleware (15 minutes)

The enhanced `middleware.ts` is already in your project. Review and customize:

1. **Rate Limiting Configuration**:
   ```typescript
   const RATE_LIMITS = {
       '/api/auth/login': { maxRequests: 5, windowMinutes: 15 },
       '/api/auth/signup': { maxRequests: 3, windowMinutes: 60 },
       // Add more as needed
   };
   ```

2. **Protected Routes**:
   ```typescript
   export const config = {
       matcher: [
           '/admin/:path*',      // Admin only
           '/account/:path*',    // Authenticated users
           '/checkout/:path*',   // Authenticated users
           '/api/:path*',        // All API routes
       ],
   };
   ```

### Phase 4: Update Frontend Code (1-2 hours)

#### A. Update Order Listing Page

**File**: `app/account/orders/page.tsx`

Change from:
```typescript
// ❌ OLD - Uses internal ID
<Link href={`/account/orders/${order.id}`}>
```

To:
```typescript
// ✅ NEW - Uses public token
<Link href={`/account/orders/${order.public_token}`}>
```

#### B. Create Secure Order Details Page

**File**: `app/account/orders/[orderToken]/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';

export default function OrderDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const [order, setOrder] = useState<any>(null);
    
    const orderToken = params.orderToken as string;
    
    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }
        
        fetchOrder();
    }, [user, orderToken]);
    
    const fetchOrder = async () => {
        // RLS will automatically filter by user_id
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (*),
                payment:payments (*)
            `)
            .eq('public_token', orderToken)
            .eq('user_id', user.id)
            .single();
        
        if (error || !data) {
            router.push('/account/orders');
            return;
        }
        
        setOrder(data);
    };
    
    // ... rest of component
}
```

#### C. Update Address Management

**File**: `app/account/addresses/page.tsx`

Change edit/delete links to use `address.public_token` instead of `address.id`.

### Phase 5: Create Secure API Routes (2-3 hours)

#### Example: Secure Order Creation

**File**: `app/api/orders/create/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
    try {
        // 1. Require authentication
        const { user } = await requireAuth();
        
        // 2. Validate input
        const body = await req.json();
        
        // 3. Verify ownership of resources (address, etc.)
        // 4. Create order
        // 5. Return public_token, NOT internal ID
        
        return NextResponse.json({
            success: true,
            orderToken: order.public_token,
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }
}
```

See `ENTERPRISE_SECURITY_GUIDE.md` for complete examples.

### Phase 6: Testing (1 hour)

#### Security Tests

1. **Test IDOR Prevention**:
   ```bash
   # Try to access another user's order
   # Should fail with 404 or 403
   curl http://localhost:3000/api/orders/some-other-users-token
   ```

2. **Test Rate Limiting**:
   ```bash
   # Make 10 rapid login attempts
   # Should get 429 after 5 attempts
   for i in {1..10}; do
     curl -X POST http://localhost:3000/api/auth/login
   done
   ```

3. **Test Ownership Verification**:
   - Login as User A
   - Try to access User B's order using public token
   - Should fail with "Order not found"

4. **Test Audit Logging**:
   ```sql
   -- Check audit logs in Supabase
   SELECT * FROM security_audit_log 
   WHERE action_type = 'unauthorized_access_attempt'
   ORDER BY created_at DESC;
   ```

#### Functional Tests

- [ ] User can view their own orders
- [ ] User can create new order
- [ ] User can submit payment proof
- [ ] Admin can view all orders
- [ ] Admin can verify payments
- [ ] Audit logs are created for all actions

### Phase 7: Deployment (30 minutes)

1. **Add Environment Variables to Vercel**:
   ```bash
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Deploy**:
   ```bash
   git add .
   git commit -m "Implement enterprise security"
   git push
   vercel --prod
   ```

3. **Post-Deployment Verification**:
   - [ ] HTTPS is enforced
   - [ ] Security headers are present
   - [ ] Rate limiting works
   - [ ] Audit logs are being created
   - [ ] Users can only access their own data

## 🔒 Security Best Practices

### DO ✅

- **Always use public tokens** in URLs and API responses
- **Verify ownership** on every sensitive operation
- **Log all access attempts** to audit trail
- **Use HTTPS** in production
- **Keep service role key secret** - never expose to client
- **Validate all inputs** server-side
- **Use parameterized queries** (Supabase does this automatically)
- **Enable RLS** on all tables
- **Review audit logs** regularly

### DON'T ❌

- **Never expose internal database IDs** in URLs or APIs
- **Don't trust client-side validation** alone
- **Don't use sequential IDs** for sensitive resources
- **Don't skip ownership checks** assuming RLS is enough
- **Don't commit secrets** to git
- **Don't disable HTTPS** in production
- **Don't ignore failed access attempts** in audit logs

## 📊 Monitoring & Maintenance

### Daily

- [ ] Check `security_suspicious_activity` view for unusual patterns
- [ ] Review failed login attempts
- [ ] Monitor rate limit violations

### Weekly

- [ ] Review `security_admin_actions` view
- [ ] Check for unauthorized access attempts
- [ ] Verify audit log integrity

### Monthly

- [ ] Review and archive old audit logs
- [ ] Update dependencies for security patches
- [ ] Review and update rate limits if needed
- [ ] Conduct security audit

## 🆘 Troubleshooting

### Issue: "Order not found" for valid order

**Cause**: Public token mismatch or ownership check failing

**Solution**:
1. Verify order exists: `SELECT * FROM orders WHERE public_token = 'token'`
2. Check user_id matches: `SELECT user_id FROM orders WHERE public_token = 'token'`
3. Review audit logs for failed access attempts

### Issue: Rate limiting blocking legitimate users

**Cause**: Rate limits too strict

**Solution**:
1. Review rate limit configuration in middleware
2. Increase limits for affected endpoints
3. Consider IP-based vs user-based limiting

### Issue: Audit logs not being created

**Cause**: Triggers not firing or permissions issue

**Solution**:
1. Verify triggers exist: `SELECT * FROM pg_trigger WHERE tgname LIKE 'audit%'`
2. Check RLS policies allow inserts
3. Review Supabase logs for errors

## 📚 Additional Resources

- **Main Guide**: `ENTERPRISE_SECURITY_GUIDE.md` - Complete implementation details
- **SQL Migrations**: 
  - `supabase/SECURITY_MIGRATION_TOKENS.sql`
  - `supabase/SECURITY_MIGRATION_AUDIT.sql`
- **Helper Libraries**:
  - `lib/auth/session.ts` - Server-side authentication
  - `lib/auth/authorization.ts` - Ownership verification

## 🎓 Learning Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Web Security Academy](https://portswigger.net/web-security)

## ✅ Success Criteria

Your implementation is successful when:

1. ✅ All URLs use public tokens instead of internal IDs
2. ✅ Users can only access their own data
3. ✅ Admins can access all data but actions are logged
4. ✅ Failed access attempts are logged and monitored
5. ✅ Rate limiting prevents brute force attacks
6. ✅ HTTPS is enforced in production
7. ✅ Security headers are present
8. ✅ Audit trail is comprehensive and tamper-proof

---

**Need Help?** Review the detailed examples in `ENTERPRISE_SECURITY_GUIDE.md` or check the troubleshooting section above.

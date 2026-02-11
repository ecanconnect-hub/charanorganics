# Admin Security Setup Guide

## 🔒 High-Security Admin Panel Implementation

This guide explains the comprehensive security measures implemented for the admin panel.

---

## 🎯 Security Features Implemented

### 1. **3-Hour Session Timeout** ⏱️
- Admin sessions automatically expire after 3 hours of inactivity
- Warning shown 5 minutes before expiry
- Automatic logout and redirect to login page
- Activity tracking resets timeout on user interaction

### 2. **Activity Logging & Audit Trail** 📝
- All admin actions are logged with timestamps
- Tracks:
  - Order status changes
  - Payment verifications
  - Product modifications
  - Login attempts
  - Unauthorized access attempts

### 3. **Failed Login Protection** 🛡️
- Tracks failed login attempts
- Account temporarily locked after 5 failed attempts in 15 minutes
- Automatic unlock after 15 minutes
- Prevents brute force attacks

### 4. **Strict Access Control** 🔐
- Row Level Security (RLS) policies on all tables
- Only verified admins can:
  - Update orders
  - Verify payments
  - Modify products/categories
  - View sensitive data

### 5. **Automatic Log Cleanup** 🧹
- Activity logs kept for 90 days
- Failed login attempts cleaned after 24 hours
- Prevents database bloat

---

## 📋 Setup Instructions

### Step 1: Run SQL Scripts

Execute these SQL files in your Supabase SQL Editor in this order:

1. **Admin Security Policies**
   ```sql
   -- File: supabase/admin_security_policies.sql
   -- Creates: activity logs, failed login tracking, RLS policies
   ```

2. **Order History** (if not already done)
   ```sql
   -- File: supabase/create_order_history.sql
   -- Creates: order status change tracking
   ```

### Step 2: Configure Supabase Auth Settings

In Supabase Dashboard → Authentication → Settings:

1. **Session Timeout**: Set to `10800` seconds (3 hours)
2. **Enable Email Confirmations**: Recommended
3. **Disable Sign-ups**: Only allow admin-created accounts
4. **Enable MFA** (Optional but recommended): For extra security

### Step 3: Environment Variables

No additional environment variables needed - all security is handled server-side.

### Step 4: Test the Security

1. **Test Session Timeout:**
   - Login as admin
   - Wait 3 hours (or temporarily reduce timeout for testing)
   - Should auto-logout with message

2. **Test Failed Login Protection:**
   - Try logging in with wrong password 5 times
   - Account should be locked for 15 minutes

3. **Test Activity Logging:**
   - Perform admin actions (update order, verify payment)
   - Check `admin_activity_log` table in Supabase

---

## 🔍 Monitoring Admin Activity

### View Recent Activity

Query the `recent_admin_activity` view:

```sql
SELECT * FROM recent_admin_activity
ORDER BY created_at DESC
LIMIT 50;
```

### Check Failed Login Attempts

```sql
SELECT email, COUNT(*) as attempts, MAX(attempted_at) as last_attempt
FROM failed_login_attempts
WHERE attempted_at > NOW() - INTERVAL '1 hour'
GROUP BY email
ORDER BY attempts DESC;
```

### View Order Changes

```sql
SELECT * FROM admin_activity_log
WHERE action = 'order_status_changed'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🚨 Security Best Practices

### For Admins:

1. **Use Strong Passwords**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, symbols

2. **Don't Share Credentials**
   - Each admin should have their own account
   - Never share passwords

3. **Logout When Done**
   - Always logout when finished
   - Don't leave sessions open

4. **Use Secure Networks**
   - Avoid public WiFi for admin access
   - Use VPN if accessing remotely

### For Developers:

1. **Regular Security Audits**
   - Review activity logs weekly
   - Check for suspicious patterns

2. **Keep Dependencies Updated**
   - Regularly update npm packages
   - Monitor security advisories

3. **Backup Regularly**
   - Supabase auto-backups enabled
   - Test restore procedures

4. **Monitor Error Logs**
   - Check for unusual errors
   - Investigate failed access attempts

---

## 📊 Security Metrics Dashboard

### Key Metrics to Monitor:

- **Active Admin Sessions**: Current logged-in admins
- **Failed Login Attempts**: Last 24 hours
- **Recent Admin Actions**: Last 100 actions
- **Locked Accounts**: Currently locked accounts

### SQL Queries for Metrics:

```sql
-- Failed logins in last 24 hours
SELECT COUNT(*) FROM failed_login_attempts
WHERE attempted_at > NOW() - INTERVAL '24 hours';

-- Most active admins
SELECT 
    admin_name,
    COUNT(*) as action_count
FROM recent_admin_activity
GROUP BY admin_name
ORDER BY action_count DESC;

-- Actions by type
SELECT 
    action,
    COUNT(*) as count
FROM admin_activity_log
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY action
ORDER BY count DESC;
```

---

## 🔧 Troubleshooting

### Session Expires Too Quickly
- Check Supabase auth settings
- Verify `SESSION_TIMEOUT` constant in `lib/admin/security.ts`

### Activity Not Being Logged
- Verify `admin_activity_log` table exists
- Check RLS policies allow inserts
- Check browser console for errors

### Account Locked Unexpectedly
- Check `failed_login_attempts` table
- Manually unlock: `DELETE FROM failed_login_attempts WHERE email = 'admin@example.com'`

---

## 📞 Support

For security concerns or issues:
1. Check activity logs first
2. Review Supabase logs
3. Contact system administrator

---

## ✅ Security Checklist

- [ ] SQL scripts executed successfully
- [ ] Session timeout configured (3 hours)
- [ ] Failed login protection tested
- [ ] Activity logging verified
- [ ] RLS policies active
- [ ] Admin accounts use strong passwords
- [ ] Regular log monitoring scheduled
- [ ] Backup procedures tested

---

**Last Updated**: 2026-01-22
**Security Level**: HIGH ✅

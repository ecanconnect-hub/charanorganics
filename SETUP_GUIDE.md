# 🚀 QUICK SETUP GUIDE

## ⚠️ **YOU MUST DO THIS FIRST!**

Your database is not set up yet. That's why signup is failing.

---

## **Step 1: Set Up Database (5 minutes)**

1. Go to your Supabase project: https://supabase.com/dashboard/project/frdkhfuarrgmulppqzis

2. Click **SQL Editor** (left sidebar)

3. Click **New Query**

4. Copy the ENTIRE content from `supabase/schema.sql` file

5. Paste it in the SQL Editor

6. Click **Run** (or press Ctrl+Enter)

7. Wait for "Success" message

---

## **Step 2: Create Admin Account**

### **Option A: Via Supabase Dashboard (EASIEST)**

1. In Supabase, go to **Authentication** → **Users**

2. Click **Add User** button

3. Fill in:
   - Email: `charanorganics@gmail.com`
   - Password: `Admin@123456`
   - Auto Confirm User: ✅ **CHECK THIS BOX**

4. Click **Create User**

5. Go back to **SQL Editor** and run:
```sql
-- Make this user an admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'charanorganics@gmail.com';
```

### **Option B: Via Website (After database is set up)**

1. Go to http://localhost:3000/signup

2. Sign up with:
   - Email: `charanorganics@gmail.com`
   - Password: `Admin@123456`
   - Name: Charan Organics

3. Go to Supabase SQL Editor and run:
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'charanorganics@gmail.com';
```

---

## **Step 3: Login**

1. Go to http://localhost:3000/login

2. Login with:
   - Email: `charanorganics@gmail.com`
   - Password: `Admin@123456`

3. Access admin panel: http://localhost:3000/admin

---

## **Step 4: Add Your First Product**

1. Go to http://localhost:3000/admin/products

2. Click **+ Add New Product**

3. Fill in the form and save!

---

## ✅ **THAT'S IT!**

After these steps:
- ✅ Database will be set up
- ✅ Admin account will work
- ✅ You can add products
- ✅ Platform will be fully functional

---

## 🆘 **TROUBLESHOOTING**

**If signup still fails:**
- Make sure you ran the SQL schema
- Check Supabase logs for errors
- Try Option A (create user directly in Supabase)

**If you can't access admin panel:**
- Make sure you ran the UPDATE query to set role = 'admin'
- Check the profiles table in Supabase

---

**START WITH STEP 1 - RUN THE DATABASE SCHEMA!**

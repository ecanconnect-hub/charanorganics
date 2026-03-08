# Charan Organics - User Manual

Welcome to the Charan Organics E-Commerce Platform user manual. This document provides step-by-step instructions on how to use the platform as a customer and how to manage it as an administrator.

---

## 🛍️ 1. Customer Guide

This section explains how customers can browse, shop, and manage their orders.

### 1.1 Browsing Products
- **Homepage:** View featured sections, new arrivals, and popular items.
- **Shop Page:** Browse all available products. Use filters or categories to find specific items (e.g., Skincare, Haircare, Supplements).
- **Language Switcher:** Click the language button in the header to switch between English and Telugu (తెలుగు) at any time.

### 1.2 Cart and Checkout
- **Adding to Cart:** Click "Add to Cart" on any product page or product card. You can do this as a guest (without logging in).
- **Viewing Cart:** Click the cart icon in the top right corner to review your items, update quantities, or remove items.
- **Checkout:** 
  1. Click "Proceed to Checkout" in the cart.
  2. If you are not logged in, you will be prompted to log in or create an account to securely save your order and shipping details.
  3. Enter your final shipping address.
  4. Review your order total, including shipping and any applied coupons.

### 1.3 Making a Payment (UPI)
Charan Organics uses a manual UPI payment system for secure, fee-free transactions.
1. At the payment step, a QR code and UPI ID will be displayed.
2. Open your preferred UPI app (GPay, PhonePe, Paytm, etc.) and scan the QR code or send the exact amount to the displayed UPI ID.
3. After completing the payment on your app, take a screenshot of the success screen or note down the UTR/Reference number.
4. On the checkout page, upload the screenshot or enter the UTR number and submit.
5. Your order will be placed with a "Pending Verification" status until the admin confirms receipt of the funds.

### 1.4 Managing Orders
- Go to the **Orders** page (accessible from your account menu).
- Here you can view all past orders, check their current status (e.g., Pending, Confirmed, Shipped, Delivered), and view order details.

---

## ⚙️ 2. Administrator Guide

This section is for store owners and managers who have Admin access.

### 2.1 Accessing the Admin Panel
1. Log in with your admin email account.
2. Navigate to the `/admin` route or click the "Admin Dashboard" link in your account menu.
3. *Note: If you cannot access the admin panel, ensure your profile role is set to `admin` in the Supabase database.*

### 2.2 Admin Dashboard
The dashboard provides a high-level overview of your store's performance:
- **Total Revenue:** Total sales from confirmed orders.
- **Total Orders:** Number of orders placed.
- **Active Customers:** Number of registered users.
- **Recent Orders:** A quick list of the latest orders needing attention.

### 2.3 Managing Products
Go to **Admin > Products** to manage your inventory.
- **Add a Product:** Click "Add Product". Fill in the details:
  - Product Title (English & Telugu)
  - Description (English & Telugu)
  - Price (MRP & Selling Price)
  - Stock Quantity & Units (e.g., kg, grams, pieces)
  - Images (uploaded to Cloudinary)
  - Categories/Tags
- **Edit/Delete:** Click the edit icon next to any product to update its details, stock, or price. Use the delete button to remove it entirely.

### 2.4 Managing Categories
Go to **Admin > Categories** to organize your store.
- Create new categories (like "Hair Care", "Organic Powders").
- Provide translations for category names in Telugu.
- Assign existing products to these categories to help customers find them easily.

### 2.5 Managing Orders and Payments
Go to **Admin > Orders** to process customer purchases.
- **View Orders:** See a list of all orders, sortable by date and status.
- **Verify Payments:** 
  1. Find orders marked as "Pending Verification".
  2. Click on the order to view the customer's uploaded payment screenshot or UTR number.
  3. Verify the transaction in your bank/UPI app.
  4. If payment is received, click "Verify Payment" to change the status to "Confirmed".
  5. If payment is invalid, you can reject it and the customer will be notified to try again.
- **Update Order Status:** As you process the order, update the status from "Confirmed" -> "Processing" -> "Shipped" -> "Delivered". Customers can track these changes.

### 2.6 Managing Homepage Sections
Go to **Admin > Sections** to customize the shop layout.
- Create dynamic sections (e.g., "Trending Now", "Summer Essentials").
- Add specific products to these sections to highlight them to customers on the homepage.

---

## ❓ 3. Frequently Asked Questions (FAQ)

**Q: How do I change the admin password?**
A: Since login uses magic links or Google Auth, you don't need a password. Ensure your email account is secure.

**Q: A customer made a mistake in their address. How do I fix it?**
A: As an admin, locate their order in the Orders tab and you can manually update the shipping details, or contact the customer directly.

**Q: The site is not translating to Telugu properly.**
A: Ensure that when you add Products and Categories in the Admin panel, you fill out both the English (`Title EN`) and Telugu (`Title TE`) fields. If left blank, the site may fall back to English.

---
*For technical setup and deployment instructions, please refer to the `README.md` file.*

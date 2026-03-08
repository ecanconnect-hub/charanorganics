# Charan Organics - Visual User Manual

This document provides simple flowcharts to understand how the Charan Organics platform works for both Customers and Administrators.

---

## 🛍️ 1. Customer Shopping Flow
How a customer browses the website, adds items to their cart, and places an order.

```mermaid
graph TD
    A([Home Page / Shop Page]) --> B[Browse Products]
    B --> C[View Product Details]
    C --> D[Add to Cart]
    D --> E[Open Cart]
    E --> F[Proceed to Checkout]
    F --> G{Logged in?}
    G -- No --> H[Login / Create Account]
    H --> I[Enter Shipping Address]
    G -- Yes --> I
    I --> J[Review Order Total]
    J --> K([Proceed to Payment])
```

---

## 💸 2. Customer Payment Flow (UPI)
How a customer completes their payment using UPI and uploads proof.

```mermaid
graph TD
    A([Checkout Payment Step]) --> B[System shows UPI ID & QR Code]
    B --> C[Customer opens their UPI App<br>GPay, PhonePe, Paytm]
    C --> D[Customer pays exact amount]
    D --> E[Customer takes a Screenshot<br>or copies UTR Number]
    E --> F[Return to Charan Organics Website]
    F --> G[Upload Screenshot / Enter UTR]
    G --> H[Submit Order]
    H --> I([Order Status: Pending Verification])
```

---

## 👑 3. Administrator: Order Fulfillment Flow
How the admin receives a new order, verifies the payment, and ships the products.

```mermaid
graph TD
    A([Customer submits Order]) --> B[Admin Dashboard]
    B --> C[Go to 'Orders' tab]
    C --> D[Find order 'Pending Verification']
    D --> E[Check Bank / UPI App for money]
    E --> F{Payment Received?}
    F -- No --> G[Reject Payment]
    G --> H([Customer notified to try again])
    F -- Yes --> I[Click 'Verify Payment']
    I --> J[Order Status: Confirmed]
    J --> K[Pack the Order]
    K --> L[Update Status to 'Shipped']
    L --> M([Order Delivered])
```

---

## 📦 4. Administrator: Product Management Flow
How the admin adds new products to the store.

```mermaid
graph TD
    A([Admin Dashboard]) --> B[Go to 'Products' tab]
    B --> C[Click 'Add Product']
    C --> D[Enter Details<br>English & Telugu Titles/Descriptions]
    D --> E[Set Price & Stock Quantity]
    E --> F[Upload Images]
    F --> G[Select Categories]
    G --> H[Save Product]
    H --> I([Product is now live on Shop Page])
```

# Charan Organics - E-Commerce Platform

A production-ready, premium-quality e-commerce website for organic and ayurvedic products, built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## 🌿 Features

### Customer Features
- ✅ **Multi-language Support**: English + Telugu (తెలుగు)
- ✅ **Guest & Authenticated Shopping**: Cart works without login
- ✅ **UPI Payment System**: Mobile deep links + Desktop QR codes
- ✅ **Product Browsing**: Dynamic sections controlled by admin
- ✅ **Order Tracking**: Real-time order status updates
- ✅ **Recently Browsed**: Personalized product recommendations
- ✅ **Responsive Design**: Mobile-first, works on all devices
- ✅ **Premium UI**: Modern, trustworthy design with smooth animations

### Admin Features
- ✅ **Product Management**: Full CRUD with multi-language support
- ✅ **Section Management**: Create dynamic homepage sections
- ✅ **Order Management**: View, update, and track all orders
- ✅ **Payment Verification**: Manual UPI payment verification
- ✅ **In-app Notifications**: Real-time alerts for new orders/payments
- ✅ **Analytics Dashboard**: User stats, order metrics
- ✅ **Content Management**: Edit site content in both languages

### Security Features
- ✅ **Row Level Security (RLS)**: Supabase database protection
- ✅ **Rate Limiting**: IP-based and endpoint-specific limits
- ✅ **Input Validation**: Zod schemas for all user inputs
- ✅ **OWASP Compliance**: Following security best practices
- ✅ **Secure API Keys**: Environment variable management

## 🚀 Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Payments**: UPI (manual verification)
- **Deployment**: Vercel
- **i18n**: next-intl

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- Vercel account (for deployment)
- UPI ID for payments

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd charanorganics
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Copy the entire contents of `supabase/schema.sql`
4. Paste and run it in the SQL Editor

This will create:
- All database tables
- Row Level Security (RLS) policies
- Triggers and functions
- Initial data

### 3. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Supabase credentials:
   - Go to **Project Settings** → **API** in Supabase dashboard
   - Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

3. Add your UPI details:
   ```env
   NEXT_PUBLIC_UPI_ID=your-upi-id@bank
   NEXT_PUBLIC_UPI_NAME=Charan Organics
   ```

### 4. Create Admin User

1. Run the development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000)

3. Sign up with your admin email

4. Go to Supabase **SQL Editor** and run:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'your-admin-email@example.com';
   ```

### 5. Add Sample Products (Optional)

You can add products through the admin panel at `/admin/products` or via SQL:

```sql
-- Generate a product ID
SELECT generate_product_id();

-- Insert a sample product
INSERT INTO public.products (
  product_id,
  title_en,
  title_te,
  description_en,
  description_te,
  mrp,
  current_price,
  shipping_charges,
  stock_quantity
) VALUES (
  'ORG-0001',
  'Organic Neem Powder',
  'సేంద్రీయ వేప పొడి',
  'Pure organic neem powder for skin and hair care',
  'చర్మం మరియు జుట్టు సంరక్షణ కోసం స్వచ్ఛమైన సేంద్రీయ వేప పొడి',
  299.00,
  249.00,
  40.00,
  100
);
```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Production Build
```bash
npm run build
npm start
```

## 📦 Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin your-repo-url
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (your Vercel domain)
   - `NEXT_PUBLIC_UPI_ID`
   - `NEXT_PUBLIC_UPI_NAME`
5. Click **Deploy**

### 3. Update Supabase Settings

1. Go to **Authentication** → **URL Configuration**
2. Add your Vercel domain to **Site URL**
3. Add `https://your-domain.vercel.app/**` to **Redirect URLs**

## 📚 Project Structure

```
charanorganics/
├── app/                      # Next.js App Router
│   ├── (customer)/          # Customer-facing pages
│   │   ├── page.tsx         # Home page
│   │   ├── shop/            # Product listing
│   │   ├── product/         # Product details
│   │   ├── cart/            # Shopping cart
│   │   ├── checkout/        # Checkout flow
│   │   └── orders/          # Order history
│   ├── (admin)/             # Admin panel
│   │   ├── dashboard/       # Analytics dashboard
│   │   ├── products/        # Product management
│   │   ├── sections/        # Section management
│   │   ├── orders/          # Order management
│   │   └── settings/        # Site settings
│   ├── api/                 # API routes
│   │   ├── auth/            # Authentication
│   │   ├── products/        # Product operations
│   │   ├── cart/            # Cart operations
│   │   ├── orders/          # Order operations
│   │   └── payments/        # Payment verification
│   ├── globals.css          # Global styles
│   └── layout.tsx           # Root layout
├── components/              # Reusable components
│   ├── ui/                  # UI components
│   ├── layout/              # Layout components
│   ├── product/             # Product components
│   └── admin/               # Admin components
├── lib/                     # Utilities and helpers
│   ├── supabase/            # Supabase client
│   ├── utils/               # Utility functions
│   ├── validation/          # Zod schemas
│   └── middleware/          # Middleware functions
├── messages/                # i18n translations
│   ├── en.json              # English
│   └── te.json              # Telugu
├── supabase/                # Database schema
│   └── schema.sql           # Complete database setup
└── public/                  # Static assets
```

## 🔐 Security Best Practices

### Environment Variables
- ✅ Never commit `.env.local` to version control
- ✅ Use different Supabase projects for dev/prod
- ✅ Rotate service role keys periodically
- ✅ Keep UPI credentials secure

### Database Security
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Policies enforce user access control
- ✅ Admin role required for sensitive operations
- ✅ Input validation on all endpoints

### Rate Limiting
- ✅ Login: 5 attempts per 15 minutes
- ✅ Signup: 3 attempts per hour
- ✅ Orders: 10 per minute
- ✅ API calls: Endpoint-specific limits

## 📖 Key Workflows

### Product Lifecycle
1. Admin creates product with multi-language content
2. Auto-generated unique product ID (ORG-XXXX)
3. Product assigned to sections
4. Visible on homepage and shop page
5. Users can browse and add to cart

### Order Lifecycle
1. User adds products to cart (guest or logged-in)
2. Login required at checkout
3. User enters shipping details
4. Order created with unique ID (ORD-YYYYMMDD-XXX)
5. UPI payment link/QR generated
6. User submits payment proof (screenshot/UTR)
7. Admin receives notification
8. Admin verifies payment
9. Order status updated
10. User can track order

### Payment Verification Flow
1. User completes UPI payment
2. User uploads screenshot OR enters UTR number
3. Payment status: "Pending Verification"
4. Admin notification created
5. Admin reviews payment proof
6. Admin verifies or rejects
7. If verified: Order status → "Confirmed"
8. If rejected: User can resubmit proof

## 🎨 Customization

### Colors
Edit `app/globals.css` to change the color scheme:
```css
:root {
  --primary: 34 139 34;      /* Forest Green */
  --secondary: 139 69 19;    /* Saddle Brown */
  --accent: 218 165 32;      /* Goldenrod */
}
```

### Content
Edit site content through admin panel or directly in database:
```sql
UPDATE public.site_content
SET content_en = 'Your new content',
    content_te = 'మీ కొత్త కంటెంట్'
WHERE content_key = 'hero_title';
```

### Fonts
Update Google Fonts import in `app/globals.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=YourFont&display=swap');
```

## 🐛 Troubleshooting

### Issue: "Missing Supabase environment variables"
**Solution**: Ensure `.env.local` exists with all required variables

### Issue: "RLS policy violation"
**Solution**: Check if user has correct role in `profiles` table

### Issue: "Payment QR not generating"
**Solution**: Verify UPI ID format in environment variables

### Issue: "Admin panel not accessible"
**Solution**: Update user role to 'admin' in database

## 📞 Support

For issues or questions:
1. Check this README
2. Review database schema comments
3. Check Supabase logs
4. Review browser console for errors

## 📄 License

This project is proprietary software for Charan Organics.

## 🙏 Acknowledgments

Built with:
- Next.js
- Supabase
- Tailwind CSS
- Framer Motion
- next-intl

---

**Made with ❤️ for Charan Organics**

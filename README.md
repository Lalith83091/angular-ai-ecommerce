# Angular AI Storefront

A responsive Angular shopping demo built with standalone components, Angular Router, CSS, and Supabase authentication.

## Run the application

Install dependencies once, then start the development server:

```bash
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200). Angular reloads the page when source files change.

## Project structure

- `src/app/shared/` contains the reusable header, footer, image-and-text section, and image fallback directive.
- `src/app/home/` contains the homepage hero and featured storefront sections.
- `src/app/auth/` contains Supabase authentication, signup, login, password reset, and route protection.
- `src/app/products/` contains the DummyJSON product model/service, reusable product card, featured products, listing, and detail pages.
- `src/app/cart/` contains the cart page and a service that stores signed-in users' cart items in Supabase; a signed-out cart stays in memory and merges into the account when the user signs in.
- `src/app/wishlist/` contains the signed-in user's Supabase-backed wishlist page and service.
- `src/app/orders/` contains the protected demo checkout, atomic order creation service, order confirmation, and order history.
- `src/app/profile/` contains the protected profile and account settings.
- `src/app/pages/` contains About, Services, Contact, and account placeholder pages.
- `src/app/app.routes.ts` maps URLs to standalone page components.

## Supabase setup (authentication phase)

1. Create a free project from the Supabase dashboard. Choose an organization, project name, database password, and region; save the database password securely.
2. In the project dashboard, open **Project Settings → API Keys** (or **Data API / API** in the dashboard version you see). Copy the **Project URL** and the **publishable key**. A legacy `anon` public key is also suitable if your project only shows that key.
3. Paste those two public values into `supabaseUrl` and `supabasePublishableKey` in `src/environments/environment.ts`. These values are intended to be present in a browser app. **Never put a service-role or secret key in Angular or commit one to source control.**
4. In **Authentication → URL Configuration**, set the local Site URL to `http://localhost:4200` and add `http://localhost:4200/**` to the allowed Redirect URLs. Enable email confirmations under **Authentication → Providers → Email** if you want signups to confirm their addresses.
5. In **SQL Editor**, open the files in `supabase/migrations/` in filename order, review them, and run each against your project. The first creates a profile row when an auth user is created; the second defines user-owned cart, wishlist, and order tables with RLS; the third adds a transaction-safe order function that also clears the signed-in user's cart.
6. Run `npm start`, open the app, and test signup, email confirmation (if enabled), login, password reset, and logout. Supabase's supported client manages the session; the app does not save passwords or manually manage tokens.

The database migration and the Angular auth client are separate pieces: the browser only uses the public project URL/key, while RLS protects user-owned database rows. All three migrations must be applied for the full authentication, saved-cart, wishlist, checkout, and order-history features. Signed-out carts are temporary and stay in memory, then merge into the account when the user signs in. Do not expose service-role keys or use product prices/stock as trusted order data.

The order tables intentionally let customers create a placed order and its line items, but do not grant customers permission to update or delete existing orders. Checkout calls an authenticated, security-invoker SQL function so order, line items, and cart clearing happen together under the same database transaction. This is a demo schema, not a payment system; DummyJSON pricing and stock are sample data and are not authoritative.

## Product API

The homepage, product listing, and product detail pages use the free [DummyJSON Products API](https://dummyjson.com/docs/products). Product prices are displayed in USD. The listing uses API pagination and sorting when possible; search results are filtered, sorted, and paginated in the browser so combined filters stay consistent. DummyJSON product prices and stock are sample data, not authoritative inventory or checkout values.

## Test and build

```bash
npm test -- --watch=false
npm run build
```

# KML Order Management SaaS

Production-ready SaaS web application for selling prepaid credits, collecting customer KML uploads, and managing manual Surfer-based delivery workflows.

Important: this platform **never processes KML files automatically**. It only stores uploaded files, tracks orders, manages payments, and lets the admin download files for manual work outside the website.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- NextAuth
- Stripe
- Docker and Docker Compose

## Core Features

- Customer registration, login, logout, forgot password, and reset password
- Role-based access for customer and admin dashboards
- Credit-based billing model with fixed packages: `100`, `250`, `500`, `1000` TL
- Fixed per-upload charge stored as a configurable constant
- Secure KML upload validation
- Stored file metadata and order tracking
- Admin order management and secure KML download
- Internal notifications on order status changes and payment events
- Stripe checkout and webhook processing
- Prisma schema, seed, migration, Docker, and deployment docs

## Project Structure

```text
kml-order-saas/
├─ prisma/
│  ├─ migrations/
│  ├─ schema.prisma
│  └─ seed.ts
├─ public/
├─ src/
│  ├─ actions/
│  ├─ app/
│  ├─ components/
│  ├─ lib/
│  └─ types/
├─ uploads/
├─ .env.example
├─ Dockerfile
├─ docker-compose.yml
└─ README.md
```

## Environment Variables

Copy `.env.example` to `.env` and update the values.

Required:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `APP_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `DESKTOP_AGENT_API_KEY`

Optional:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `UPLOAD_DIR`
- `DEFAULT_KML_PRICE`

## Local Installation

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
cp .env.example .env
```

3. Update `DATABASE_URL` to point to your PostgreSQL instance.

4. Generate Prisma client:

```bash
npm run prisma:generate
```

5. Apply the initial migration:

```bash
npm run prisma:deploy
```

For development you can also use:

```bash
npm run prisma:migrate
```

6. Seed the admin user:

```bash
npm run prisma:seed
```

7. Start the app:

```bash
npm run dev
```

8. Open:

```text
http://localhost:3000
```

## Database Models

The Prisma schema includes:

- `User`
- `Admin`
- `Order`
- `Payment`
- `CreditTransaction`
- `UploadedFile`
- `Session`
- `Account`
- `VerificationToken`
- `PasswordResetToken`
- `Notification`

## Credit System

- Customers do not pay per order directly.
- They buy credit packages using Stripe.
- Each KML upload deducts `DEFAULT_KML_PRICE` credits.
- The default charge is `50 TL`.
- Every balance mutation is written to `CreditTransaction`.

## Upload Rules

- Only `.kml`
- Max size: `50 MB`
- Extension validation
- MIME validation
- File size validation
- Duplicate prevention by SHA-256 hash per user

Stored files follow this structure:

```text
uploads/
└─ user-id/
   └─ generated-file-name.kml
```

The database stores:

- generated filename
- original filename
- absolute file path
- size
- MIME type
- hash
- user relationship
- order relationship
- upload date

## Order Workflow

1. Customer buys credits.
2. Customer uploads KML.
3. Website stores the file.
4. Website creates an order with status `Pending`.
5. Website deducts 50 credits.
6. Admin downloads the KML.
7. Admin processes the file manually in Surfer outside the site.
8. Admin marks the order as `Processing`, `Completed`, or `Cancelled`.

## Stripe Setup

1. Create a Stripe account.
2. Add your keys to `.env`.
3. Configure the webhook endpoint:

```text
http://localhost:3000/api/stripe/webhook
```

4. Subscribe at minimum to:

- `checkout.session.completed`
- `checkout.session.expired`
- `checkout.session.async_payment_failed`

5. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

Example local webhook forwarding:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Windows Desktop Agent API

The desktop agent authenticates with:

- `X-API-Key` request header
- `DESKTOP_AGENT_API_KEY` environment variable

Implemented endpoints:

- `GET /api/desktop-agent/orders/pending`
- `GET /api/desktop-agent/orders/:id/file`
- `POST /api/desktop-agent/orders/:id/downloaded`

The pending response includes:

- `orderId`
- `filename`
- `downloadUrl`
- `uploadedAt`

Example desktop agent configuration:

```text
BaseUrl=http://localhost:3000
X-API-Key=<DESKTOP_AGENT_API_KEY>
```

## Running with Docker

1. Copy `.env.example` to `.env`
2. Update Stripe and auth secrets
3. Start the stack:

```bash
docker compose up --build
```

The stack includes:

- `app`: Next.js application
- `db`: PostgreSQL 16

Docker volumes:

- `postgres_data`
- `uploads_data`

## Authentication Notes

- Credentials-based auth via NextAuth
- Passwords hashed with `bcryptjs`
- Route protection via middleware and server-side guards
- Forgot/reset password flow included
- Optional email sending via SMTP

## Security Notes

- Protected admin routes and file downloads
- Same-origin checks for mutating requests
- Basic in-memory rate limiting
- File type and file size validation
- Duplicate upload prevention
- Sensitive values stored in environment variables

## Production Deployment

1. Provision PostgreSQL.
2. Set all production environment variables.
3. Build the application:

```bash
npm run build
```

4. Run migrations:

```bash
npm run prisma:deploy
```

5. Seed the initial admin if needed:

```bash
npm run prisma:seed
```

6. Start the server:

```bash
npm run start
```

Recommended production additions:

- real SMTP provider
- HTTPS termination via reverse proxy
- centralized logging
- persistent backups for database and uploads

## Verification Commands

```bash
npm run prisma:generate
npm run typecheck
npm run lint
npm run build
```

## Admin Workflow Summary

- View all uploaded KML files
- Filter by status, date, and search terms
- Search by customer name, email, order number, and filename
- Download KML files securely
- Change order statuses
- Delete invalid uploads and refund credits
- Review customer balances and payment history

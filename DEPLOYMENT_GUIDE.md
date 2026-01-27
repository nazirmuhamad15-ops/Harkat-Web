# 🚀 Harkat Furniture - Deployment Guide

Complete guide for deploying Harkat Furniture to production.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
- [Main Application Deployment](#main-application-deployment)
- [WhatsApp Bot Deployment](#whatsapp-bot-deployment)
- [Post-Deployment](#post-deployment)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ **PostgreSQL Database** (Supabase, Neon, or Railway)
- ✅ **Domain Name** (optional but recommended)
- ✅ **SSL Certificate** (Let's Encrypt via Caddy or platform-provided)
- ✅ **API Keys**:
  - Google Maps API
  - Resend (Email)
  - IPaymu (Payment)
  - Komerce/RajaOngkir (Shipping)
- ✅ **Cloud Storage** (AWS S3 or Cloudflare R2)

---

## Database Setup

### Option 1: Supabase (Recommended)

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for provisioning (~2 minutes)

2. **Get Connection Strings**
   - Navigate to **Settings → Database**
   - Copy **Connection Pooling** URL (for `DATABASE_URL`)
   - Copy **Direct Connection** URL (for `DIRECT_URL`)

3. **Configure Connection**
   ```env
   DATABASE_URL="postgresql://postgres.xxx:password@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.xxx:password@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
   ```

### Option 2: Neon

1. **Create a Neon Project**
   - Go to [neon.tech](https://neon.tech)
   - Create a new project
   - Select region closest to your users

2. **Get Connection String**
   ```env
   DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
   DIRECT_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
   ```

### Option 3: Railway

1. **Create PostgreSQL Service**
   ```bash
   railway add postgresql
   ```

2. **Get Connection String**
   ```bash
   railway variables
   ```

---

## Environment Configuration

### 1. Create Production `.env`

Copy `.env.example` to `.env.production`:

```bash
cp .env.example .env.production
```

### 2. Update All Variables

**Critical Variables:**
```env
# Database
DATABASE_URL="your-production-database-url"
DIRECT_URL="your-production-direct-url"

# Authentication
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://yourdomain.com"

# WhatsApp Bot
WHATSAPP_SERVICE_URL="https://your-bot-service.railway.app"

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-api-key"

# Email
RESEND_API_KEY="re_your_api_key"
EMAIL_FROM="admin@yourdomain.com"

# Payment
IPAYMU_API_KEY="your-production-api-key"
IPAYMU_VA="your-production-va"
IPAYMU_SANDBOX="false"  # IMPORTANT: Set to false!

# Shipping
KOMERCE_SHIPPING_KEY="your-key"
KOMERCE_DELIVERY_KEY="your-key"
RAJAONGKIR_API_KEY="your-key"
```

### 3. Generate Secure Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate API keys (if needed)
openssl rand -hex 32
```

---

## Main Application Deployment

### Option 1: Vercel (Recommended for Next.js)

#### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

#### Step 2: Login
```bash
vercel login
```

#### Step 3: Deploy
```bash
# First deployment
vercel

# Production deployment
vercel --prod
```

#### Step 4: Configure Environment Variables
```bash
# Add variables via CLI
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
# ... add all other variables

# Or use Vercel Dashboard:
# https://vercel.com/your-project/settings/environment-variables
```

#### Step 5: Configure Build Settings
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

#### Step 6: Run Migrations
```bash
# Connect to production database locally to push schema
# Note: Vercel serverless functions don't run migrations easily.
# Do this from your local machine pointing to prod DB:
DATABASE_URL="your-production-url" npm run db:push
```

---

### Option 2: Railway

#### Step 1: Install Railway CLI
```bash
npm i -g @railway/cli
```

#### Step 2: Login
```bash
railway login
```

#### Step 3: Initialize Project
```bash
railway init
```

#### Step 4: Add PostgreSQL
```bash
railway add postgresql
```

#### Step 5: Set Environment Variables
```bash
railway variables set NEXTAUTH_SECRET="your-secret"
railway variables set NEXTAUTH_URL="https://your-app.railway.app"
# ... set all other variables
```

#### Step 6: Deploy
```bash
railway up
```

#### Step 7: Run Migrations
```bash
railway run npm run db:push
```

---

### Option 3: Docker + VPS

#### Step 1: Create Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Drizzle client
RUN npm run db:generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Step 2: Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=your-password
      - POSTGRES_DB=harkat
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    restart: unless-stopped

volumes:
  postgres_data:
  caddy_data:
  caddy_config:
```

#### Step 3: Configure Caddy (Reverse Proxy)

```caddyfile
# Caddyfile
yourdomain.com {
    reverse_proxy app:3000
    
    encode gzip
    
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        X-XSS-Protection "1; mode=block"
    }
}
```

#### Step 4: Deploy
```bash
# Build and run
docker-compose up -d

# Run migrations
docker-compose exec app npm run db:push

# View logs
docker-compose logs -f app
```

---

## WhatsApp Bot Deployment

The WhatsApp bot should be deployed **separately** from the main app.

### Option 1: Railway (Recommended)

#### Step 1: Create New Project
```bash
railway init harkat-whatsapp-bot
```

#### Step 2: Configure Nixpacks
Railway uses Nixpacks. Ensure `package.json` has `tsx` in `dependencies` (not `devDependencies`) and `start` script is `npm run start:bot`.

#### Step 3: Set Environment Variables
```bash
railway variables set DATABASE_URL="your-database-url"
railway variables set GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-key"
```

#### Step 4: Deploy
```bash
railway up
```

#### Step 5: Scan QR Code
1. Wait for deployment to finish.
2. Open the **Deploy Logs** in Railway dashboard.
3. You will see the QR code printed in the terminal.
4. Alternatively, open the **Public URL** followed by `/qr` (e.g., `https://bot.railway.app/qr`) to scan visually.

#### Step 6: Update Main App
Copy the Railway Service URL and update `WHATSAPP_BOT_URL` in your main Next.js app's `.env`.
```env
WHATSAPP_BOT_URL="https://your-bot-production.up.railway.app"
```

---

### Option 2: Koyeb

#### Step 1: Create Koyeb Account
- Go to [koyeb.com](https://koyeb.com)
- Create account and add payment method

#### Step 2: Deploy via GitHub
1. Connect your GitHub repository
2. Select `src/bot/index.ts` as entry point
3. Set build command: `npm install && npm run build`
4. Set run command: `npm run bot`

#### Step 3: Configure Environment Variables
Add all required variables in Koyeb dashboard

#### Step 4: Deploy
Click **Deploy** and wait for service to start

---

## Post-Deployment

### 1. Run Database Migrations

```bash
# If using Vercel/Railway
npx prisma migrate deploy

# If using Docker
docker-compose exec app npx prisma migrate deploy
```

### 2. Seed Initial Data

```bash
# Create admin user
npx tsx scripts/create-admin.ts

# Create categories
npx tsx scripts/seed-categories.ts

# Create shipping rates
npx tsx scripts/seed-shipping-rates.ts
```

### 3. Test Critical Flows

- ✅ User registration and login
- ✅ Product browsing
- ✅ Add to cart
- ✅ Checkout process
- ✅ Payment (test mode)
- ✅ Order tracking
- ✅ WhatsApp notifications
- ✅ Admin dashboard access
- ✅ Driver app functionality

### 4. Configure Domain (if using custom domain)

#### Vercel
```bash
vercel domains add yourdomain.com
```

#### Railway
1. Go to project settings
2. Add custom domain
3. Update DNS records:
   ```
   CNAME: www → your-app.railway.app
   A: @ → Railway IP
   ```

### 5. Enable HTTPS

- **Vercel/Railway**: Automatic SSL via Let's Encrypt
- **Docker + Caddy**: Automatic via Caddy
- **Manual**: Use Certbot for Let's Encrypt

---

## Monitoring & Maintenance

### 1. Set Up Monitoring

#### Sentry (Error Tracking)
```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

#### Vercel Analytics
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 2. Database Backups

#### Supabase
- Automatic daily backups (Pro plan)
- Manual backup: Project Settings → Database → Backups

#### Railway
```bash
# Manual backup
railway run pg_dump > backup.sql

# Restore
railway run psql < backup.sql
```

### 3. Log Monitoring

```bash
# Vercel
vercel logs

# Railway
railway logs

# Docker
docker-compose logs -f app
```

### 4. Performance Monitoring

- **Vercel Speed Insights**: Automatic
- **Google Analytics**: Add tracking code
- **Lighthouse**: Regular audits

---

## Troubleshooting

### Issue: Database Connection Timeout

**Solution:**
```env
# Add connection pooling parameters
DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=10"
```

### Issue: WhatsApp Bot Not Sending Messages or "Offline"

**Checklist:**
1. ✅ **Bot Status**: Check `/status` endpoint (should return `connected` or `scanning`).
2. ✅ **QR Code**: If status is `scanning`, go to `/qr` to scan the code.
3. ✅ **Initialization**: Ensure `wa.initialize()` is NOT called manually if using `new Client()` (fixed in v1.2.0).
4. ✅ **Connection Event**: Ensure `wa.on('connection')` handles the object payload `{ status, qr }` correctly.
5. ✅ **Environment**: Check `WHATSAPP_BOT_URL` in main app matches Railway URL.

### Issue: Payment Webhook Not Working

**Checklist:**
1. ✅ Webhook URL is publicly accessible
2. ✅ IPaymu webhook URL is configured correctly
3. ✅ Signature verification is working
4. ✅ Check webhook logs in IPaymu dashboard

### Issue: Build Fails on Vercel

**Common Causes:**
- Missing environment variables
- Prisma client not generated
- TypeScript errors

**Solution:**
```bash
# Add to package.json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && next build"
  }
}
```

### Issue: Images Not Loading

**Solution:**
```typescript
// next.config.ts
const config = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-bucket.r2.cloudflarestorage.com',
      },
    ],
  },
};
```

---

## Security Checklist

Before going live:

- ✅ Change all default passwords
- ✅ Set `IPAYMU_SANDBOX="false"`
- ✅ Use strong `NEXTAUTH_SECRET`
- ✅ Enable HTTPS
- ✅ Configure CORS properly
- ✅ Set up rate limiting
- ✅ Enable database SSL
- ✅ Review environment variables
- ✅ Test payment flows in production mode
- ✅ Set up monitoring and alerts

---

## Rollback Procedure

If deployment fails:

### Vercel
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback <deployment-url>
```

### Railway
```bash
# Redeploy previous version
railway rollback
```

### Docker
```bash
# Stop current containers
docker-compose down

# Checkout previous version
git checkout <previous-commit>

# Rebuild and deploy
docker-compose up -d --build
```

---

## Performance Optimization

### 1. Enable Caching

```typescript
// next.config.ts
const config = {
  experimental: {
    optimizeCss: true,
  },
  compress: true,
};
```

### 2. Optimize Images

```typescript
// Use next/image
import Image from 'next/image';

<Image
  src="/chair.jpg"
  width={500}
  height={500}
  alt="Chair"
  priority // For above-the-fold images
/>
```

### 3. Database Indexing

```prisma
// prisma/schema.prisma
model Order {
  // ...
  @@index([status])
  @@index([paymentStatus])
  @@index([trackingNumber])
}
```

### 4. Enable CDN

- Vercel: Automatic global CDN
- Cloudflare: Add site to Cloudflare
- Custom: Configure CloudFront or Fastly

---

## Scaling Considerations

### Horizontal Scaling

- **Vercel**: Automatic scaling
- **Railway**: Increase replicas in settings
- **Docker**: Use Docker Swarm or Kubernetes

### Database Scaling

- **Connection Pooling**: Use PgBouncer (Supabase includes this)
- **Read Replicas**: For high-traffic sites
- **Caching**: Redis for session storage

### File Storage

- **Cloudflare R2**: Unlimited bandwidth
- **AWS S3**: Use CloudFront CDN
- **Image Optimization**: Use Next.js Image Optimization API

---

## Support & Resources

- **Documentation**: `/docs` folder
- **API Reference**: `API_DOCUMENTATION.md`
- **Security Guide**: `SECURITY_IMPLEMENTATION_GUIDE.md`
- **Email**: admin@harkatfurniture.web.id

---

**Last Updated: January 25, 2026**

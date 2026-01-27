# 🚀 Deploying to Vercel

This guide outlines the steps to deploy the Harkat Furniture e-commerce platform to [Vercel](https://vercel.com), the recommended platform for Next.js applications.

## Prerequisites

1.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
2.  **GitHub Repository**: Ensure your project is pushed to a GitHub repository.
3.  **Database**: A hosted PostgreSQL database.
    *   *Recommendation*: Use **Supabase** or **Neon** for best compatibility.

---

## 🛠 Step-by-Step Deployment

### 1. Database Setup (Cloud)

Before deploying the app, you need a cloud database.

**Using Supabase:**
1.  Create a new project on [Supabase.com](https://supabase.com).
2.  Go to **Project Settings** -> **Database**.
3.  Copy the **Connection String** (use the Transaction Pooler mode (port 6543) for best performance with Serverless functions).
    *   It looks like: `postgres://[user]:[password]@[host]:6543/[db]?pgbouncer=true`

### 2. Configure Environment Variables

Vercel requires environment variables to be set in the dashboard. Prepare these values:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Your PostgreSQL Connection String | `postgres://user:pass@host:6543/db?pgbouncer=true` |
| `NEXTAUTH_SECRET` | Secret key for Auth | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Application URL | `https://your-project.vercel.app` (Add this AFTER deployment) |
| `GOOGLE_CLIENT_ID` | OAuth Client ID (Optional) | `...` |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret (Optional) | `...` |
| `RESEND_API_KEY` | Email Service | `re_...` |
| `NEXT_PUBLIC_APP_URL` | Public URL for SEO/OG | `https://your-project.vercel.app` |

### 3. Deploy in Vercel

1.  Go to the **Vercel Dashboard** and click **"Add New..."** -> **"Project"**.
2.  Import your **GitHub Repository**.
3.  In the **Configure Project** screen:
    *   **Framework Preset**: Next.js
    *   **Root Directory**: `./` (default)
    *   **Build Command**: `next build` (or `npm run build`) - *Vercel detects this automatically*.
    *   **Environment Variables**: Paste the variables from Step 2.
4.  Click **Deploy**.

### 4. Post-Deployment Setup

Once the deployment is complete:

1.  **Get the URL**: Vercel will assign a domain like `harkat-furniture.vercel.app`.
2.  **Update Variables**:
    *   Go to Vercel Project Settings -> Environment Variables.
    *   Add/Update `NEXTAUTH_URL` with your new domain: `https://harkat-furniture.vercel.app`.
    *   Update `NEXT_PUBLIC_APP_URL` similarly.
    *   **Redeploy** (Go to Deployments -> Redeploy) for changes to take effect.

3.  **Run Migrations**:
    You cannot run `bun run db:push` directly on Vercel's serverless environment easily during build without setting up post-install scripts carefully.
    
    **Recommended method**: Run migrations locally against your *production* database url.
    
    ```bash
    # On your local machine
    # Create a temporary .env.production file or just export the vars
    export DATABASE_URL="your-production-database-url"
    
    # Run Drizzle Push
    npm run db:push
    ```

---

## ⚡ Performance Optimization on Vercel

Included in this project are several optimizations for Vercel:

1.  **Edge Runtime**: Some API routes are configured to run on the Edge (e.g., middleware).
2.  **Image Optimization**: Next.js Image component is automatically optimized by Vercel's Image Optimization API.
3.  **Caching**: API routes and Server Components use standard Fetch API caching headers (`stale-while-revalidate`).

## ⚠️ Known Issues & Troubleshooting

*   **Function Timeout**: If you see "Task timed out", extensive database operations might be taking too long. Vercel Hobby plan has a 10s limit. Pro plan has 60s.
    *   *Solution*: Optimize queries or move heavy tasks (like generating reports) to background jobs (using QStash or Inngest).
*   **Database Connection Limit**: Serverless functions can exhaust DB connections.
    *   *Solution*: **CRITICAL**: Use a Connection Pooler (Supabase Transaction Pooler or Neon). Your `DATABASE_URL` should end in `?pgbouncer=true` if using Supabase.

---

## 🔄 CI/CD

Vercel automatically sets up CI/CD.
*   Push to `main` branch -> Deploys to Production.
*   Push to other branches -> Deploys Preview environments.

You can verify changes in Preview environments before merging to main.

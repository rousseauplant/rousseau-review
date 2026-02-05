# Vercel Deployment Guide

## Step 1: Push Code to GitHub

1. Create a new GitHub repository (e.g., `rousseau-review`)
2. Push the code:

```bash
cd /mnt/okcomputer/output/app
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/rousseau-review.git
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Vercel Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "Add New Project"
3. Import your `rousseau-review` repository
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variables:

| Name | Value |
|------|-------|
| `SUPABASE_URL` | `https://qklqyzpvbdlgbapgqvtl.supabase.co` |
| `SUPABASE_SERVICE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrbHF5enB2YmRsZ2JhcGdxdnRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMyMjY3MCwiZXhwIjoyMDg1ODk4NjcwfQ.JwUUUw9i2O5Xzpcjt0J1X6cXGJ5phGP5k0sDHhELF4M` |
| `CLOUDINARY_CLOUD_NAME` | `dk7tsjufx` |
| `CLOUDINARY_API_KEY` | `733518541169956` |
| `CLOUDINARY_API_SECRET` | `At6bRFwAnDzM9zTnB1XKv0MT2GM` |

6. Click "Deploy"

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## Step 3: Add Custom Domain

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add `review.rousseauplant.care`
4. Vercel will give you DNS records to add

### DNS Configuration (in your domain registrar)

Add these DNS records:

| Type | Name | Value |
|------|------|-------|
| A | review | 76.76.21.21 |
| CNAME | www.review | cname.vercel-dns.com |

Or if using Cloudflare:

| Type | Name | Value | Proxy Status |
|------|------|-------|--------------|
| CNAME | review | cname.vercel-dns.com | DNS only (grey cloud) |

## Step 4: Update Frontend Environment Variables

In Vercel dashboard, add these additional env vars for the frontend:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://qklqyzpvbdlgbapgqvtl.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrbHF5enB2YmRsZ2JhcGdxdnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjI2NzAsImV4cCI6MjA4NTg5ODY3MH0.WqvSvLD8eVhL-Fyfp4UE1f0ReGlbWWRkhpwvmDBbcHk` |
| `VITE_CLOUDINARY_CLOUD_NAME` | `dk7tsjufx` |
| `VITE_API_URL` | `https://review.rousseauplant.care` |

Then redeploy:
- Vercel dashboard → Deployments → Redeploy

## Step 5: Test Everything

1. Visit `https://review.rousseauplant.care`
2. Create a test cover
3. Check gallery shows the cover
4. Test report functionality

## Troubleshooting

### Images not uploading?
- Check Cloudinary API secret is correct
- Check Cloudinary dashboard for upload errors

### Covers not saving?
- Check Supabase schema is correct
- Check browser console for errors
- Verify SUPABASE_SERVICE_KEY is correct

### Domain not working?
- DNS can take up to 48 hours to propagate
- Check Vercel domain settings for verification status
- Ensure DNS records match exactly what Vercel provides

## Files Included

- `app/` - Complete React application
- `supabase_schema.sql` - Database schema
- `.env` - Environment variables (already configured)
- `vercel.json` - Vercel deployment config

## Cost Summary

| Service | Free Tier | Your Usage |
|---------|-----------|------------|
| Vercel | 100GB bandwidth | ✓ Free |
| Supabase | 500MB DB, 2GB storage | ✓ Free |
| Cloudinary | 25GB storage | ✓ Free |

**Total: $0/month** (until you exceed free tiers)

## Next Steps After Deployment

1. **Run Supabase schema** - Execute `supabase_schema.sql` in your Supabase SQL Editor
2. **Test the full flow** - Create a cover, view gallery, test report
3. **Embed in Shopify** - Add iframe to your store
4. **Monitor usage** - Check Vercel/Supabase dashboards

Need help? Let me know!
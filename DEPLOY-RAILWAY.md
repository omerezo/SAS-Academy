# Railway Deployment Guide for SAS Academy

## Prerequisites
- Railway account (railway.app)
- GitHub account (or use Railway CLI)

## Option 1: Deploy via GitHub (Recommended)

### Step 1: Push code to GitHub
```bash
# If not already a git repo
git init
git add .
git commit -m "Initial commit for Railway deployment"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/sas-academy.git
git push -u origin main
```

### Step 2: Connect to Railway
1. Go to [railway.app](https://railway.app) and login
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your GitHub repo
4. Railway will auto-detect Node.js

### Step 3: Add Environment Variables
In Railway project → "Variables" tab, add:

| Variable | Value |
|----------|-------|
| DATABASE_URL | Your Supabase connection string |
| SESSION_SECRET | Generate a random string |
| SUPABASE_URL | https://gxxtwgjictessduvcypv.supabase.co |
| SUPABASE_SERVICE_KEY | Your service role key |
| NODE_ENV | production |

### Step 4: Deploy
Click "Deploy" and wait for build to complete.

---

## Option 2: Deploy via Railway CLI

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login
```bash
railway login
```

### Step 3: Initialize Project
```bash
railway init
# Follow prompts - select "Empty Project" or connect to GitHub
```

### Step 4: Add Environment Variables
```bash
railway variables set DATABASE_URL="your-supabase-url"
railway variables set SESSION_SECRET="your-secret"
railway variables set SUPABASE_URL="https://gxxtwgjictessduvcypv.supabase.co"
railway variables set SUPABASE_SERVICE_KEY="your-key"
railway variables set NODE_ENV=production
```

### Step 5: Deploy
```bash
railway up
```

---

## Database Setup on Railway (Optional)

If you want to use Railway's PostgreSQL instead of Supabase:

1. In Railway dashboard → "New" → "Database" → "PostgreSQL"
2. Wait for it to provision
3. Get connection string from "Connect" → "Connection String"
4. Use that for DATABASE_URL

Note: You'll need to run the SQL schema on Railway's database:
```bash
railway run psql -c "$(cat supabase-schema.sql)"
```

---

## Get Your Supabase Connection String

Your current Supabase URL format:
```
postgres://postgres:Daan2014@()!@db.gxxtwgjictessduvcypv.supabase.co:5432/postgres
```

**Note:** The password contains special characters `@()!`. You may need to URL-encode them:
- `@` → `%40`
- `(` → `%28`
- `)` → `%29`
- `!` → `%21`

So it becomes:
```
postgres://postgres:Daan2014%40%28%29%21@db.gxxtwgjictessduvcypv.supabase.co:5432/postgres
```

---

## After Deployment

1. Visit your Railway URL (format: `https://your-project-name.up.railway.app`)
2. Login with default credentials:
   - Username: `admin`
   - Password: `admin123`
3. Change the admin password in Settings

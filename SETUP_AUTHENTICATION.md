# 🔐 Authentication Setup Guide

## Issue: "Failed to Fetch" Error on Login

**Root Cause:** Missing Supabase environment variables

**Impact:** Authentication system cannot connect to Supabase backend

---

## ✅ Solution (5 Minutes)

### Step 1: Create .env File

```bash
cp .env.template .env
```

Or copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### Step 2: Get Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project (or create a new one)
3. Navigate to **Settings** → **API**
4. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string, ~200+ characters)

### Step 3: Configure .env File

Edit `/home/user/Wilbur/.env` and add your credentials:

```bash
# REQUIRED - Replace with your actual Supabase credentials
VITE_SUPABASE_URL=https://your-actual-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANT:**
- Replace `your-actual-project` with your real project reference
- Replace the entire key with your actual anon key
- Do NOT commit `.env` to git (it's already in .gitignore)

### Step 4: Validate Configuration

```bash
npm run validate:env
```

You should see:
```
✅ ENVIRONMENT VALIDATION PASSED
Your application is properly configured and ready to run.
```

### Step 5: Restart Dev Server

```bash
# Stop your current dev server (Ctrl+C)
npm run dev
```

---

## 🧪 Test Authentication

1. Open your browser to `http://localhost:5173`
2. Navigate to `/auth`
3. Try logging in with your credentials
4. You should **NOT** see "Failed to fetch" anymore

---

## 📋 Validation Checklist

Run this command anytime to verify your setup:

```bash
node scripts/validate-env.mjs
```

**Expected output when configured correctly:**
```
✅ VITE_SUPABASE_URL: CONFIGURED
✅ VITE_SUPABASE_ANON_KEY: CONFIGURED
✅ ENVIRONMENT VALIDATION PASSED
```

---

## 🐛 Troubleshooting

### Still Getting "Failed to Fetch"?

1. **Check .env file exists:**
   ```bash
   ls -la .env
   ```

2. **Verify credentials are correct:**
   ```bash
   cat .env | grep VITE_SUPABASE
   ```

3. **Ensure no placeholder values:**
   - ❌ `VITE_SUPABASE_URL=https://your-project-ref.supabase.co`
   - ✅ `VITE_SUPABASE_URL=https://abc123xyz.supabase.co`

4. **Restart dev server:**
   - Vite only reads .env on startup
   - Stop and restart: `Ctrl+C` then `npm run dev`

5. **Check browser console:**
   - Open DevTools (F12)
   - Look for specific error messages
   - Should see Supabase connection logs

### CORS Errors?

If you see CORS errors:
1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add your local dev URL: `http://localhost:5173`
3. Add any production URLs

### Wrong Project?

If credentials are for a different project:
1. Verify you're using the correct Supabase project
2. Check database tables exist (`rooms`, `users`, `sessions`)
3. Verify RLS policies are configured

---

## 📁 File Structure

```
/home/user/Wilbur/
├── .env                          ← Your actual credentials (DO NOT COMMIT)
├── .env.example                  ← Template with placeholders
├── .env.template                 ← Alternative template
├── scripts/validate-env.mjs      ← Validation script
├── SETUP_AUTHENTICATION.md       ← This file
└── src/
    ├── lib/supabase.ts          ← Reads VITE_SUPABASE_* vars
    └── store/authStore.ts       ← Authentication state management
```

---

## 🔒 Security Notes

✅ **SAFE to commit:**
- `.env.example`
- `.env.template`
- `scripts/validate-env.mjs`
- This setup guide

❌ **NEVER commit:**
- `.env` (contains real credentials)
- Any file with actual Supabase URL/keys

---

## 📞 Support

If authentication still doesn't work after following this guide:

1. Run validation: `npm run validate:env`
2. Check browser console for errors
3. Verify Supabase project is active
4. Confirm you're using the correct credentials

---

## ✅ Success Criteria

When properly configured, you should be able to:

- ✅ Visit `/auth` without errors
- ✅ Enter email and password
- ✅ Submit login form
- ✅ See authentication succeed (no "failed to fetch")
- ✅ Get redirected to home page when logged in
- ✅ See your user session persisted across page refreshes

---

**Last Updated:** November 15, 2025
**Microsoft Enterprise Standard:** L68+ Production-Ready

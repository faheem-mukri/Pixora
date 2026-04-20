# 🚀 Vercel Deployment Checklist

## Before You Start
- [ ] Code pushed to GitHub (with all recent changes)
- [ ] Have your Pexels API key ready
- [ ] Project is running locally without errors

## Step 1: Setup MongoDB Atlas (2-3 min)
- [ ] Create MongoDB Atlas account
- [ ] Create free cluster
- [ ] Add IP to whitelist (0.0.0.0/0 for now)
- [ ] Create database user
- [ ] Copy connection string
- [ ] Save the URI somewhere safe

## Step 2: Deploy Backend on Railway (5-10 min)
- [ ] Create Railway account (connect GitHub)
- [ ] Create new project from repo
- [ ] Set root directory to `backend/`
- [ ] Add environment variables:
  - [ ] `MONGODB_URI` (from Atlas)
  - [ ] `PEXELS_API_KEY`
  - [ ] `JWT_SECRET` (generate random string)
  - [ ] `FRONTEND_URL` (leave as placeholder for now)
  - [ ] `NODE_ENV=production`
- [ ] Deploy
- [ ] Copy Railway URL (format: `https://pixora-xxx.up.railway.app`)
- [ ] Test backend health: `https://your-railway-url/api/health`

## Step 3: Deploy Frontend on Vercel (5-10 min)
- [ ] Create Vercel account (connect GitHub)
- [ ] Import repository
- [ ] Set root directory to `frontend/`
- [ ] Add environment variable:
  - [ ] `REACT_APP_API_URL=https://your-railway-url.railway.app`
- [ ] Deploy
- [ ] Get Vercel URL (format: `https://pixora-xxx.vercel.app`)

## Step 4: Connect Frontend & Backend (2 min)
- [ ] Go to Railway dashboard
- [ ] Update `FRONTEND_URL` to your Vercel URL
- [ ] Redeploy backend (Railway auto-redeploys)

## Step 5: Test Your App (5 min)
- [ ] Open Vercel URL in browser
- [ ] Sign up with test account
- [ ] Search for images
- [ ] View recommendations
- [ ] Check browser console for errors
- [ ] Check backend logs for issues

## Debugging Common Issues
If something doesn't work:

1. **CORS Errors in Browser**
   - [ ] Check `FRONTEND_URL` in Railway matches Vercel URL exactly
   - [ ] Redeploy backend after changing variables

2. **Cannot Connect to MongoDB**
   - [ ] Verify `MONGODB_URI` is correct
   - [ ] Check MongoDB Atlas IP whitelist

3. **Blank/Loading Frontend Page**
   - [ ] Check Vercel deployment logs
   - [ ] Verify `REACT_APP_API_URL` is set
   - [ ] Make sure root directory is `frontend/`

4. **API Returns 404**
   - [ ] Verify backend is deployed and running
   - [ ] Check backend logs in Railway

## After Successful Deployment
- [ ] Update GitHub README with live URL
- [ ] Test all main features
- [ ] Monitor Railway usage (free tier limits)
- [ ] Set up custom domain (optional)
- [ ] Share your live app! 🎉

---

## Helpful Links
- Railway Dashboard: https://railway.app
- Vercel Dashboard: https://vercel.app
- MongoDB Atlas: https://mongodb.com/cloud/atlas
- Backend Logs: Railway → Your Project → Deployments
- Frontend Logs: Vercel → Your Project → Deployments

## Emergency: Rollback
If deployment breaks:
- Vercel: Click "Previous Deployments" → click a green checkmark to go back
- Railway: Click "Rollback" in deployments tab

---
**Total Time: ~20-30 minutes** ⏱️

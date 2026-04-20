# Pixora Vercel Deployment Guide

This guide covers deploying your MERN stack Pixora app to Vercel. Since Vercel is primarily a frontend hosting platform, we'll deploy the frontend on Vercel and the backend on a separate service.

## 🎯 Deployment Architecture

```
┌─────────────────┐
│   Vercel DNS    │
│   (Frontend)    │
└────────┬────────┘
         │
┌────────▼──────────────────┐
│  Vercel (React App)        │
│  - /public                 │
│  - /src                    │
└────────┬───────────────────┘
         │ (API calls)
         │
    ┌────▼────────────┐
    │ Backend API     │
    │ (Railway/Render)│
    └────┬────────────┘
         │
    ┌────▼──────────────┐
    │ MongoDB Atlas      │
    └───────────────────┘
```

## Prerequisites

1. **GitHub Account** - Your code must be on GitHub
2. **Vercel Account** - Sign up at vercel.com
3. **MongoDB Atlas Account** - Free cluster at mongodb.com/cloud/atlas
4. **Backend Hosting** - Railway.app or Render.com (cheap/free options)
5. **Environment Variables** - Pexels API key, JWT secret, etc.

---

## Step 1: Prepare MongoDB Atlas

### Setup MongoDB Atlas (Cloud Database)

1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Sign up or login
3. Create a new project
4. Create a free cluster (M0)
5. Add current IP to whitelist (or allow 0.0.0.0/0 for development)
6. Create database user (save credentials)
7. Copy the connection string:
   - Click "Connect" → "Drivers"
   - Copy the MongoDB URI: `mongodb+srv://username:password@cluster.mongodb.net/pixora?retryWrites=true&w=majority`

**Save this URI** - you'll need it for the backend.

---

## Step 2: Deploy Backend

### Option A: Deploy Backend on Railway (Recommended)

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your pixora repository
5. Click "Add Variables" and set:
   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pixora?retryWrites=true&w=majority
   PEXELS_API_KEY=your_pexels_api_key
   JWT_SECRET=your_super_secret_key
   FRONTEND_URL=https://your-domain.vercel.app
   NODE_ENV=production
   ```
6. Set the root directory to `backend/`
7. Click "Deploy"
8. **Copy the Railway URL** (e.g., `https://pixora-backend-prod.up.railway.app`)

### Option B: Deploy Backend on Render.com

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New+" → "Web Service"
4. Select your pixora repository
5. Configure:
   - **Name**: pixora-backend
   - **Root Directory**: backend
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
6. Add environment variables (same as Railway above)
7. Choose "Free" plan
8. Click "Create Web Service"
9. **Copy the Render URL**

**You now have:** Backend API running + MongoDB connected

---

## Step 3: Push Code to GitHub

```bash
# If not already done
git remote add origin https://github.com/yourusername/pixora.git
git push -u origin main
```

---

## Step 4: Configure Frontend for Production

Before deploying to Vercel, update your frontend to use the backend API URL.

### Update frontend/.env.production

Create or update `frontend/.env.production`:

```env
REACT_APP_API_URL=https://your-backend-url.railway.app
```

Replace `https://your-backend-url.railway.app` with your actual backend URL from Step 2.

### Check frontend/.env.example

Your existing `.env.example` should look like:

```env
REACT_APP_API_URL=http://localhost:5000
```

---

## Step 5: Deploy Frontend on Vercel

### Method 1: Vercel Web Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Select "Import Git Repository"
4. Find and import your pixora repo
5. Configure project:
   - **Framework**: React
   - **Root Directory**: frontend
   - **Build Command**: `npm run build`
   - **Output Directory**: build
   - **Environment Variables**: Add:
     ```
     REACT_APP_API_URL=https://your-backend-url.railway.app
     ```
6. Click "Deploy"
7. **Get your Vercel URL** (e.g., `https://pixora.vercel.app`)

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod

# Add environment variables when prompted
```

---

## Step 6: Update Backend CORS

Once you have your Vercel URL, update the backend's allowed origins.

### Update Railway/Render Variables

Go to your Railway/Render dashboard and update:

```
FRONTEND_URL=https://yourusername.vercel.app
```

This allows your frontend to make API calls to the backend.

---

## Step 7: Verify Deployment

1. Visit your Vercel URL: `https://yourusername.vercel.app`
2. Sign up / log in
3. Test the search functionality
4. Check browser console for errors

If you see CORS errors:
- Verify `FRONTEND_URL` is set correctly in backend
- Check that `MONGODB_URI` is valid in backend
- Verify Pexels API key is correct

---

## Environment Variables Checklist

### Backend (Railway/Render)
- [ ] `MONGODB_URI` - Your MongoDB Atlas connection string
- [ ] `PEXELS_API_KEY` - Your Pexels API key
- [ ] `JWT_SECRET` - A secure random string
- [ ] `FRONTEND_URL` - Your Vercel deployment URL
- [ ] `NODE_ENV=production`
- [ ] `PORT=5000` (usually auto-set)

### Frontend (Vercel)
- [ ] `REACT_APP_API_URL` - Your backend URL (Railway/Render)

---

## Troubleshooting

### CORS Errors
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**Fix**: Check `FRONTEND_URL` in backend environment variables matches Vercel URL

### MongoDB Connection Error
```
MongoDB connection error
```
**Fix**:
- Verify `MONGODB_URI` is correct
- Ensure IP whitelist includes your backend's IP (or use 0.0.0.0/0)

### API 404 Errors
```
Cannot POST /api/auth/login
```
**Fix**: Verify `REACT_APP_API_URL` in frontend .env matches backend URL

### Blank Frontend Page
1. Check Vercel build logs for errors
2. Make sure root directory is set to `frontend/`
3. Check `.env.production` has correct API URL

---

## Scaling & Optimization

### Free Tier Limits
- **Vercel Frontend**: 100 deployments/month, unlimited bandwidth
- **Railway Backend**: 50 free hours/month (upgrade as needed)
- **MongoDB Atlas**: 512MB storage (free tier)

### Upgrade When Needed
- Switch Railway to paid plan if you exceed free hours
- MongoDB: Upgrade to M2 cluster if exceeding storage/performance
- Vercel: Automatic scaling (pay as you go)

---

## Custom Domain (Optional)

1. Buy domain from Namecheap, GoDaddy, etc.
2. In Vercel dashboard → Settings → Domains
3. Add your custom domain
4. Follow DNS configuration instructions

---

## Post-Deployment Checklist

- [ ] Frontend loads on Vercel URL
- [ ] Can sign up / login
- [ ] Search functionality works
- [ ] Recommendations page loads
- [ ] Image details page works
- [ ] No CORS errors in console
- [ ] No MongoDB connection errors in backend logs

---

## Useful Links

- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)
- [Environment Variables Best Practices](https://12factor.net/config)

---

**Your app is now live on the internet!** 🎉

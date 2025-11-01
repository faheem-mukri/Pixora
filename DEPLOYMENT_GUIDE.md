# 🚢 Pixora Deployment Guide

Complete step-by-step guide to deploy Pixora to production.

## Deployment Architecture

```
Frontend (Vercel) → Backend (Railway) → MongoDB Atlas
```

---

## Part 1: Prepare Your Code

### 1.1 Create GitHub Repository

```bash
cd pixora
git init
git add .
git commit -m "Initial commit: Pixora Pinterest clone"
git branch -M main
git remote add origin https://github.com/yourusername/pixora.git
git push -u origin main
```

### 1.2 Verify .gitignore

Ensure `.gitignore` includes:
```
node_modules/
.env
.env.local
```

Never commit `.env` files with real API keys!

---

## Part 2: Setup MongoDB Atlas (Cloud Database)

### 2.1 Create Account

1. Go to [mongodb.com/cloud](https://www.mongodb.com/cloud/atlas)
2. Sign up with email
3. Create free account

### 2.2 Create Database Cluster

1. Click "Build a Database"
2. Choose **FREE** tier
3. Select region close to you
4. Click "Create Cluster"
5. Wait 5-10 minutes for creation

### 2.3 Create Database User

1. Click "Security" → "Database Access"
2. Click "Add New Database User"
3. Set username: `pixora_user`
4. Set password: `strong_random_password_here`
5. Click "Add User"

### 2.4 Allow Network Access

1. Click "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Confirm

### 2.5 Get Connection String

1. Go to "Clusters"
2. Click "Connect"
3. Choose "Drivers"
4. Copy connection string
5. Replace `<password>` with your password
6. Replace `<user>` with `pixora_user`

Example:
```
mongodb+srv://pixora_user:password123@cluster0.xxxxx.mongodb.net/pixora?retryWrites=true&w=majority
```

---

## Part 3: Deploy Backend (Railway)

### 3.1 Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign up with GitHub

### 3.2 Deploy from GitHub

1. Click "Create Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account
4. Select `pixora` repository
5. Railway auto-detects Node.js

### 3.3 Configure Environment Variables

1. Go to Project Settings
2. Click "Variables"
3. Add these variables:

```
PORT=5000
MONGODB_URI=mongodb+srv://pixora_user:password123@cluster0.xxxxx.mongodb.net/pixora
PEXELS_API_KEY=your_pexels_key
JWT_SECRET=generate_a_strong_random_string_here
NODE_ENV=production
```

Generate strong JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.4 Deploy

1. Railway auto-deploys when you push to GitHub
2. Go to "Deployments" tab
3. Wait for build to complete (shows green ✓)
4. Click deployment to see logs
5. Railway generates a URL like: `https://pixora-backend.up.railway.app`

### 3.5 Test Backend

Open in browser:
```
https://pixora-backend.up.railway.app/api/test
```

Should show: `{"message":"Backend is working!"}`

---

## Part 4: Deploy Frontend (Vercel)

### 4.1 Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Authorize Vercel

### 4.2 Import Project

1. Click "Add New..." → "Project"
2. Select your GitHub repository
3. Vercel auto-detects React
4. Click "Deploy"

### 4.3 Configure Environment Variables

Before deployment:

1. In Project Settings → "Environment Variables"
2. Add variable:

```
REACT_APP_API_URL=https://pixora-backend.up.railway.app
```

(Replace with your actual Railway URL)

### 4.4 Re-deploy with Variables

1. Go to "Deployments"
2. Click "Redeploy" on latest deployment
3. Wait for build to complete

Vercel generates URL like: `https://pixora.vercel.app`

### 4.5 Test Frontend

1. Visit `https://pixora.vercel.app`
2. Click "Sign Up"
3. Create test account
4. Search for images
5. Check recommendations work

---

## Part 5: Production Checklist

### Backend (.env)
- [ ] `MONGODB_URI` points to MongoDB Atlas
- [ ] `PEXELS_API_KEY` is valid
- [ ] `JWT_SECRET` is strong random string
- [ ] `NODE_ENV=production`
- [ ] `PORT=5000`

### Frontend
- [ ] `REACT_APP_API_URL` points to Railway backend
- [ ] No hardcoded localhost URLs
- [ ] Build succeeds without warnings

### Security
- [ ] `.env` files in `.gitignore`
- [ ] API keys never committed
- [ ] JWT secret is strong
- [ ] MongoDB has network restrictions (optional: limit to Railway IP)

---

## Part 6: Continuous Deployment

### Auto-Deploy on Push

Both Railway and Vercel auto-deploy when you push to GitHub:

```bash
# Make changes locally
git add .
git commit -m "Fix: Update recommendations logic"
git push origin main

# Watch deployments happen automatically!
```

---

## Part 7: Monitoring & Logs

### Railway Backend Logs

1. Go to Railway project
2. Click "Logs" tab
3. See real-time backend logs

### Vercel Frontend Logs

1. Go to Vercel project
2. Click "Deployments"
3. Click latest deployment
4. View build logs and runtime logs

---

## Part 8: Custom Domain (Optional)

### Add Domain to Vercel

1. Go to Vercel project → "Settings" → "Domains"
2. Enter your domain
3. Add DNS records to domain registrar
4. Vercel provides exact DNS settings

Example:
```
CNAME pixora.yourdomain.com → cname.vercel-dns.com
```

---

## 🔗 Your Live URLs

After deployment:

- **Frontend**: `https://pixora.vercel.app`
- **Backend API**: `https://pixora-backend.up.railway.app`
- **Database**: MongoDB Atlas (private, no public URL needed)

---

## 🚨 Troubleshooting

### Frontend shows blank page
- Check browser console for errors (F12)
- Verify `REACT_APP_API_URL` environment variable
- Clear browser cache and reload

### Backend API errors
- Check Railway logs for error messages
- Verify environment variables in Railway
- Check MongoDB Atlas connection string

### Search not working
- Verify Pexels API key is valid
- Check rate limits (free tier: 45 requests/hour)
- See Railway logs for API errors

### Authentication failing
- Verify `JWT_SECRET` is same in backend
- Check cookies/localStorage cleared
- Sign up again

### Database connection error
- Verify MongoDB Atlas cluster is running
- Check connection string format
- Verify IP address whitelist includes Railway

---

## 📊 Performance Tips

1. **Enable CORS caching** - Reduces API calls
2. **Image lazy loading** - Improves page load
3. **Database indexing** - Faster queries
4. **CDN for images** - Pexels uses Cloudflare (already fast)

---

## 📝 Notes

- First deploy takes 5-10 minutes
- Subsequent deploys take 2-3 minutes
- Railway free tier includes 500GB bandwidth/month
- Vercel free tier includes unlimited deployments
- MongoDB Atlas free tier: 512MB storage

---

## ✅ You're Live!

Congratulations! Your Pixora app is now live on the internet. 🎉

Share your deployed URL with friends and get feedback!

---

## Next Steps

1. Gather user feedback
2. Fix bugs from production
3. Add new features (save pins, collections, etc.)
4. Monitor performance with analytics
5. Scale database if needed

Happy deploying! 🚀

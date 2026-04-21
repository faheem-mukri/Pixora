# 🚀 Quick Deploy to Vercel

## I have everything ready, just tell me what to do!

### **Step 1: MongoDB Atlas Setup** (5 min)
```
1. Go to mongodb.com/cloud/atlas
2. Sign up or login
3. Create free cluster
4. Add your IP (or use 0.0.0.0/0)
5. Create user: pixora_user
6. Copy connection string like:
   mongodb+srv://pixora_user:b0EvjDEUciErnAA7@cluster.mongodb.net/pixora?retryWrites=true&w=majority
7. Keep this URI safe ✅
```

### **Step 2: Deploy Backend to Railway** (5 min)
```
1. Go to railway.app
2. Sign in with GitHub
3. Click: New Project → Import from GitHub
4. Select: pixora repository
5. Click Project → Settings → Root Directory: backend
6. In Variables tab, add:
   - MONGODB_URI = (paste from Step 1)
   - PEXELS_API_KEY = (your api key)
   - JWT_SECRET = (random text, like: 81aXb325gHK1zdA6XLd4)
   - FRONTEND_URL = https://placeholder.vercel.app (change later)
   - NODE_ENV = production
7. Click Deploy ✅
8. Wait ~2 min, copy the URL (looks like https://pixora-xxx.up.railway.app)
9. Write it down: _________________
```

### **Step 3: Deploy Frontend to Vercel** (5 min)
```
1. Go to vercel.com
2. Sign in with GitHub
3. Click: Add New → Project
4. Select: pixora repository
5. Configure:
   - Framework: React
   - Root Directory: frontend
   - Environment Variables:
     REACT_APP_API_URL = (paste Railway URL from Step 2)
6. Click Deploy ✅
7. Wait ~2 min, copy your Vercel URL (looks like https://pixora-xxx.vercel.app)
8. Write it down: _________________
```

### **Step 4: Connect Them Together** (1 min)
```
1. Go back to railway.app
2. Find your project
3. In Variables, change:
   FRONTEND_URL = (paste your Vercel URL from Step 3)
4. Railway auto-redeploys ✅
```

### **Step 5: Test** (2 min)
```
1. Open your Vercel URL in browser
2. Sign up for test account
3. Search for "cats"
4. If it works → YOU'RE DONE! 🎉
5. If CORS error → check FRONTEND_URL in Railway variables
```

---

## Environment Variables Quick Reference

| Variable | Where | Value |
|----------|-------|-------|
| `MONGODB_URI` | Railway | `mongodb+srv://...` from Atlas |
| `PEXELS_API_KEY` | Railway | Your Pexels API key |
| `JWT_SECRET` | Railway | Any random secret string |
| `FRONTEND_URL` | Railway | Your Vercel URL |
| `REACT_APP_API_URL` | Vercel | Your Railway URL |

---

## Troubleshooting in 30 Seconds

| Problem | Solution |
|---------|----------|
| **CORS Error** | Check FRONTEND_URL in Railway = Vercel URL exactly |
| **MongoDB Error** | Check MONGODB_URI is correct, IP whitelisted in Atlas |
| **API 404** | Check REACT_APP_API_URL in Vercel = Railway URL exactly |
| **Blank Page** | Check Vercel build logs, root directory = frontend |

---

## Detailed Guide
👉 Read `VERCEL_DEPLOYMENT.md` for detailed explanation
👉 Follow `DEPLOYMENT_CHECKLIST.md` to track progress

---

**Done in ~25 minutes! Your app is now live globally.** ✨

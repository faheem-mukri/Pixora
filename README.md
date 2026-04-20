# Pixora - Pinterest Clone

A full-stack social image discovery platform built with **React, Node.js, Express, and MongoDB**. Features user authentication, personalized recommendations based on search history, and a beautiful Pinterest-like masonry layout.

> **🎉 NEW**: Pixora has been enhanced with production-ready improvements! See [IMPROVEMENTS.md](IMPROVEMENTS.md) for details.

## 🆕 Recent Improvements

✅ **Security**: Strong password validation, input sanitization, comprehensive validation  
✅ **Performance**: Database indexes for 3-5x faster queries  
✅ **UX**: Enhanced error handling, request timeouts, retry logic  
✅ **Code Quality**: Reusable validation utilities, better error messages

👉 **Quick Setup**: Run `node setup-improvements.js` to install all enhancements

---

## 🎯 Features

- **User Authentication** - Secure signup/login with JWT tokens and bcrypt password hashing
- **Image Search & Discovery** - Search millions of images powered by Pexels API
- **Personalized Recommendations** - Smart mixing algorithm combining search history with curated viral content
- **Modern UI/UX** - Premium "Pinterest-like" aesthetic with pill-shaped buttons, smooth animations, and rounded cards
- **Unified Infinite Scroll** - Seamlessly discover content starting from your personal recommendations into an endless curated feed
- **User Accounts** - Persistent user data with search history tracking
- **Protected Routes** - Frontend route protection for authenticated features
- **Infinite Scroll** - Smooth infinite scrolling for browsing images
- **Pin Details** - View detailed information about each image

## 🏗️ Tech Stack

### Frontend
- React 18
- React Router v6 (SPA routing)
- Axios (HTTP client)
- React Responsive Masonry
- React Infinite Scroll Component
- Context API (State Management)

### Backend
- Node.js & Express
- MongoDB & Mongoose
- JWT (JSON Web Tokens)
- bcryptjs (Password hashing)
- Axios (HTTP requests)
- dotenv (Environment variables)

### APIs
- Pexels API (Image data)

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Pexels API Key (free at pexels.com/api)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/pixora.git
cd pixora
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in backend folder:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pixora
PEXELS_API_KEY=your_pexels_api_key_here
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

Start MongoDB:

```bash
# On macOS/Linux
mongod

# On Windows
# Open MongoDB Compass or use: net start MongoDB
```

Start backend server:

```bash
npm run dev
```

Backend runs on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Start frontend development server:

```bash
npm start
```

Frontend runs on `http://localhost:3000`

## 📱 Usage

### First Time User

1. Go to `http://localhost:3000`
2. Click "Sign Up" or go to `/signup`
3. Create account with username, email, and password
4. You'll be logged in automatically

### Main Features

**Search Images:**
- Type in the search bar and press Enter
- Results appear with infinite scroll

**View Recommendations:**
- Search for a few things to populate your history
- Click "See Recommended For You" banner on homepage
- Get personalized recommendations based on your searches

**View Pin Details:**
- Click any image to view full details
- See photographer info
- Share or save pins (UI ready, backend coming soon)

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires JWT)

### Search
- `GET /api/search/images?query=mountains` - Search images
- `GET /api/search/curated` - Get curated images
- `GET /api/search/pin/:id` - Get pin details by ID
- `POST /api/search/save-search` - Save search to history (requires JWT)
- `GET /api/search/history` - Get user's search history (requires JWT)
- `GET /api/search/recommendations` - Get personalized recommendations (requires JWT)

## 🔐 Authentication Flow

1. User signs up → Password hashed with bcrypt → JWT token generated
2. Token stored in localStorage on frontend
3. Token sent in `Authorization: Bearer <token>` header for protected requests
4. Backend verifies JWT before returning user-specific data
5. User logout → Token removed from localStorage

## 💾 Database Schema

### User Model
```javascript
{
  username: String (unique),
  displayName: String,
  email: String (unique),
  password: String (hashed),
  avatarUrl: String,
  searchHistory: [{ query: String, timestamp: Date }],
  savedPins: [{ imageId, imageUrl, alt, savedAt }],
  followers: [ObjectId],
  following: [ObjectId]
}
```

## 📦 Project Structure

```
pixora/
├── backend/
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── search.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Header.js
    │   │   ├── RecommendationsBanner.js
    │   │   └── ProtectedRoute.js
    │   ├── context/
    │   │   ├── AuthContext.js
    │   │   └── RecommendationsContext.js
    │   ├── hooks/
    │   │   ├── useAuth.js
    │   │   └── useRecommendations.js
    │   ├── pages/
    │   │   ├── HomePage.js
    │   │   ├── SearchResultsPage.js
    │   │   ├── PinDetailPage.js
    │   │   ├── RecommendationsPage.js
    │   │   ├── LoginPage.js
    │   │   └── SignupPage.js
    │   ├── App.js
    │   └── index.js
    └── package.json
```

## 🚢 Deployment to Vercel

**👉 NEW! Complete deployment guides are ready:**

- **[DEPLOY_QUICK_REFERENCE.md](DEPLOY_QUICK_REFERENCE.md)** - 25-minute quick start (START HERE!)
- **[VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)** - Detailed step-by-step guide
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Interactive checklist to track progress

### Overview

Deploy your full MERN stack:
- **Frontend**: React app on [Vercel](https://vercel.com) 🎨
- **Backend**: Express API on [Railway](https://railway.app) ⚙️
- **Database**: MongoDB on [MongoDB Atlas](https://mongodb.com/cloud/atlas) 💾

**Total time: ~25 minutes** ⏱️

## 🔄 Recommendations Engine

The app uses **intelligent caching** to speed up recommendations:

1. User performs searches → Searches stored in MongoDB
2. When viewing recommendations page → Backend fetches from Pexels API
3. Results cached in memory for 30 minutes
4. Subsequent requests return cached data instantly
5. New search clears user's cache for fresh recommendations

This ensures fast performance while keeping recommendations up-to-date.

## 🎨 UI Features

- **Modern Aesthetic** - "Pill-shaped" buttons and rounded cards matching 2024 design trends
- **Floating Card Details** - Premium modal-style view for pin details
- **Interactive Header** - Search history appears instantly in a dropdown
- **Unified Feed** - Mixed content stream with seamless infinite scrolling
- **Refined Authentication** - Modern, minimalist login/signup pages with centered cards and pill inputs
- **Responsive Masonry** - Dynamic grid that adapts to any screen size

## 🔄 Future Features

- [ ] Save/unsave pins functionality
- [ ] Create pin collections/boards
- [ ] Follow other users
- [ ] Comments on pins
- [ ] Advanced search filters
- [ ] Dark mode
- [ ] Image upload functionality
- [ ] Social sharing

## 📝 Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pixora
PEXELS_API_KEY=your_pexels_api_key
JWT_SECRET=your_jwt_secret_key
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
```

## 🐛 Troubleshooting

**MongoDB Connection Error**
- Ensure MongoDB is running
- Check MONGODB_URI in .env

**Pexels API Error**
- Verify API key is correct
- Check rate limits (45 requests/hour free tier)

**CORS Error**
- Backend should have CORS enabled
- Check backend server is running on port 5000

**JWT Token Error**
- Clear localStorage and login again
- Check JWT_SECRET matches between backend and frontend

## 👤 Author

Built by BTech Computer Science student as a portfolio project combining MERN stack skills with API integration.

## 📄 License

MIT License - feel free to use this project as reference or fork it!

## 🙏 Acknowledgments

- Pexels API for free image data
- Pinterest for design inspiration
- React community for amazing libraries

---

**Happy coding! 🚀** Feel free to star and fork this repo!

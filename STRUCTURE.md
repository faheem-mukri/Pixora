# 📁 Repository Structure Guide

This guide explains the folder structure of Pixora and what each file does.

```
pixora/
├── README.md                      # Main project documentation
├── DEPLOYMENT_GUIDE.md            # Step-by-step deployment instructions
├── .gitignore                     # Files to exclude from git
├── .env.example                   # Template for environment variables
│
├── backend/                       # Node.js/Express backend
│   ├── models/
│   │   └── User.js               # MongoDB User schema
│   │
│   ├── routes/
│   │   ├── auth.js               # Authentication endpoints (signup, login)
│   │   └── search.js             # Search and recommendations endpoints
│   │
│   ├── middleware/
│   │   └── auth.js               # JWT authentication middleware
│   │
│   ├── server.js                 # Express server entry point
│   ├── .env                       # (NEVER COMMIT) Your API keys
│   ├── .env.example              # Template for .env
│   └── package.json              # Backend dependencies
│
└── frontend/                      # React frontend
    ├── src/
    │   ├── components/
    │   │   ├── Header.js          # Navigation header with search
    │   │   ├── Header.css
    │   │   ├── RecommendationsBanner.js  # "Recommended For You" button
    │   │   ├── RecommendationsBanner.css
    │   │   ├── ProtectedRoute.js  # Route guard for authenticated pages
    │   │   ├── SkeletonLoader.js  # Loading placeholder
    │   │   └── SkeletonLoader.css
    │   │
    │   ├── context/
    │   │   ├── AuthContext.js     # Global auth state & functions
    │   │   └── RecommendationsContext.js # Global recommendations cache
    │   │
    │   ├── hooks/
    │   │   ├── useAuth.js         # Hook to use auth context
    │   │   └── useRecommendations.js # Hook to use recommendations
    │   │
    │   ├── pages/
    │   │   ├── HomePage.js        # Main feed with curated images
    │   │   ├── HomePage.css
    │   │   ├── SearchResultsPage.js  # Search results view
    │   │   ├── SearchResultsPage.css
    │   │   ├── PinDetailPage.js   # Single image detail view
    │   │   ├── PinDetailPage.css
    │   │   ├── RecommendationsPage.js # Personalized recommendations
    │   │   ├── RecommendationsPage.css
    │   │   ├── LoginPage.js       # User login form
    │   │   ├── SignupPage.js      # User signup form
    │   │   └── AuthPages.css      # Shared styles for auth pages
    │   │
    │   ├── App.js                 # Main app with routing
    │   ├── App.css
    │   ├── index.js               # React entry point
    │   └── index.css
    │
    ├── public/
    │   └── index.html
    │
    ├── .env.example               # Template for frontend env vars
    └── package.json               # Frontend dependencies
```

---

## 📝 File Descriptions

### Backend Files

#### `models/User.js`
- Defines MongoDB User schema
- Fields: username, email, password (hashed), searchHistory, savedPins, followers
- Methods: comparePassword (for login verification)

#### `routes/auth.js`
- `POST /register` - User signup
- `POST /login` - User login
- `GET /me` - Get current user (protected)

#### `routes/search.js`
- `GET /images` - Search images from Pexels
- `GET /curated` - Get curated images
- `GET /pin/:id` - Get single image details
- `POST /save-search` - Save search to history (protected)
- `GET /history` - Get user's search history (protected)
- `GET /recommendations` - Get personalized recommendations (protected)

#### `middleware/auth.js`
- Verifies JWT tokens
- Extracts user ID from token
- Used by `@auth` decorator on protected routes

#### `server.js`
- Express server setup
- MongoDB connection
- Routes registration
- CORS configuration

---

### Frontend Files

#### Components

**Header.js**
- Navigation bar at top
- Search input field
- User profile display
- Logout button

**RecommendationsBanner.js**
- Shows "See Recommended For You" button
- Only visible when logged in and has search history
- Links to `/recommendations` page

**ProtectedRoute.js**
- Wraps routes that need authentication
- Redirects to `/login` if not authenticated

#### Contexts

**AuthContext.js**
- Global authentication state
- Methods: `login()`, `register()`, `logout()`
- Stores JWT token in localStorage
- Provides: `user`, `token`, `isAuthenticated`, `loading`

**RecommendationsContext.js**
- Caches recommendations data
- Automatically fetches every time user searches
- Stores recommendations in memory (no database)
- Provides: `recommendations`, `basedOn`, `loading`, `refetch()`

#### Hooks

**useAuth.js**
- Custom hook to access AuthContext
- Usage: `const { user, login, logout } = useAuth()`

**useRecommendations.js**
- Custom hook to access RecommendationsContext
- Usage: `const { recommendations, basedOn } = useRecommendations()`

#### Pages

**HomePage.js**
- Shows curated images by default
- Shows recommendations banner (if logged in)
- Infinite scroll functionality

**SearchResultsPage.js**
- Shows search results
- Saves search to history (if logged in)
- URL: `/search?q=mountains`

**PinDetailPage.js**
- Full-size image view
- Photographer info
- Save/Share buttons
- URL: `/pin/123456`

**RecommendationsPage.js**
- Personalized recommendations grid
- Based on user's search history
- Requires authentication (ProtectedRoute)
- URL: `/recommendations`

**LoginPage.js**
- Email/password login form
- Link to signup page
- Stores JWT token on successful login

**SignupPage.js**
- Username/email/password signup form
- Password confirmation
- Link to login page

---

## 🔄 Data Flow

### Authentication Flow

```
SignupPage ↓
     ↓
Backend: /auth/register
     ↓
Hash password + Create user in MongoDB
     ↓
Generate JWT token
     ↓
Send token to frontend
     ↓
AuthContext stores token in localStorage
     ↓
User redirected to HomePage
```

### Search Flow

```
Header (search input)
     ↓
User types + presses Enter
     ↓
Frontend: GET /api/search/images?query=mountains
     ↓
Backend: Fetch from Pexels API
     ↓
Results displayed in SearchResultsPage
     ↓
If logged in: POST /api/search/save-search
     ↓
Search saved to MongoDB
```

### Recommendations Flow

```
User logs in
     ↓
RecommendationsContext auto-fetches
     ↓
GET /api/search/recommendations (with JWT token)
     ↓
Backend: Read searchHistory from MongoDB
     ↓
Backend: Fetch from Pexels for each search
     ↓
Cache results in memory (30 minutes)
     ↓
Display recommendations on RecommendationsPage
```

---

## 🚀 Adding New Features

### To add a new page:

1. Create `src/pages/NewPage.js`
2. Add route in `App.js`
3. Add navigation link in `Header.js`

### To add a new API endpoint:

1. Create route in `backend/routes/newRoute.js`
2. Add route to `server.js`: `app.use('/api/new', newRoute)`
3. Call from frontend with `axios` + JWT token if needed

### To add a new context/global state:

1. Create `src/context/NewContext.js`
2. Wrap app in `App.js`
3. Create hook `src/hooks/useNew.js`
4. Use hook in components

---

## 📦 Dependencies

### Backend (from package.json)
- `express` - Server framework
- `mongoose` - MongoDB ORM
- `jsonwebtoken` - JWT handling
- `bcryptjs` - Password hashing
- `axios` - HTTP client
- `dotenv` - Environment variables
- `cors` - Cross-origin requests

### Frontend (from package.json)
- `react` - UI library
- `react-router-dom` - Page routing
- `axios` - HTTP client
- `react-responsive-masonry` - Masonry grid
- `react-infinite-scroll-component` - Infinite scroll

---

## 🔐 Security Notes

- Never commit `.env` files
- API keys stored in environment variables
- Passwords hashed with bcrypt (never stored plain)
- JWTs signed with secret key (change in production)
- Protected routes check JWT before returning data

---

## 📈 Database

### Collections

**users** (MongoDB collection)
```javascript
{
  _id: ObjectId,
  username: "john_doe",
  email: "john@example.com",
  password: "$2a$10$...", // hashed
  displayName: "John Doe",
  avatarUrl: "",
  searchHistory: [
    { query: "mountains", timestamp: Date },
    { query: "ocean", timestamp: Date }
  ],
  savedPins: [
    { imageId: 123, imageUrl: "...", alt: "...", savedAt: Date }
  ],
  followers: [],
  following: [],
  createdAt: Date,
  updatedAt: Date
}
```

---

Happy coding! 🎉

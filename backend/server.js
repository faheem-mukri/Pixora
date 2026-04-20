require('dotenv').config();

// Validate required env vars on startup
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET', 'PEXELS_API_KEY'];
REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Security headers
app.use(helmet());

// Restrict CORS to frontend URL only
const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:3000'];
console.log('Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    console.log('Request origin:', origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true
}));

app.use(express.json());

// Mongoose 8 — no deprecated options needed
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search');
const pinsRoutes = require('./routes/pins');

app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/pins', pinsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ msg: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
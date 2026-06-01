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
const cookies = require('cookie-parser');

const app = express();

// Security headers
app.use(helmet());

// Restrict CORS to frontend URL only
const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10kb' })); // Limit JSON payloads to prevent abuse
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Limit URL-encoded payloads

app.use(cookieParser());

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
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation error', code: 'VALIDATION_ERROR', details: err.message });
  }
  if (err.name === 'MongoServerError' && err.code === 11000) {
    return res.status(400).json({ error: 'Duplicate entry', code: 'DUPLICATE_ERROR' });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format', code: 'INVALID_ID' });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
  }
  if (err.status === 413) {
    return res.status(413).json({ error: 'Payload too large', code: 'PAYLOAD_TOO_LARGE' });
  }
  
  // Default 500 for unexpected errors
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
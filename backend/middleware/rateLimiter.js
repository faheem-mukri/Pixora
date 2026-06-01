const rateLimit = require('express-rate-limit');

// API endpoint limiter (per user, 30 req/min)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  keyGenerator: (req) => req.user?.id || req.ip, // Per user if authenticated
  message: { error: 'Too many requests, please try again later', code: 'RATE_LIMIT_EXCEEDED' },
  standardHeaders: false,
  skip: (req) => !req.user // Only apply to authenticated users
});

// Search limiter (higher limit - 60 req/min)
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: 'Too many search requests', code: 'SEARCH_RATE_LIMIT' },
  standardHeaders: false
});

module.exports = { apiLimiter, searchLimiter };

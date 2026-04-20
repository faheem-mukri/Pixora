const express = require('express');
const axios = require('axios');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// ─────────────────────────────────────────
// SERVER-SIDE CACHE
// Prevents hammering Pexels (45 req/hr free tier)
// Cache is per-key, expires after TTL ms
// ─────────────────────────────────────────
const cache = new Map();

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data, ttlMs) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

const CACHE_TTL = {
  CURATED: 10 * 60 * 1000,       // 10 min — curated feed changes slowly
  SEARCH:   5 * 60 * 1000,       // 5 min  — search results
  RECOMMENDATIONS: 15 * 60 * 1000 // 15 min — per-user recommendations
};

// ─────────────────────────────────────────
// PEXELS HELPER — single place to call API
// ─────────────────────────────────────────
async function pexelsFetch(endpoint, params) {
  const response = await axios.get(`https://api.pexels.com/v1/${endpoint}`, {
    params,
    headers: { Authorization: process.env.PEXELS_API_KEY }
  });
  return response.data;
}

// Optional auth middleware
const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (token) {
    try {
      const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.id };
    } catch (_) {}
  }
  next();
};

// ─────────────────────────────────────────
// GET /images — search with cache
// ─────────────────────────────────────────
router.get('/images', optionalAuth, async (req, res) => {
  try {
    const { query = 'nature', page = 1, per_page = 30 } = req.query;
    const cacheKey = `search:${query}:${page}:${per_page}`;

    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const data = await pexelsFetch('search', { query, page, per_page });
    setCache(cacheKey, data, CACHE_TTL.SEARCH);
    res.json(data);
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// ─────────────────────────────────────────
// GET /curated — homepage infinite scroll with cache
// Pexels has ~8000 curated photos, so pages 1-266
// at per_page=30 gives effectively unlimited content
// ─────────────────────────────────────────
router.get('/curated', async (req, res) => {
  try {
    const { page = 1, per_page = 30 } = req.query;
    const cacheKey = `curated:${page}:${per_page}`;

    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const data = await pexelsFetch('curated', { page, per_page });
    setCache(cacheKey, data, CACHE_TTL.CURATED);
    res.json(data);
  } catch (error) {
    console.error('Curated error:', error.message);
    res.status(500).json({ error: 'Failed to fetch curated images' });
  }
});

// ─────────────────────────────────────────
// GET /pin/:id
// ─────────────────────────────────────────
router.get('/pin/:id', async (req, res) => {
  try {
    const cacheKey = `pin:${req.params.id}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const data = await pexelsFetch(`photos/${req.params.id}`, {});
    setCache(cacheKey, data, CACHE_TTL.CURATED);
    res.json(data);
  } catch (error) {
    console.error('Pin fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch pin details' });
  }
});

// ─────────────────────────────────────────
// GET /recommendations — PAGINATED
//
// Strategy:
//  - Takes user's last 5 unique searches
//  - Uses ?page= param to fetch DIFFERENT pages
//    of results per request, giving infinite variety
//  - Mixes in curated content on every page
//  - Caches per user per page for 15 min
//  - Result: effectively unlimited personalized content
// ─────────────────────────────────────────
router.get('/recommendations', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const user = await User.findById(req.user.id).select('searchHistory');

    if (!user || !user.searchHistory?.length) {
      // No history → fall back to curated
      const cacheKey = `curated:${page}:30`;
      let data = getCache(cacheKey);
      if (!data) {
        data = await pexelsFetch('curated', { page, per_page: 30 });
        setCache(cacheKey, data, CACHE_TTL.CURATED);
      }
      return res.json({
        recommendations: data.photos || [],
        basedOn: [],
        hasMore: (data.photos?.length || 0) === 30
      });
    }

    // Get last 5 unique search terms
    const seen = new Set();
    const uniqueSearches = [];
    for (let i = user.searchHistory.length - 1; i >= 0; i--) {
      const q = user.searchHistory[i].query.toLowerCase();
      if (!seen.has(q)) {
        seen.add(q);
        uniqueSearches.push(user.searchHistory[i].query);
      }
      if (uniqueSearches.length === 5) break;
    }

    // Cache key includes page so each page is cached independently
    const cacheKey = `rec:${req.user.id}:${uniqueSearches.join(',').slice(0, 60)}:${page}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    // Each search query uses a different page offset for variety
    // page 1 → Pexels page 1, page 2 → Pexels page 2, etc.
    const searchPromises = uniqueSearches.map((query, i) =>
      pexelsFetch('search', {
        query,
        page,          // use the requested page for all — gives new results each time
        per_page: 12   // 5 topics × 12 = 60 search results per page
      }).catch(() => ({ photos: [] }))
    );

    // Mix in fresh curated images (different page each time)
    searchPromises.push(
      pexelsFetch('curated', { page, per_page: 20 })
        .catch(() => ({ photos: [] }))
    );

    const responses = await Promise.all(searchPromises);
    const allPhotos = responses.flatMap(r => r.photos || []);

    // Deduplicate
    const unique = [...new Map(allPhotos.map(p => [p.id, p])).values()];

    // Shuffle so topics are interleaved, not grouped
    const shuffled = unique.sort(() => Math.random() - 0.5);

    const result = {
      recommendations: shuffled,
      basedOn: uniqueSearches,
      hasMore: shuffled.length >= 20 // if we got results, there's likely more
    };

    setCache(cacheKey, result, CACHE_TTL.RECOMMENDATIONS);
    res.json(result);
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// ─────────────────────────────────────────
// POST /save-search
// ─────────────────────────────────────────
router.post('/save-search', auth, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.searchHistory.push({ query, timestamp: new Date() });

    // Cap at 100 entries
    if (user.searchHistory.length > 100) {
      user.searchHistory = user.searchHistory.slice(-100);
    }

    await user.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Save search error:', error);
    res.status(500).json({ error: 'Failed to save search' });
  }
});

// ─────────────────────────────────────────
// GET /history
// ─────────────────────────────────────────
router.get('/history', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('searchHistory');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ searchHistory: user.searchHistory });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ─────────────────────────────────────────
// POST /save-pin
// ─────────────────────────────────────────
router.post('/save-pin', auth, async (req, res) => {
  try {
    const { imageId, imageUrl, alt } = req.body;
    if (!imageId || !imageUrl) return res.status(400).json({ error: 'Image details required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const alreadySaved = user.savedPins.some(p => p.imageId === imageId.toString());
    if (alreadySaved) return res.json({ success: true, message: 'Already saved' });

    user.savedPins.push({ imageId: imageId.toString(), imageUrl, alt: alt || 'Saved Pin', savedAt: new Date() });
    await user.save();
    res.json({ success: true, message: 'Pin saved' });
  } catch (error) {
    console.error('Save pin error:', error);
    res.status(500).json({ error: 'Failed to save pin' });
  }
});

// ─────────────────────────────────────────
// GET /user-pins/:username
// ─────────────────────────────────────────
router.get('/user-pins/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const pins = user.savedPins.map(pin => ({
      id: pin.imageId,
      src: { 
        large: pin.imageUrl, 
        medium: pin.imageUrl || pin.imageUrl
      },
      alt: pin.alt || '',
      title: pin.title || '',
      width: Number(pin.width) || 400,
      height: Number(pin.height) || 600,
      photographer: pin.photographer || 'Unknown'
    })).reverse();

    res.json({ pins });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pins' });
  }
});

// ─────────────────────────────────────────
// GET /users — search users by username
// Supports @username format in search
// ─────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { query = '' } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.json({ users: [] });
    }

    // Remove @ symbol if present
    const searchQuery = query.trim().replace(/^@/, '');

    if (searchQuery.length < 2) {
      return res.json({ users: [] });
    }

    // Search for users by username or displayName
    const users = await User.find({
      $or: [
        { username: new RegExp(searchQuery, 'i') },
        { displayName: new RegExp(searchQuery, 'i') }
      ]
    })
    .select('username displayName avatarUrl bio followers following')
    .limit(20)
    .lean();

    // Format response with follower/following counts
    const formattedUsers = users.map(user => ({
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0
    }));

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

module.exports = router;
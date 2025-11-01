const express = require('express');
const axios = require('axios');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Middleware to optionally authenticate (some routes don't require login)
const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (token) {
    try {
      const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
      req.user = { id: decoded.id };
    } catch (err) {
      // Ignore error, user is optional
    }
  }
  next();
};

// Search images from Pexels
router.get('/images', optionalAuth, async (req, res) => {
  try {
    const { query = 'nature', page = 1, per_page = 30 } = req.query;
    
    const response = await axios.get(
      `https://api.pexels.com/v1/search`,
      {
        params: { query, page, per_page },
        headers: {
          Authorization: process.env.PEXELS_API_KEY
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching images:', error.message);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// Get curated images (for homepage when no search)
router.get('/curated', async (req, res) => {
  try {
    const { page = 1, per_page = 30 } = req.query;
    
    const response = await axios.get(
      `https://api.pexels.com/v1/curated`,
      {
        params: { page, per_page },
        headers: {
          Authorization: process.env.PEXELS_API_KEY
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching curated images:', error.message);
    res.status(500).json({ error: 'Failed to fetch curated images' });
  }
});

// Get pin details by ID from Pexels
router.get('/pin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const response = await axios.get(
      `https://api.pexels.com/v1/photos/${id}`,
      {
        headers: {
          Authorization: process.env.PEXELS_API_KEY
        }
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching pin:', error.message);
    res.status(500).json({ error: 'Failed to fetch pin details' });
  }
});

// Save search to user's history (requires authentication)
router.post('/save-search', auth, async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add search to history
    user.searchHistory.push({
      query: query,
      timestamp: new Date()
    });

    await user.save();

    res.json({ success: true, message: 'Search saved' });
  } catch (error) {
    console.error('Error saving search:', error);
    res.status(500).json({ error: 'Failed to save search' });
  }
});

// Get user's search history (requires authentication)
router.get('/history', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ searchHistory: user.searchHistory });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get recommendations based on user's search history (requires authentication)
router.get('/recommendations', auth, async (req, res) => {
  try {
    console.log('=== RECOMMENDATIONS ENDPOINT CALLED ===');
    console.log('User ID:', req.user.id);
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      console.log('User not found');
      return res.json({ recommendations: [], basedOn: [] });
    }

    console.log('Search history length:', user.searchHistory.length);

    if (!user.searchHistory || user.searchHistory.length === 0) {
      console.log('No search history found');
      return res.json({ recommendations: [], basedOn: [] });
    }

    // Extract all unique search queries from history
    const searchQueries = user.searchHistory.map(h => h.query);
    console.log('All search queries:', searchQueries);
    
    // Get the last 5 unique searches
    const uniqueSearches = [...new Set(searchQueries)];
    const recentSearches = uniqueSearches.slice(-5).reverse();
    
    console.log('Recent unique searches:', recentSearches);

    // Fetch images for each search query
    const allRecommendations = [];
    
    for (const query of recentSearches) {
      try {
        console.log(`Fetching images for query: "${query}"`);
        
        const response = await axios.get(
          `https://api.pexels.com/v1/search`,
          {
            params: { query: query, per_page: 15 },
            headers: {
              Authorization: process.env.PEXELS_API_KEY
            }
          }
        );
        
        console.log(`Got ${response.data.photos.length} photos for "${query}"`);
        allRecommendations.push(...response.data.photos);
      } catch (err) {
        console.error(`ERROR fetching for "${query}":`, err.message);
      }
    }

    console.log('Total images collected:', allRecommendations.length);

    // Remove duplicates
    const uniqueRecommendations = [...new Map(
      allRecommendations.map(item => [item.id, item])
    ).values()];

    console.log('After removing duplicates:', uniqueRecommendations.length);

    // Shuffle recommendations
    const shuffled = uniqueRecommendations.sort(() => Math.random() - 0.5);
    const finalResult = shuffled.slice(0, 30);

    console.log('Final recommendations to send:', finalResult.length);
    console.log('=== RECOMMENDATIONS ENDPOINT FINISHED ===\n');

    res.json({ 
      recommendations: finalResult,
      basedOn: recentSearches
    });
  } catch (error) {
    console.error('CRITICAL ERROR in recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

module.exports = router;

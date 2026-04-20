const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Pin = require('../models/Pin');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer setup for handling file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Only JPEG, JPG, PNG, GIF, and WEBP files are allowed'));
    }
});


function uploadToCloudinary(buffer, options = {}) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
        {
            folder: 'pixora/created',
            resource_type: 'image',
            transformation: [{quality: 'auto:good'}, {fetch_format: 'auto'}],
            ...options
        },
        (error, result) => {
            if (error) reject(error);
            else resolve(result);
        }
        );
        Readable.from(buffer).pipe(stream);
    });
}

// ─────────────────────────────────────
// POST /api/pins/create
// Uploads to Cloudinary → saves to createdPins
// ─────────────────────────────────────
router.post('/create', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file && !req.body.imageUrl) {
      return res.status(400).json({ error: 'Image file or URL is required' });
    }
 
    const { title, description, link, tags } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
 
    let imageUrl, thumbnailUrl, imageId, width, height;
 
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        public_id: `pin_${req.user.id}_${Date.now()}`
      });
      imageUrl     = result.secure_url;
      thumbnailUrl = cloudinary.url(result.public_id, {
        width: 400, height: 600, crop: 'fill', quality: 'auto', fetch_format: 'auto'
      });
      imageId = result.public_id.split('/').pop();
      width   = result.width;
      height  = result.height;
    } else {
      const result = await cloudinary.uploader.upload(req.body.imageUrl, {
        folder: 'pixora/created',
        resource_type: 'image',
        transformation: [{ quality: 'auto:good' }, { fetch_format: 'auto' }]
      });
      imageUrl     = result.secure_url;
      thumbnailUrl = cloudinary.url(result.public_id, {
        width: 400, height: 600, crop: 'fill', quality: 'auto', fetch_format: 'auto'
      });
      imageId = result.public_id;
      width   = result.width;
      height  = result.height;
    }
 
    // Parse tags
    let parsedTags = [];
    if (tags) {
      try { parsedTags = JSON.parse(tags); }
      catch { parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean); }
    }
 
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
 
    // Save to createdPins — separate from savedPins
    user.createdPins.push({
      imageId,
      imageUrl,
      thumbnailUrl,
      title:       title.trim(),
      description: description?.trim() || '',
      link:        link?.trim() || '',
      tags:        parsedTags.slice(0, 10),
      width,
      height,
      createdAt:   new Date()
    });
 
    await user.save();
 
    res.status(201).json({
      success: true,
      pin: {
        id:          imageId,
        src:         { large: imageUrl, medium: thumbnailUrl },
        alt:         title.trim(),
        title:       title.trim(),
        description: description?.trim() || '',
        photographer: user.displayName || user.username,
        width,
        height
      }
    });
  } catch (error) {
    console.error('Create pin error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Max 20MB.' });
    }
    res.status(500).json({ error: error.message || 'Failed to create pin' });
  }
});
 
// ─────────────────────────────────────
// GET /api/pins/created/:username
// Returns user's created pins (public)
// ─────────────────────────────────────
router.get('/created/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });
 
    const pins = (user.createdPins || []).map(pin => ({
      id:          pin.imageId,
      src: {
        large: pin.imageUrl && pin.imageUrl.startsWith('http')
          ? pin.imageUrl
          : `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${pin.imageId}`,
        medium: pin.thumbnailUrl || pin.imageUrl
      },
      alt:         pin.title || 'Created pin',
      title:       pin.title || '',
      description: pin.description || '',
      link:        pin.link || '',
      tags:        pin.tags || [],
      photographer: user.displayName || user.username,
      width:       pin.width  || 400,
      height:      pin.height || 600,
      isUserCreated: true
    })).reverse(); // newest first
 
    res.json({ pins, count: pins.length });
  } catch (error) {
    console.error('Get created pins error:', error);
    res.status(500).json({ error: 'Failed to fetch created pins' });
  }
});
 
// ─────────────────────────────────────
// DELETE /api/pins/:imageId
// Removes from createdPins + Cloudinary
// ─────────────────────────────────────
router.delete('/:imageId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
 
    // Check it belongs to this user
    const pin = user.createdPins.find(p => p.imageId === req.params.imageId);
    if (!pin) return res.status(404).json({ error: 'Pin not found or not yours' });
 
    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(req.params.imageId);
    } catch (e) {
      console.error('Cloudinary delete error:', e.message);
    }
 
    user.createdPins = user.createdPins.filter(p => p.imageId !== req.params.imageId);
    await user.save();
 
    res.json({ success: true });
  } catch (error) {
    console.error('Delete pin error:', error);
    res.status(500).json({ error: 'Failed to delete pin' });
  }
});

// GET single pin by imageId
router.get('/pin/:id', async (req, res) => {
  try {
    const user = await User.findOne({
      "createdPins.imageId": req.params.id
    });

    if (!user) {
      return res.status(404).json({ error: 'Pin not found' });
    }

    const pin = user.createdPins.find(
      p => p.imageId === req.params.id
    );

    res.json({
      id: pin.imageId,
      src: {
        large: pin.imageUrl,
        large2x: pin.imageUrl
      },
      alt: pin.title,
      title: pin.title,
      description: pin.description,
      photographer: user.displayName || user.username,
      width: pin.width,
      height: pin.height
    });

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pin' });
  }
});

// ==================== SAVE PIN ENDPOINTS ====================

/**
 * POST /api/pins/save
 * Save a pin to user's saved collection
 */
router.post('/save', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      imageId, 
      imageUrl, 
      thumbnailUrl = '',
      alt = '', 
      title = '', 
      description = '', 
      link = '',
      width = 400,
      height = 600,
      photographer = '',
      tags = [],
      isUserCreated = false
    } = req.body;

    // Validate required fields
    if (!imageId || !imageUrl) {
      return res.status(400).json({ 
        error: 'imageId and imageUrl are required' 
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if pin is already saved
    const alreadySaved = user.savedPins.some(pin => pin.imageId === imageId);
    if (alreadySaved) {
      return res.status(400).json({ 
        error: 'Pin already saved',
        alreadySaved: true 
      });
    }

    // Add pin to user's saved pins
    user.savedPins.push({
      imageId,
      imageUrl,
      thumbnailUrl,
      alt,
      title,
      description,
      link,
      tags,
      width,
      height,
      isUserCreated,
      photographer,
      savedAt: new Date()
    });

    await user.save();

    // Increment save count in Pin model & ensure metadata exists
    await Pin.findOneAndUpdate(
      { imageId },
      { 
        imageId,
        $inc: { saveCount: 1 },
        metadata: {
          imageUrl,
          thumbnailUrl,
          alt,
          title,
          description,
          link,
          width,
          height,
          photographer,
          isUserCreated
        }
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ 
      success: true,
      message: 'Pin saved successfully',
      savedCount: user.savedPins.length
    });
  } catch (error) {
    console.error('Error saving pin:', error);
    res.status(500).json({ 
      error: 'Failed to save pin'
    });
  }
});

/**
 * DELETE /api/pins/unsave/:imageId
 * Remove a pin from user's saved collection
 */
router.delete('/unsave/:imageId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageId } = req.params;

    if (!imageId) {
      return res.status(400).json({ error: 'imageId is required' });
    }

    // Find user and remove pin
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if pin exists in saved pins
    const pinIndex = user.savedPins.findIndex(pin => pin.imageId === imageId);
    if (pinIndex === -1) {
      return res.status(404).json({ 
        error: 'Pin not found in saved collection' 
      });
    }

    // Remove pin from saved pins
    user.savedPins.splice(pinIndex, 1);
    await user.save();

    // Decrement save count in Pin model
    await Pin.findOneAndUpdate(
      { imageId },
      { $inc: { saveCount: -1 } },
      { new: true }
    );

    res.status(200).json({ 
      success: true,
      message: 'Pin unsaved successfully',
      savedCount: user.savedPins.length
    });
  } catch (error) {
    console.error('Error unsaving pin:', error);
    res.status(500).json({ 
      error: 'Failed to unsave pin'
    });
  }
});

/**
 * GET /api/pins/saved
 * Get all saved pins for authenticated user (paginated)
 */
router.get('/saved', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get paginated saved pins (newest first)
    const sortedPins = user.savedPins
      .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    
    const totalPins = sortedPins.length;
    const paginatedPins = sortedPins.slice(skip, skip + limit);

    // Format pins to match frontend expectations
    const formattedPins = paginatedPins.map(pin => ({
      id: pin.imageId,
      src: {
        large: pin.imageUrl,
        medium: pin.thumbnailUrl || pin.imageUrl,
        large2x: pin.imageUrl
      },
      alt: pin.alt || pin.title,
      title: pin.title,
      description: pin.description,
      link: pin.link,
      photographer: pin.photographer,
      width: pin.width,
      height: pin.height,
      tags: pin.tags || [],
      savedAt: pin.savedAt
    }));

    res.status(200).json({
      pins: formattedPins,
      currentPage: page,
      totalPages: Math.ceil(totalPins / limit),
      totalPins,
      hasMore: skip + limit < totalPins
    });
  } catch (error) {
    console.error('Error fetching saved pins:', error);
    res.status(500).json({ 
      error: 'Failed to fetch saved pins'
    });
  }
});

/**
 * GET /api/pins/saved/:imageId
 * Check if a pin is saved by the authenticated user
 */
router.get('/saved/:imageId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isSaved = user.savedPins.some(pin => pin.imageId === imageId);

    res.status(200).json({ 
      isSaved,
      imageId 
    });
  } catch (error) {
    console.error('Error checking saved status:', error);
    res.status(500).json({ 
      error: 'Failed to check saved status'
    });
  }
});

// ==================== LIKE PIN ENDPOINTS ====================

/**
 * POST /api/pins/like/:imageId
 * Like a pin
 */
router.post('/like/:imageId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageId } = req.params;

    if (!imageId) {
      return res.status(400).json({ error: 'imageId is required' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already liked
    const pin = await Pin.findOne({ imageId });
    if (pin) {
      const alreadyLiked = pin.likedBy.some(
        like => like.userId.toString() === userId
      );
      if (alreadyLiked) {
        return res.status(400).json({ 
          error: 'Pin already liked',
          alreadyLiked: true 
        });
      }
    }

    // Add to likedBy and increment count
    const updatedPin = await Pin.findOneAndUpdate(
      { imageId },
      { 
        $addToSet: { likedBy: { userId, likedAt: new Date() } },
        $inc: { likeCount: 1 }
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Pin liked successfully',
      likeCount: updatedPin.likeCount,
      imageId
    });
  } catch (error) {
    console.error('Error liking pin:', error);
    res.status(500).json({ 
      error: 'Failed to like pin'
    });
  }
});

/**
 * DELETE /api/pins/unlike/:imageId
 * Unlike a pin
 */
router.delete('/unlike/:imageId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageId } = req.params;

    if (!imageId) {
      return res.status(400).json({ error: 'imageId is required' });
    }

    // Remove from likedBy and decrement count
    const updatedPin = await Pin.findOneAndUpdate(
      { imageId },
      { 
        $pull: { likedBy: { userId } },
        $inc: { likeCount: -1 }
      },
      { new: true }
    );

    if (!updatedPin) {
      return res.status(404).json({ error: 'Pin not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Pin unliked successfully',
      likeCount: Math.max(0, updatedPin.likeCount),
      imageId
    });
  } catch (error) {
    console.error('Error unliking pin:', error);
    res.status(500).json({ 
      error: 'Failed to unlike pin'
    });
  }
});

/**
 * GET /api/pins/likes/:imageId
 * Get like count and users who liked a pin
 */
router.get('/likes/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    const includeUsers = req.query.includeUsers === 'true';

    const pin = await Pin.findOne({ imageId });
    
    if (!pin) {
      return res.status(200).json({ 
        likeCount: 0,
        likedBy: [],
        imageId 
      });
    }

    let response = {
      likeCount: pin.likeCount,
      imageId
    };

    // Optionally include user details
    if (includeUsers) {
      const populatedPin = await Pin.findOne({ imageId })
        .populate('likedBy.userId', 'username displayName avatarUrl');
      
      response.likedBy = populatedPin.likedBy.map(like => ({
        user: like.userId,
        likedAt: like.likedAt
      }));
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching likes:', error);
    res.status(500).json({ 
      error: 'Failed to fetch likes'
    });
  }
});

/**
 * GET /api/pins/liked/:imageId
 * Check if authenticated user liked a pin
 */
router.get('/liked/:imageId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageId } = req.params;

    const pin = await Pin.findOne({ imageId });
    
    if (!pin) {
      return res.status(200).json({ 
        isLiked: false,
        imageId 
      });
    }

    const isLiked = pin.likedBy.some(
      like => like.userId.toString() === userId
    );

    res.status(200).json({ 
      isLiked,
      imageId 
    });
  } catch (error) {
    console.error('Error checking liked status:', error);
    res.status(500).json({ 
      error: 'Failed to check liked status'
    });
  }
});
 
module.exports = router;
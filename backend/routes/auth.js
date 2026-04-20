const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Rate limit login/register to prevent brute-force
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { msg: 'Too many attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Validation helpers
const validateEmail = (email) => {
  const trimmed = (email || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed) ? trimmed : null;
};

const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return { valid: false, msg: 'Password must be at least 8 characters long' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, msg: 'Password must contain at least one lowercase letter' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, msg: 'Password must contain at least one uppercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, msg: 'Password must contain at least one number' };
  }
  return { valid: true };
};

const validateUsername = (username) => {
  const trimmed = (username || '').trim().toLowerCase();
  if (trimmed.length < 3 || trimmed.length > 30) {
    return null;
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return null;
  }
  return trimmed;
};

// Register
router.post('/register', authLimiter, async (req, res) => {
  const { username, displayName, email, password } = req.body;
  try {
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    // Validate email format
    const validEmail = validateEmail(email);
    if (!validEmail) {
      return res.status(400).json({ msg: 'Please provide a valid email address' });
    }

    // Validate username
    const validUsername = validateUsername(username);
    if (!validUsername) {
      return res.status(400).json({ msg: 'Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens' });
    }

    // Validate password strength
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ msg: passwordCheck.msg });
    }

    // Check for existing username
    if (await User.findOne({ username: validUsername })) {
      return res.status(400).json({ msg: 'Username already exists' });
    }

    // Check for existing email
    if (await User.findOne({ email: validEmail })) {
      return res.status(400).json({ msg: 'Email already registered' });
    }

    // Sanitize display name
    const sanitizedDisplayName = displayName ? displayName.trim().slice(0, 50) : validUsername;

    const user = await User.create({ 
      username: validUsername, 
      displayName: sanitizedDisplayName, 
      email: validEmail, 
      password 
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, displayName: user.displayName, email: user.email, avatarUrl: user.avatarUrl }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ msg: 'An error occurred during registration' });
  }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please provide email and password' });
    }

    // Validate email format
    const validEmail = validateEmail(email);
    if (!validEmail) {
      return res.status(400).json({ msg: 'Please provide a valid email address' });
    }

    const user = await User.findOne({ email: validEmail });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user._id, username: user.username, displayName: user.displayName, email: user.email, avatarUrl: user.avatarUrl }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'An error occurred during login' });
  }
});

// Get current user (protected)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get public profile by username — safe fields only
router.get('/user/:username', async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username.toLowerCase()
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 🔥 FORMAT SAVED PINS (IMPORTANT)
    const formattedSavedPins = user.savedPins.map(pin => ({
      id: pin.imageId,
      src: {
        large: pin.imageUrl,
        medium: pin.thumbnailUrl || pin.imageUrl
      },
      alt: pin.alt || '',
      title: pin.title || '',
      width: Number(pin.width) || 400,
      height: Number(pin.height) || 600,
      photographer: pin.photographer || 'Unknown'
    }));

    res.json({
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      followers: user.followers,
      following: user.following,
      createdAt: user.createdAt,
      savedPins: formattedSavedPins // ✅ FIXED
    });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Update own profile (protected) — Fix #6: this was a no-op before
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { displayName, bio } = req.body;

    // Whitelist only the fields users are allowed to update
    const updates = {};
    if (displayName !== undefined) {
      if (displayName.trim().length === 0)
        return res.status(400).json({ msg: 'Display name cannot be empty' });
      updates.displayName = displayName.trim().slice(0, 50); // max 50 chars
    }
    if (bio !== undefined) {
      updates.bio = bio.trim().slice(0, 200); // max 200 chars
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ msg: 'User not found' });

    res.json({
      user: { id: user._id, username: user.username, displayName: user.displayName, email: user.email, avatarUrl: user.avatarUrl }
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Follow a user (protected)
router.post('/follow/:username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user.id;

    // Find target user
    const targetUser = await User.findOne({ username: username.toLowerCase() });
    if (!targetUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Can't follow yourself
    if (targetUser._id.toString() === currentUserId) {
      return res.status(400).json({ msg: 'You cannot follow yourself' });
    }

    // Get current user
    const currentUser = await User.findById(currentUserId);

    // Check if already following
    if (currentUser.following.includes(targetUser._id)) {
      return res.status(400).json({ msg: 'Already following this user' });
    }

    // Add to following list (current user follows target)
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { following: targetUser._id }
    });

    // Add to followers list (target gets current user as follower)
    await User.findByIdAndUpdate(targetUser._id, {
      $addToSet: { followers: currentUserId }
    });

    res.json({ 
      msg: 'Successfully followed user',
      following: true
    });
  } catch (err) {
    console.error('Follow error:', err);
    res.status(500).json({ msg: 'Failed to follow user' });
  }
});

// Unfollow a user (protected)
router.post('/unfollow/:username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user.id;

    // Find target user
    const targetUser = await User.findOne({ username: username.toLowerCase() });
    if (!targetUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Remove from following list
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: targetUser._id }
    });

    // Remove from followers list
    await User.findByIdAndUpdate(targetUser._id, {
      $pull: { followers: currentUserId }
    });

    res.json({ 
      msg: 'Successfully unfollowed user',
      following: false
    });
  } catch (err) {
    console.error('Unfollow error:', err);
    res.status(500).json({ msg: 'Failed to unfollow user' });
  }
});

// Check if following a user (protected)
router.get('/following/:username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user.id;

    const targetUser = await User.findOne({ username: username.toLowerCase() });
    if (!targetUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const currentUser = await User.findById(currentUserId);
    const isFollowing = currentUser.following.includes(targetUser._id);

    res.json({ following: isFollowing });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get followers list (public)
router.get('/followers/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: username.toLowerCase() })
      .populate('followers', 'username displayName avatarUrl');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({ 
      followers: user.followers.map(f => ({
        username: f.username,
        displayName: f.displayName,
        avatarUrl: f.avatarUrl
      }))
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get following list (public)
router.get('/following-list/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: username.toLowerCase() })
      .populate('following', 'username displayName avatarUrl');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({ 
      following: user.following.map(f => ({
        username: f.username,
        displayName: f.displayName,
        avatarUrl: f.avatarUrl
      }))
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
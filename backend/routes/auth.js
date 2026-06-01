const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { validateEmail, validatePassword, validateUsername } = require('../utils/validators');

// Rate limit login/register to prevent brute-force
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts, please try again later', code: 'AUTH_RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false
});

// Register
router.post('/register', authLimiter, async (req, res) => {
  const { username, displayName, email, password } = req.body;
  try {
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required fields', code: 'MISSING_FIELDS' });
    }

    // Validate email format
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ error: emailCheck.message, code: 'INVALID_EMAIL' });
    }

    // Validate username
    const usernameCheck = validateUsername(username);
    if (!usernameCheck.valid) {
      return res.status(400).json({ error: usernameCheck.message, code: 'INVALID_USERNAME' });
    }

    // Validate password strength
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ error: passwordCheck.message, code: 'WEAK_PASSWORD' });
    }

    // Check for existing username
    if (await User.findOne({ username: usernameCheck.value })) {
      return res.status(400).json({ error: 'Username already exists', code: 'USERNAME_EXISTS' });
    }

    // Check for existing email
    if (await User.findOne({ email: emailCheck.value })) {
      return res.status(400).json({ error: 'Email already registered', code: 'EMAIL_EXISTS' });
    }

    // Sanitize display name
    const sanitizedDisplayName = displayName ? displayName.trim().slice(0, 50) : usernameCheck.value;

    const user = await User.create({ 
      username: usernameCheck.value, 
      displayName: sanitizedDisplayName, 
      email: emailCheck.value, 
      password 
    });

    // Issue short-lived access token (15 min) + long-lived refresh token (7 days)
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Store refresh token in DB
    user.refreshTokens = [{ token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }];
    await user.save();

    // Set httpOnly cookies
    res.cookie('pixora_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      data: { user: { id: user._id, username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl } }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'An error occurred during registration', code: 'REGISTER_ERROR' });
  }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password', code: 'MISSING_CREDENTIALS' });
    }

    // Validate email format
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ error: emailCheck.message, code: 'INVALID_EMAIL' });
    }

    const user = await User.findOne({ email: emailCheck.value });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    // Issue short-lived access token (15 min) + long-lived refresh token (7 days)
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Store refresh token in DB
    user.refreshTokens = [{ token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }];
    await user.save();

    // Set httpOnly cookies
    res.cookie('pixora_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      data: { user: { id: user._id, username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl } }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'An error occurred during login', code: 'LOGIN_ERROR' });
  }
});

// Get current user (protected)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -refreshTokens');
    res.json({ success: true, data: { user } });
  } catch (err) {
    res.status(500).json({ error: err.message, code: 'USER_FETCH_ERROR' });
  }
});

// Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required', code: 'NO_REFRESH_TOKEN' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user || !user.refreshTokens.some(rt => rt.token === refreshToken && rt.expiresAt > new Date())) {
      return res.status(401).json({ error: 'Invalid or expired refresh token', code: 'INVALID_REFRESH' });
    }

    // Issue new access token
    const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    
    res.cookie('pixora_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.json({ success: true, data: { accessToken: newAccessToken } });
  } catch (err) {
    res.status(401).json({ error: 'Token refresh failed', code: 'REFRESH_FAILED' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('pixora_token');
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out' });
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
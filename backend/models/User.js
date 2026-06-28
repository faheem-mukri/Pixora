const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new Schema(
  {
    // Basic user info
    username: { type: String, required: true, unique: true, lowercase: true },
    displayName: { type: String, default: '' },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true,
      validate: {
        validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please provide a valid email address'
      }
    },
    password: { type: String, required: true, minlength: 8 },
    avatarUrl: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 200 },

    searchHistory: [
      { query: String, timestamp: { type: Date, default: Date.now } }
    ],

    // Refresh tokens for 7-day session extension
    refreshTokens: [
      {
        token: String,
        expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
      }
    ],

    // Upgraded savedPins — stores full pin metadata
    savedPins: [
      {
        imageId:     { type: String, required: true },
        imageUrl:    { type: String, required: true }, // Cloudinary URL or Pexels URL
        thumbnailUrl:{ type: String, default: '' },    // Cloudinary thumbnail
        alt:         { type: String, default: '' },
        title:       { type: String, default: '' },
        description: { type: String, default: '' },
        link:        { type: String, default: '' },
        tags:        [String],
        width:       { type: Number, default: 400 },
        height:      { type: Number, default: 600 },
        isUserCreated: { type: Boolean, default: false }, // true = uploaded by user
        photographer:  { type: String, default: '' },
        savedAt:     { type: Date, default: Date.now }
      }
    ],

    // Pins created/uploaded by the user themselves
    createdPins: [
      {
        imageId:      { type: String, required: true },
        imageUrl:     { type: String, required: true },
        thumbnailUrl: { type: String, default: '' },
        title:        { type: String, default: '' },
        description:  { type: String, default: '' },
        link:         { type: String, default: '' },
        tags:         [String],
        width:        { type: Number, default: 400 },
        height:       { type: Number, default: 600 },
        createdAt:    { type: Date, default: Date.now }
      }
    ],

    // Social features
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

// Indexes for performance
// Note: email and username already have indexes from unique: true
userSchema.index({ 'searchHistory.timestamp': -1 });
userSchema.index({ 'savedPins.imageId': 1 });
userSchema.index({ createdAt: -1 });

//hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (pwd) {
  return bcrypt.compare(pwd, this.password);
};

// Add a refresh token while preserving other devices' sessions.
// Prunes expired tokens and caps the list to the most recent `maxTokens`.
userSchema.methods.addRefreshToken = function (token, expiresAt, maxTokens = 10) {
  const now = new Date();
  this.refreshTokens = (this.refreshTokens || []).filter(rt => rt.expiresAt > now);
  this.refreshTokens.push({ token, expiresAt });
  if (this.refreshTokens.length > maxTokens) {
    this.refreshTokens = this.refreshTokens.slice(-maxTokens);
  }
};

// Remove a specific refresh token (e.g. on logout from one device).
userSchema.methods.removeRefreshToken = function (token) {
  this.refreshTokens = (this.refreshTokens || []).filter(rt => rt.token !== token);
};

module.exports = model('User', userSchema);
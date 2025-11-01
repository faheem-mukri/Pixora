const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    displayName: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    
    // Pixora-specific fields
    searchHistory: [
      {
        query: String,
        timestamp: { type: Date, default: Date.now }
      }
    ],
    savedPins: [
      {
        imageId: String,
        imageUrl: String,
        alt: String,
        savedAt: { type: Date, default: Date.now }
      }
    ],
    // Social features (for future)
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = function (pwd) {
  return bcrypt.compare(pwd, this.password);
};

module.exports = model('User', userSchema);

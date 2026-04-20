const { Schema, model } = require('mongoose');

// Pin model for tracking likes, saves, and metadata
// This is separate from User.savedPins to efficiently track engagement
const pinSchema = new Schema(
  {
    imageId: { 
      type: String, 
      required: true, 
      unique: true,
      index: true 
    },
    
    // Engagement metrics
    likeCount: { 
      type: Number, 
      default: 0,
      min: 0 
    },
    saveCount: { 
      type: Number, 
      default: 0,
      min: 0 
    },
    
    // Users who liked this pin
    likedBy: [
      {
        userId: { 
          type: Schema.Types.ObjectId, 
          ref: 'User',
          required: true 
        },
        likedAt: { 
          type: Date, 
          default: Date.now 
        }
      }
    ],
    
    // Pin metadata (cached from Pexels or user upload)
    metadata: {
      imageUrl: { type: String, required: true },
      thumbnailUrl: { type: String, default: '' },
      alt: { type: String, default: '' },
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      link: { type: String, default: '' },
      width: { type: Number, default: 400 },
      height: { type: Number, default: 600 },
      photographer: { type: String, default: '' },
      isUserCreated: { type: Boolean, default: false }
    },
    
    // First saved date
    createdAt: { type: Date, default: Date.now },
    
    // Last interaction date
    updatedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

// Indexes for performance
pinSchema.index({ likeCount: -1 }); // For trending/popular queries
pinSchema.index({ saveCount: -1 }); // For trending/popular queries
pinSchema.index({ 'likedBy.userId': 1 }); // For "did user like this?" queries
pinSchema.index({ createdAt: -1 }); // For recent pins

// Static method to increment like count
pinSchema.statics.incrementLikes = async function(imageId, userId) {
  return this.findOneAndUpdate(
    { imageId },
    { 
      $addToSet: { likedBy: { userId, likedAt: new Date() } },
      $inc: { likeCount: 1 }
    },
    { new: true, upsert: true }
  );
};

// Static method to decrement like count
pinSchema.statics.decrementLikes = async function(imageId, userId) {
  return this.findOneAndUpdate(
    { imageId },
    { 
      $pull: { likedBy: { userId } },
      $inc: { likeCount: -1 }
    },
    { new: true }
  );
};

// Static method to increment save count
pinSchema.statics.incrementSaves = async function(imageId) {
  return this.findOneAndUpdate(
    { imageId },
    { $inc: { saveCount: 1 } },
    { new: true, upsert: true }
  );
};

// Static method to decrement save count
pinSchema.statics.decrementSaves = async function(imageId) {
  return this.findOneAndUpdate(
    { imageId },
    { $inc: { saveCount: -1 } },
    { new: true }
  );
};

module.exports = model('Pin', pinSchema);

import React, { useState } from 'react';
import api from '../utils/api';
import './ImageCard.css';

function ImageCard({ image, onClick }) {
  const [isSaved, setIsSaved] = useState(false);
  const aspectRatio = 
    image.height && image.width ? image.height / image.width : 1.5; // default to 3:2 if missing
  const photographer = image.photographer || 'Unknown';
  const alt = image.alt || 'Beautiful image';

  const handleSave = async (e) => {
    e.stopPropagation(); // Don't trigger card click

    // Check login using the correct token key
    const token = localStorage.getItem('pixora_token');
    if (!token) {
      alert('Please login to save pins');
      return;
    }

    // Optimistic UI update
    setIsSaved(true);

    try {
      await api.post('/api/search/save-pin', {
        imageId: image.id,
        imageUrl: image.src.large,
        alt: alt
      });
    } catch (err) {
      console.error("Failed to save", err);
      setIsSaved(false); // Revert on failure
    }
  };

  return (
    <div className="image-card-wrapper">
      <div
        className="image-card"
        style={{ 
          paddingBottom: `${(aspectRatio || 1.5)* 100}%` }}
        onClick={() => onClick(image.id)}
      >
        <img
          src={image?.src?.large || image?.src?.medium }
          alt={alt}
          className="image"
          loading="lazy"
        />
        <div className="image-overlay">
          {/* Save Button - Top Right */}
          <button
            className={`btn-save-pin ${isSaved ? 'saved' : ''}`}
            onClick={handleSave}
          >
            {isSaved ? 'Saved' : 'Save'}
          </button>

          <div className="image-overlay-content">
            {alt && (
              <div className="image-overlay-title">
                {alt.length > 50 ? `${alt.substring(0, 50)}...` : alt}
              </div>
            )}
            <div className="image-overlay-photographer">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:'4px',verticalAlign:'middle'}}>
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>{photographer}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageCard;
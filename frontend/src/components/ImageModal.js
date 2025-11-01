import React from 'react';
import './ImageModal.css';

function ImageModal({ image, onClose, onImageClick }) {
  if (!image) return null;

  const handleClick = () => {
    // Track this image click
    onImageClick(image);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* Image */}
        <div className="modal-image-container">
          <img 
            src={image.src.large} 
            alt={image.alt || 'Image'}
            className="modal-image"
          />
        </div>

        {/* Image Info */}
        <div className="modal-info">
          <div className="modal-header">
            <h2>{image.alt || 'Untitled Image'}</h2>
            <p className="photographer">
              Photo by <strong>{image.photographer}</strong>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="modal-actions">
            <button className="btn-save" onClick={handleClick}>
              💾 Save Pin
            </button>
            <a 
              href={image.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-view"
            >
              🔗 View on Pexels
            </a>
          </div>

          {/* Image Details */}
          <div className="modal-details">
            <p><strong>Image ID:</strong> {image.id}</p>
            <p><strong>Dimensions:</strong> {image.width} × {image.height}</p>
            <p><strong>Photographer ID:</strong> {image.photographer_id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageModal;

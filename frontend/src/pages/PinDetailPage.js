import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PinDetailPage.css';

function PinDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  // Fetch pin from backend (which fetches from Pexels)
  useEffect(() => {
    const fetchPinDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/search/pin/${id}`);
        setImage(response.data);
        setLoading(false);
        // Removed: Pin click tracking - will use later for other features
      } catch (error) {
        console.error('Error fetching pin:', error);
        setError('Pin not found');
        setLoading(false);
      }
    };

    fetchPinDetails();
  }, [id]);

  // Handle save pin
  const handleSavePin = () => {
    setIsSaved(!isSaved);
    console.log(isSaved ? 'Pin unsaved' : 'Pin saved');
  };

  // Handle share
  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'Check out this pin on Pixora',
        text: image.alt || 'Beautiful image',
        url: url
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="pin-detail-page">
        <div className="loading">Loading pin...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pin-detail-page">
        <div className="error">
          <h2>{error}</h2>
          <button onClick={() => navigate('/')} className="back-btn">
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="pin-detail-page">
        <div className="error">
          <h2>Pin not found</h2>
          <button onClick={() => navigate('/')} className="back-btn">
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pin-detail-page">
      {/* Header with Back Button */}
      <div className="pin-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>
      </div>

      {/* Main Pin Container */}
      <div className="pin-main-container">
        {/* Image Section */}
        <div className="pin-image-container">
          <img 
            src={image.src.large} 
            alt={image.alt || 'Pin image'}
            className="pin-image"
          />
        </div>

        {/* Right Sidebar Info */}
        <div className="pin-sidebar">
          {/* Action Buttons */}
          <div className="pin-actions">
            <button 
              className={`btn-save ${isSaved ? 'saved' : ''}`}
              onClick={handleSavePin}
            >
              {isSaved ? '✓ Saved' : '💾 Save'}
            </button>
            <button className="btn-share" onClick={handleShare}>
              🔗 Share
            </button>
          </div>

          {/* Photographer/User Section */}
          <div className="photographer-section">
            <div className="photographer-header">
              <div className="photographer-avatar">
                {image.photographer ? image.photographer.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="photographer-info">
                <h3 className="photographer-name">
                  {image.photographer || 'Unknown User'}
                </h3>
                <p className="photographer-role">Photographer</p>
              </div>
            </div>
            <button className="btn-follow">Follow</button>
          </div>

          {/* About Section */}
          <div className="about-section">
            <h3>About</h3>
            <p className="pin-title">{image.alt || 'Beautiful Image'}</p>
            <p className="pin-description">
              This is a beautiful and inspiring image shared by {image.photographer || 'our photographer'}. 
              Save this pin to your boards and come back to it whenever you need inspiration!
            </p>
            
            {/* Source Link */}
            <div className="source-link">
              <a 
                href={image.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="view-source"
              >
                View source on Pexels →
              </a>
            </div>
          </div>

          {/* Related Tags (Future Feature) */}
          <div className="tags-section">
            <h3>Tags</h3>
            <div className="tags">
              <span className="tag">Photography</span>
              <span className="tag">Inspiration</span>
              <span className="tag">Art</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Pins Section */}
      <div className="related-section">
        <h2>More from this photographer</h2>
        <p style={{ color: '#4A4A4A' }}>More pins coming soon!</p>
      </div>
    </div>
  );
}

export default PinDetailPage;

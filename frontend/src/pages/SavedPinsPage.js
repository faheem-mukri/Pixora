import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSavedPins } from '../utils/api';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import ImageCard from '../components/ImageCard';
import './SavedPinsPage.css';

function SavedPinsPage() {
  const navigate = useNavigate();
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchSavedPins = useCallback(async (pageNum = 1) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await getSavedPins(pageNum, 20);
      
      if (pageNum === 1) {
        setPins(response.pins);
      } else {
        setPins(prev => [...prev, ...response.pins]);
      }
      
      setHasMore(response.hasMore);
      setPage(pageNum);
      setError(null);
    } catch (err) {
      console.error('Error fetching saved pins:', err);
      setError('Failed to load saved pins');
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('pixora_token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchSavedPins();
  }, [navigate, fetchSavedPins]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchSavedPins(page + 1);
    }
  };

  const handlePinClick = (imageId) => {
    navigate(`/pin/${imageId}`);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="saved-pins-page">
        <div className="saved-pins-header">
          <h1>My Saved Pins</h1>
          <p className="saved-pins-subtitle">Loading your collection...</p>
        </div>
        <div className="saved-pins-skeleton">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="pin-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error && pins.length === 0) {
    return (
      <div className="saved-pins-page">
        <div className="saved-pins-empty">
          <span className="empty-icon">⚠️</span>
          <h2>{error}</h2>
          <button onClick={() => fetchSavedPins(1)} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (pins.length === 0) {
    return (
      <div className="saved-pins-page">
        <div className="saved-pins-header">
          <h1>My Saved Pins</h1>
          <p className="saved-pins-subtitle">Your collection is empty</p>
        </div>
        <div className="saved-pins-empty">
          <span className="empty-icon">📌</span>
          <h2>No Saved Pins Yet</h2>
          <p>Start exploring and save pins you love!</p>
          <button onClick={() => navigate('/home')} className="explore-btn">
            Explore Pins
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-pins-page">
      <div className="saved-pins-header">
        <h1>My Saved Pins</h1>
        <p className="saved-pins-subtitle">
          {pins.length} {pins.length === 1 ? 'pin' : 'pins'} saved
        </p>
      </div>

      <div className="saved-pins-container">
        <ResponsiveMasonry
          columnsCountBreakPoints={{ 350: 2, 750: 3, 900: 4, 1200: 5 }}
        >
          <Masonry gutter="16px">
            {pins.map((pin) => (
              <ImageCard
                key={pin.id}
                image={pin}
                onClick={() => handlePinClick(pin.id)}
              />
            ))}
          </Masonry>
        </ResponsiveMasonry>
      </div>

      {/* Load more button */}
      {hasMore && (
        <div className="load-more-container">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="load-more-btn"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Loading indicator */}
      {loadingMore && (
        <div className="loading-more">
          <div className="spinner" />
        </div>
      )}
    </div>
  );
}

export default SavedPinsPage;

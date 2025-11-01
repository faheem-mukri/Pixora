import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth  } from '../hooks/useAuth';
import { useRecommendations } from '../hooks/useRecommendations';
import './RecommendationsBanner.css';

function RecommendationsBanner() {
  const [hasRecommendations, setHasRecommendations] = useState(false);
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const { recommendations, loading } = useRecommendations();

  useEffect(() => {
    if (isAuthenticated && token && recommendations.length > 0) {
      setHasRecommendations(true);
    } else {
      setHasRecommendations(false);
    }
  }, [recommendations, isAuthenticated, token]);

  // Don't show if not authenticated or no recommendations
  if (!isAuthenticated || !hasRecommendations) {
    return null;
  }

  return (
    <div className="recommendations-banner">
      <button 
        className="banner-button"
        onClick={() => navigate('/recommendations')}
      >
        <span className="banner-icon"></span>
        <span className="banner-text">Recommended For You</span>
        <span className="banner-arrow">→</span>
      </button>
    </div>
  );
}

export default RecommendationsBanner;

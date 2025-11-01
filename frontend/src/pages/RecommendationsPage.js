import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useRecommendations } from '../hooks/useRecommendations';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import './RecommendationsPage.css';

function RecommendationsPage() {
  const navigate = useNavigate();
  const { recommendations, basedOn, loading, refetch } = useRecommendations();

  const handleImageClick = (imageId) => {
    navigate(`/pin/${imageId}`);
  };

  return (
    <div className="recommendations-page">
      {/* Header */}
      <div className="recommendations-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>
      </div>

      {/* Masonry Grid */}
      {!loading && recommendations.length > 0 && (
        <InfiniteScroll
          dataLength={recommendations.length}
          next={() => {}}
          hasMore={false}
          loader={<LoadingSpinner key="loader" />}
          threshold={0.8}
        >
          <ResponsiveMasonry
            columnsCountBreakPoints={{ 350: 3, 750: 4, 900: 5, 1200: 6 }}
          >
            <Masonry gutter="15px">
              {recommendations.map((image) => {
                const aspectRatio = image.height / image.width;
                
                return (
                  <div key={image.id} className="image-card-wrapper">
                    <div 
                      className="image-card"
                      style={{
                        paddingBottom: `${aspectRatio * 100}%`
                      }}
                      onClick={() => handleImageClick(image.id)}
                    >
                      <img
                        src={image.src.large}
                        alt={image.alt || 'Recommended image'}
                        className="image"
                      />
                    </div>
                  </div>
                );
              })}
            </Masonry>
          </ResponsiveMasonry>
        </InfiniteScroll>
      )}

      {/* No recommendations */}
      {!loading && recommendations.length === 0 && (
        <div className="no-recommendations">
          <h2>No recommendations yet</h2>
          <p>Start searching and clicking on images to get personalized recommendations!</p>
          <button onClick={() => navigate('/')} className="btn-home">
            Go to Home
          </button>
        </div>
      )}
      
    </div>
  );
}

export default RecommendationsPage;

import React, { useState, useEffect, useCallback} from 'react';
import { useNavigate } from 'react-router-dom';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import InfiniteScroll from 'react-infinite-scroll-component';
import api from '../utils/api';
import SkeletonLoader from '../components/SkeletonLoader';
import ImageCard from '../components/ImageCard';
import './RecommendationsPage.css';

function RecommendationsPage() {
  const navigate = useNavigate();

  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const fetchRecommendations = useCallback(async (pageNum) => {
    try {
      const res = await api.get('/api/search/recommendations', {
        params: { page: pageNum }
      });

      const photos = res.data.recommendations || [];

      setImages(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const fresh = photos.filter(p => !existingIds.has(p.id));
        return [...prev, ...fresh];
      });

      // Keep going as long as backend returns results
      if (!res.data.hasMore || photos.length === 0) setHasMore(false);

      setIsInitialLoading(false);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setIsInitialLoading(false);
      setHasMore(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations(1);
  }, [fetchRecommendations]);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchRecommendations(nextPage);
  }, [page, fetchRecommendations]);

  const handleImageClick = (imageId) => navigate(`/pin/${imageId}`);

  return (
    <div className="recommendations-page">
      {/* Header */}
      <div className="recommendations-header">
          <h1>Recommendations for you</h1>
      </div>

      {isInitialLoading ? (
        <SkeletonLoader count={24} columns={6} />
      ) : images.length === 0 ? (
        <div className="no-recommendations">
          <div className="no-recommendations-icon">✨</div>
          <h2>No recommendations yet</h2>
          <p>Search for a few topics first and we'll personalise your feed.</p>
          <button onClick={() => navigate('/')} className="btn-home">Explore images</button>
        </div>
      ) : (
        <InfiniteScroll
          dataLength={images.length}
          next={loadMore}
          hasMore={hasMore}
          scrollThreshold={0.7}
        >
          <ResponsiveMasonry
            columnsCountBreakPoints={{ 350: 2, 750: 3, 900: 4, 1200: 5, 1500: 6 }}
          >
            <Masonry gutter="12px">
              {images.map((image) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  onClick={handleImageClick}
                />
              ))}
            </Masonry>
          </ResponsiveMasonry>
        </InfiniteScroll>
      )}
    </div>
  );
}

export default RecommendationsPage;
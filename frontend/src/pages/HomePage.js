import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import InfiniteScroll from 'react-infinite-scroll-component';
import SkeletonLoader from '../components/SkeletonLoader';
import ImageCard from '../components/ImageCard';
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();

  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const fetchCurated = useCallback(async (pageNum) => {
    try {
      const res = await api.get('/api/search/curated', {
        params: { page: pageNum, per_page: 30 }
      });

      const photos = res.data.photos || [];

      setImages(prev => {
        // Deduplicate
        const existingIds = new Set(prev.map(p => p.id));
        const fresh = photos.filter(p => !existingIds.has(p.id));
        return [...prev, ...fresh];
      });

      // Pexels curated has ~8000 photos — keep going until empty
      if (photos.length < 30) setHasMore(false);

      setIsInitialLoading(false);
    } catch (err) {
      console.error('Failed to fetch curated:', err);
      setIsInitialLoading(false);
    }
  }, []);

  // Load page 1 on mount
  useEffect(() => {
    fetchCurated(1);
  }, [fetchCurated]);

  // Pass current page explicitly to avoid stale closure
  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCurated(nextPage);
  }, [page, fetchCurated]);

  const handleImageClick = (imageId) => navigate(`/pin/${imageId}`);

  return (
    <div className="home-page">
      {isInitialLoading ? (
        <SkeletonLoader count={30} columns={6} />
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

export default HomePage;

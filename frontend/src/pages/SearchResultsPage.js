import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import SkeletonLoader from '../components/SkeletonLoader';
import ImageCard from '../components/ImageCard';
import UserCard from '../components/UserCard';
import './SearchResultsPage.css';

function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const [images, setImages] = useState([]);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const query = searchParams.get('q') || '';
  const isUserSearch = query.trim().startsWith('@');

  // Fetch search results
  const fetchImages = async (isNewSearch = false) => {
    try {
      const currentPage = isNewSearch ? 1 : page;

      if (isUserSearch) {
        // Search for users
        const response = await api.get('/api/search/users', {
          params: { query }
        });
        setUsers(response.data.users || []);
        setHasMore(false);
        setIsLoading(false);
      } else {
        // Search for images
        const response = await api.get('/api/search/images', {
          params: {
            query,
            page: currentPage,
            per_page: 30
          }
        });

        if (isNewSearch) {
          setImages(response.data.photos);
          setPage(2);
          setIsLoading(false);

          // Save search to history
          if (isAuthenticated) {
            saveSearchToHistory(query);
          }
        } else {
          setImages(prev => [...prev, ...response.data.photos]);
          setPage(prev => prev + 1);
        }

        if (response.data.photos.length < 30) {
          setHasMore(false);
        }
      }
    } catch (error) {
      setIsLoading(false);
    }
  };

  // Save search to MongoDB
  const saveSearchToHistory = async (searchQuery) => {
    try {
      await api.post('/api/search/save-search', { query: searchQuery });
    } catch (error) {
      // Silently fail - search history saving is not critical
    }
  };

  // Fetch images when query changes
  useEffect(() => {
    if (query) {
      setPage(1);
      setHasMore(true);
      setIsLoading(true);
      fetchImages(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Handle image click - navigate to pin detail page
  const handleImageClick = (imageId) => {
    navigate(`/pin/${imageId}`);
  };

  const popularSearches = ['nature', 'mountains', 'ocean', 'sunset', 'flowers', 'animals', 'architecture', 'food'];

  return (
    <div className="search-results-page">
      {/* Header */}
      <div className="search-header">
        <h1 className='search-query'>
          {isUserSearch ? `Users matching "${query}"` : `Search results for "${query}"`}
        </h1>
      </div>

      {/* Loading State */}
      {isLoading ? (
        isUserSearch ? (
          <div className="users-loading">
            <div className="spinner"></div>
            <p>Searching for users...</p>
          </div>
        ) : (
          <SkeletonLoader count={24} columns={6} />
          )
        ) : isUserSearch ? (
          /* User Search Results */
          users.length > 0 ? (
            <div className="users-results">
              {users.map((user) => (
                <UserCard key={user.username} user={user} />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">👤</div>
              <h2>No users found matching "{query}"</h2>
              <p>Try searching with a different username or check the spelling.</p>
            </div>
          )
      ) : (
        /* Image Search Results */
        images.length > 0 ? (
          <InfiniteScroll
            dataLength={images.length}
            next={() => fetchImages(false)}
            hasMore={hasMore}
            threshold={0.8}
          >
            <ResponsiveMasonry
              columnsCountBreakPoints={{ 350: 2, 750: 3, 900: 4, 1200: 5, 1500: 6 }}
            >
              <Masonry gutter="15px">
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
        ) : (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h2>No images found for "{query}"</h2>
            <p>Try searching for something else or explore these popular searches:</p>
            <div className="no-results-suggestions">
              {popularSearches.map((search, index) => (
                <button
                  key={index}
                  className="suggestion-tag"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(search)}`)}
                >
                  {search}
              </button>
            ))}
          </div>
        </div>
        ))
      }
    </div>
  );
}
export default SearchResultsPage;
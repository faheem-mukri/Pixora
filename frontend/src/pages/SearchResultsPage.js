import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import './SearchResultsPage.css';

function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const query = searchParams.get('q') || '';

  // Fetch search results
  const fetchImages = async (isNewSearch = false) => {
    try {
      const currentPage = isNewSearch ? 1 : page;
      
      const response = await axios.get(
        `http://localhost:5000/api/search/images?query=${query}&page=${currentPage}&per_page=30`
      );

      if (isNewSearch) {
        setImages(response.data.photos);
        setPage(2);
        setIsLoading(false);

        // Save search to history
        if (token) {
          saveSearchToHistory(query);
        }
      } else {
        setImages([...images, ...response.data.photos]);
        setPage(page + 1);
      }

      if (response.data.photos.length < 30) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      setIsLoading(false);
    }
  };

  // Save search to MongoDB
  const saveSearchToHistory = async (searchQuery) => {
    try {
      await axios.post('http://localhost:5000/api/search/save-search',
        { query: searchQuery },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      console.log('Search saved to history');
    } catch (error) {
      console.error('Error saving search:', error);
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
  }, [query]);

  // Handle image click - navigate to pin detail page
  const handleImageClick = (imageId) => {
    navigate(`/pin/${imageId}`);
  };

  return (
    <div className="search-results-page">

      {/* Masonry Grid */}

      {!isLoading && (
        <InfiniteScroll
          dataLength={images.length}
          next={() => fetchImages(false)}
          hasMore={hasMore}
          loader={<LoadingSpinner key="loader" />}
                    threshold={0.8}
        >
          <ResponsiveMasonry
            columnsCountBreakPoints={{ 350: 3, 750: 4, 900: 5, 1200: 6 }}
          >
            <Masonry gutter="15px">
              {images.map((image) => {
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
                        alt={image.alt || 'Image'}
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

      {/* No results message */}
      {!isLoading && images.length === 0 && (
        <div className="no-results">
          <h2>No images found for "{query}"</h2>
          <p>Try searching for something else</p>
        </div>
      )}
    </div>
  );
}

export default SearchResultsPage;

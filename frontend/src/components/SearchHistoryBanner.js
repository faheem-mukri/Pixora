import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import './SearchHistoryBanner.css';

function SearchHistoryBanner() {
  const [searchHistory, setSearchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchSearchHistory();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchSearchHistory = async () => {
    try {
      const response = await api.get('/api/search/history');

      // Get unique searches in order of most recent
      const uniqueSearches = [];
      const seen = new Set();
      
      // Iterate from end to beginning to get most recent first
      for (let i = response.data.searchHistory.length - 1; i >= 0; i--) {
        const query = response.data.searchHistory[i].query;
        if (!seen.has(query.toLowerCase())) {
          uniqueSearches.push(query);
          seen.add(query.toLowerCase());
        }
      }

      setSearchHistory(uniqueSearches.slice(0, 10)); // Limit to 10 most recent
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  // Don't show if not authenticated or no history
  if (!isAuthenticated || !searchHistory || searchHistory.length === 0) {
    return null;
  }

  const handleTagClick = (query) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  // Navigate home without a full page reload
  const handleHistoryClick = () => {
    navigate('/home');
  };

  return (
    <div className="search-history-banner">
      <div className="search-history-scroll">
        {/* History Label - Just refresh */}
        <button
          className="search-tag history-tag"
          onClick={handleHistoryClick}
          title="Back to Home"
        >
          📋 History
        </button>

        {/* Search Tags */}
        {searchHistory.map((query, index) => (
          <button
            key={index}
            className="search-tag"
            onClick={() => handleTagClick(query)}
            title={`Search for ${query}`}
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  );
}

export default SearchHistoryBanner;
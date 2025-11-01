import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

export const RecommendationsContext = createContext();

export function RecommendationsProvider({ children }) {
  const [recommendations, setRecommendations] = useState([]);
  const [basedOn, setBasedOn] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token, isAuthenticated } = useAuth();

  // Fetch recommendations in background
  const fetchRecommendations = async () => {
    if (!isAuthenticated || !token) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        'http://localhost:5000/api/search/recommendations',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setRecommendations(response.data.recommendations || []);
      setBasedOn(response.data.basedOn || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Fetch recommendations on mount and when token changes
  useEffect(() => {
    if (isAuthenticated && token) {
      // Fetch immediately
      fetchRecommendations();

      // Re-fetch every 2 minutes to keep data fresh
      const interval = setInterval(fetchRecommendations, 2 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [token, isAuthenticated]);

  const value = {
    recommendations,
    basedOn,
    loading,
    error,
    refetch: fetchRecommendations
  };

  return (
    <RecommendationsContext.Provider value={value}>
      {children}
    </RecommendationsContext.Provider>
  );
}

import React, { createContext, useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';

export const RecommendationsContext = createContext();

export function RecommendationsProvider({ children }) {
  const [basedOn, setBasedOn] = useState([]);
  const [hasHistory, setHasHistory] = useState(false);
  const { isAuthenticated } = useAuth();
  const hasFetched = useRef(false); // prevent refetch on re-renders

  useEffect(() => {
    if (!isAuthenticated) {
      setHasHistory(false);
      setBasedOn([]);
      hasFetched.current = false;
      return;
    }

    // Only fetch once per session — context rerenders shouldn't retrigger API calls
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchMeta = async () => {
      try {
        const res = await api.get('/api/search/recommendations', {
          params: { page: 1 }
        });
        const terms = res.data.basedOn || [];
        setBasedOn(terms);
        setHasHistory(terms.length > 0);
      } catch (_) {}
    };

    fetchMeta();
  }, [isAuthenticated]);

  return (
    <RecommendationsContext.Provider value={{ basedOn, hasHistory }}>
      {children}
    </RecommendationsContext.Provider>
  );
}
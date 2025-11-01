import { useContext } from 'react';
import { RecommendationsContext } from '../context/RecommendationsContext';

export function useRecommendations() {
  const context = useContext(RecommendationsContext);
  if (!context) {
    throw new Error('useRecommendations must be used within RecommendationsProvider');
  }
  return context;
}

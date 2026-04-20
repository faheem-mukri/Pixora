import React from 'react';
import './SkeletonLoader.css';

function SkeletonLoader({ count = 6, columns = 5 }) {
  return (
    <div className="skeleton-grid" style={{ 
      gridTemplateColumns: `repeat(${columns}, 1fr)`
    }}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton skeleton-image" />
      ))}
    </div>
  );
}

export default SkeletonLoader;

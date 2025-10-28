import React from 'react';

interface SkeletonLoaderProps {
  count?: number;
}

export function SkeletonLoader({ count = 3 }: SkeletonLoaderProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="p-4 border border-gray-200 rounded-md mb-2 animate-pulse"
        >
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-100 rounded w-1/2"></div>
        </div>
      ))}
    </>
  );
}
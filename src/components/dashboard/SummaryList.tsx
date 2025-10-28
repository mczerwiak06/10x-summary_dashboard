import React, { useRef, useEffect } from 'react';
import { SummaryCard } from './SummaryCard';
import { SkeletonLoader } from './SkeletonLoader';
import type { SummaryListItemDto } from '~/types';

interface SummaryListProps {
  summaries: SummaryListItemDto[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  selectedSummaryId: string | null;
  onFetchNextPage: () => void;
  onSelectSummary: (id: string) => void;
}

export function SummaryList({
  summaries,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  selectedSummaryId,
  onFetchNextPage,
  onSelectSummary
}: SummaryListProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          onFetchNextPage();
        }
      },
      { threshold: 0.5 }
    );
    
    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }
    
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, onFetchNextPage]);
  
  if (isLoading && summaries.length === 0) {
    return <SkeletonLoader count={5} />;
  }
  
  if (summaries.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No summaries found. Add a transcript to get started.
      </div>
    );
  }
  
  return (
    <div className="space-y-2 overflow-y-auto">
      {summaries.map((summary) => (
        <SummaryCard
          key={summary.id}
          summary={summary}
          isSelected={summary.id === selectedSummaryId}
          onClick={onSelectSummary}
        />
      ))}
      
      {(hasNextPage || isFetchingNextPage) && (
        <div ref={observerTarget} className="py-2">
          {isFetchingNextPage && <SkeletonLoader count={1} />}
        </div>
      )}
    </div>
  );
}
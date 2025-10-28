import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { SummaryListItemDto } from '~/types';

interface SummaryCardProps {
  summary: SummaryListItemDto;
  isSelected: boolean;
  onClick: (id: string) => void;
}

export function SummaryCard({ summary, isSelected, onClick }: SummaryCardProps) {
  // Extract the first line as the title
  const title = summary.summaryMarkdown
    .split('\n')
    .find(line => line.trim().startsWith('# ') || line.trim().startsWith('## '))
    ?.replace(/^#+\s+/, '') || 'Untitled Summary';
  
  // Get a preview of the content (skip headings)
  const previewText = summary.summaryMarkdown
    .split('\n')
    .filter(line => !line.trim().startsWith('#'))
    .join(' ')
    .slice(0, 100) + (summary.summaryMarkdown.length > 100 ? '...' : '');
  
  // Format the date
  const timeAgo = formatDistanceToNow(new Date(summary.updatedAt), { addSuffix: true });
  
  return (
    <div
      className={`p-4 border rounded-md mb-2 cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-primary/10 border-primary/30' 
          : 'hover:bg-gray-50 border-gray-200'
      }`}
      onClick={() => onClick(summary.id)}
    >
      <h3 className="font-medium text-sm line-clamp-1">{title}</h3>
      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{previewText}</p>
      <div className="text-xs text-gray-400 mt-2">{timeAgo}</div>
    </div>
  );
}
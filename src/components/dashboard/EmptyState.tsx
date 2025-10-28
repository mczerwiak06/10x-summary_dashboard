import React from 'react';
import { FileText, Plus } from 'lucide-react';
import { Button } from '../ui/button';

interface EmptyStateProps {
  hasSummaries: boolean;
  onAddTranscript: () => void;
}

export function EmptyState({ hasSummaries, onAddTranscript }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="bg-gray-100 p-4 rounded-full mb-4">
        <FileText className="h-12 w-12 text-gray-500" />
      </div>
      
      <h2 className="text-2xl font-semibold mb-2">
        {hasSummaries 
          ? "Select a summary to view" 
          : "No summaries yet"}
      </h2>
      
      <p className="text-gray-500 mb-6 max-w-md">
        {hasSummaries 
          ? "Choose a summary from the sidebar to view its details" 
          : "Get started by adding a transcript to generate your first summary"}
      </p>
      
      {!hasSummaries && (
        <Button onClick={onAddTranscript}>
          <Plus className="h-4 w-4 mr-2" />
          Add Transcript
        </Button>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

interface PreviewViewProps {
  summaryMarkdown: string;
  onSummaryChange: (markdown: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function PreviewView({
  summaryMarkdown,
  onSummaryChange,
  onSave,
  isSaving
}: PreviewViewProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Generated Summary</h3>
        <p className="text-sm text-gray-500 mb-4">
          Review and edit the summary below before saving.
        </p>
      </div>
      
      <div className="flex-grow mb-4">
        <Textarea
          className="h-full min-h-[300px] font-mono"
          value={summaryMarkdown}
          onChange={(e) => onSummaryChange(e.target.value)}
          placeholder="Summary content..."
        />
      </div>
      
      <div className="flex justify-end">
        <Button 
          onClick={onSave} 
          disabled={isSaving || !summaryMarkdown.trim()}
        >
          {isSaving ? 'Saving...' : 'Save Summary'}
        </Button>
      </div>
    </div>
  );
}


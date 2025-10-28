import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Save, X } from 'lucide-react';
import type { SummaryDto, UpdateSummaryCommand } from '~/types';

interface EditSummaryFormProps {
  summary: SummaryDto;
  onSave: (id: string, data: UpdateSummaryCommand) => void;
  onCancel: () => void;
}

export function EditSummaryForm({ summary, onSave, onCancel }: EditSummaryFormProps) {
  const [summaryMarkdown, setSummaryMarkdown] = useState(summary.summaryMarkdown);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = () => {
    if (summaryMarkdown.trim()) {
      setIsSaving(true);
      onSave(summary.id, { summaryMarkdown });
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Edit Summary</h2>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onCancel}
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={isSaving || !summaryMarkdown.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
      
      <div className="flex-grow">
        <Textarea
          className="h-full min-h-[400px] font-mono"
          value={summaryMarkdown}
          onChange={(e) => setSummaryMarkdown(e.target.value)}
          disabled={isSaving}
        />
      </div>
    </div>
  );
}
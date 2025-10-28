import React from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle } from 'lucide-react';

interface SubmitFormProps {
  transcriptText: string;
  wordCount: number;
  maxWordCount?: number;
  onTextChange: (text: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function SubmitForm({
  transcriptText,
  wordCount,
  maxWordCount = 1000,
  onTextChange,
  onSubmit,
  isSubmitting
}: SubmitFormProps) {
  const isOverLimit = wordCount > maxWordCount;
  const isSubmitDisabled = isSubmitting || isOverLimit || wordCount === 0;
  
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Add Transcript</h3>
        <p className="text-sm text-gray-500">
          Paste your transcript text below to generate a summary.
        </p>
      </div>
      
      <div className="flex-grow mb-4">
        <Textarea
          className="h-full min-h-[300px]"
          value={transcriptText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Paste your transcript here..."
          disabled={isSubmitting}
        />
        
        <div className="flex justify-between mt-2 text-sm">
          <div className={isOverLimit ? 'text-red-500' : 'text-gray-500'}>
            {wordCount} / {maxWordCount} words
          </div>
          {isOverLimit && (
            <div className="text-red-500">
              Exceeds maximum word count
            </div>
          )}
        </div>
      </div>
      
      {isOverLimit && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            The transcript exceeds the maximum word count of {maxWordCount}. Please shorten it.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-end">
        <Button 
          onClick={onSubmit} 
          disabled={isSubmitDisabled}
        >
          {isSubmitting ? 'Submitting...' : 'Summarise'}
        </Button>
      </div>
    </div>
  );
}
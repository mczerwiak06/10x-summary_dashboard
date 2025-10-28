import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AddTranscriptButtonProps {
  onClick: () => void;
  summaryCount: number;
  maxSummaries?: number;
}

export function AddTranscriptButton({
  onClick,
  summaryCount,
  maxSummaries = 20,
}: AddTranscriptButtonProps) {
  const isDisabled = summaryCount >= maxSummaries;

  const button = (
    <Button
      onClick={onClick}
      disabled={isDisabled}
      className="flex items-center"
    >
      <Plus className="h-4 w-4 mr-2" />
      Add Transcript
    </Button>
  );

  if (isDisabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>You've reached the maximum limit of {maxSummaries} summaries.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
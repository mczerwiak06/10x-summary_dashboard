import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProgressViewProps {
  transcriptId: string | null;
}

export function ProgressView({ transcriptId }: ProgressViewProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h3 className="text-lg font-semibold mb-2">Generating summary...</h3>
      <p className="text-sm text-gray-500 mb-4">
        We're processing your transcript and creating a summary.
        This may take a minute or two.
      </p>
      {transcriptId && (
        <p className="text-xs text-gray-400">
          Transcript ID: {transcriptId}
        </p>
      )}
    </div>
  );
}


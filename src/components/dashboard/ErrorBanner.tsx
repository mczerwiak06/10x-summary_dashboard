import React from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div className="w-full bg-red-50 border border-red-200 rounded-md p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-red-800">{message}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </div>
    </div>
  );
}
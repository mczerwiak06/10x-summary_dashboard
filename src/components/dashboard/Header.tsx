import React from 'react';
import { AddTranscriptButton } from './AddTranscriptButton';
import { AvatarMenu } from './AvatarMenu';

interface HeaderProps {
  summaryCount: number;
  onAddTranscriptClick: () => void;
}

export function Header({ summaryCount, onAddTranscriptClick }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-900 mr-8">Summary Dashboard</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <AddTranscriptButton
            onClick={onAddTranscriptClick}
            summaryCount={summaryCount}
          />
          <AvatarMenu />
        </div>
      </div>
    </header>
  );
}
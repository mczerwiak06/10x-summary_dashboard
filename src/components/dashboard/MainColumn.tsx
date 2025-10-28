import React from 'react';

interface MainColumnProps {
  children: React.ReactNode;
}

export function MainColumn({ children }: MainColumnProps) {
  return (
    <main className="w-2/3 pl-6 overflow-hidden">
      {children}
    </main>
  );
}
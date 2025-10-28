import React from 'react';

interface SidebarProps {
  children: React.ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="w-1/3 pr-6 border-r border-gray-200">
      {children}
    </aside>
  );
}
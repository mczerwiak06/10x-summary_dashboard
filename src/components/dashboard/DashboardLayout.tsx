import React from 'react';
import { Sidebar } from './Sidebar';
import { MainColumn } from './MainColumn';

interface DashboardLayoutProps {
  sidebarContent: React.ReactNode;
  mainContent: React.ReactNode;
}

export function DashboardLayout({ sidebarContent, mainContent }: DashboardLayoutProps) {
  return (
    <div className="container mx-auto px-4 py-6 flex h-[calc(100vh-4rem)]">
      <Sidebar>
        <div className="h-full overflow-hidden flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Your Summaries</h2>
          <div className="flex-grow overflow-y-auto pr-2">
            {sidebarContent}
          </div>
        </div>
      </Sidebar>
      
      <MainColumn>
        {mainContent}
      </MainColumn>
    </div>
  );
}
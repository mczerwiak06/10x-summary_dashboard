import React from 'react';
import { QueryProvider } from '../providers/QueryProvider';
import { DashboardPage } from './DashboardPage';

export function ClientDashboard() {
  return (
    <QueryProvider>
      <DashboardPage />
    </QueryProvider>
  );
}

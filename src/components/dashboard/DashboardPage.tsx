import React, { useState } from 'react';
import { Header } from './Header';
import { ErrorBanner } from './ErrorBanner';
import { DashboardLayout } from './DashboardLayout';
import { SummaryList } from './SummaryList';
import { SummaryDetail } from './SummaryDetail';
import { EditSummaryForm } from './EditSummaryForm';
import { EmptyState } from './EmptyState';
import { TranscriptModal } from './TranscriptModal';
import { useDashboardState } from '../../hooks/useDashboardState';

// Check if we're running in the browser
const isBrowser = typeof window !== 'undefined';

export function DashboardPage() {
  // If we're not in the browser, return a loading placeholder
  if (!isBrowser) {
    return <div>Loading dashboard...</div>;
  }
  
  const { viewModel, actions } = useDashboardState();
  const [isEditing, setIsEditing] = useState(false);
  
  // Determine what to show in the main column
  const renderMainContent = () => {
    // If a summary is selected
    if (viewModel.selectedSummaryId && viewModel.selectedSummary) {
      // If in editing mode
      if (isEditing) {
        return (
          <EditSummaryForm
            summary={viewModel.selectedSummary}
            onSave={actions.updateSummary}
            onCancel={() => setIsEditing(false)}
          />
        );
      }
      
      // Otherwise show the detail view
      return (
        <SummaryDetail
          summary={viewModel.selectedSummary}
          onEdit={() => setIsEditing(true)}
          onDelete={actions.deleteSummary}
        />
      );
    }
    
    // If no summary is selected, show empty state
    return (
      <EmptyState
        hasSummaries={viewModel.summaries.length > 0}
        onAddTranscript={actions.openModal}
      />
    );
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header
        summaryCount={viewModel.summaryCount}
        onAddTranscriptClick={actions.openModal}
      />
      
      <div className="flex-grow overflow-hidden">
        {viewModel.errorMessage && (
          <div className="container mx-auto px-4 pt-4">
            <ErrorBanner
              message={viewModel.errorMessage}
              onDismiss={actions.dismissError}
            />
          </div>
        )}
        
        <DashboardLayout
          sidebarContent={
            <SummaryList
              summaries={viewModel.summaries}
              isLoading={viewModel.isLoading}
              hasNextPage={viewModel.hasNextPage}
              isFetchingNextPage={viewModel.isFetchingNextPage}
              selectedSummaryId={viewModel.selectedSummaryId}
              onFetchNextPage={actions.fetchNextPage}
              onSelectSummary={(id) => {
                actions.selectSummary(id);
                setIsEditing(false);
              }}
            />
          }
          mainContent={renderMainContent()}
        />
      </div>
      
      <TranscriptModal
        isOpen={viewModel.isTranscriptModalOpen}
        onClose={actions.closeModal}
      />
    </div>
  );
}
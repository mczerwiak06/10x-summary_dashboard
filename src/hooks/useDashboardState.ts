import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { 
  SummaryListItemDto, 
  SummaryDto, 
  UpdateSummaryCommand 
} from '../types';

/**
 * Interface for the dashboard view model
 */
interface DashboardViewModel {
  // Data from useInfiniteQuery for the summary list
  summaries: SummaryListItemDto[];
  summaryCount: number;
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;

  // State for the selected summary detail view
  selectedSummaryId: string | null;
  selectedSummary: SummaryDto | null;
  isSummaryDetailLoading: boolean;

  // State for the modal
  isTranscriptModalOpen: boolean;
  
  // Error state
  errorMessage: string | null;
}

/**
 * Custom hook to manage dashboard state
 */
export function useDashboardState() {
  const queryClient = useQueryClient();
  const [selectedSummaryId, setSelectedSummaryId] = useState<string | null>(null);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch paginated summaries
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isSummariesLoading
  } = useInfiniteQuery({
    queryKey: ['summaries'],
    queryFn: async ({ pageParam }) => {
      const url = pageParam ? `/api/summaries?cursor=${pageParam}` : '/api/summaries';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch summaries');
      }
      
      return response.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined
  });

  // Flatten the pages of summaries
  const summaries = data?.pages.flatMap(page => page.items) || [];
  const summaryCount = summaries.length;

  // Fetch selected summary details
  const {
    data: selectedSummary,
    isLoading: isSummaryDetailLoading
  } = useQuery({
    queryKey: ['summary', selectedSummaryId],
    queryFn: async () => {
      if (!selectedSummaryId) return null;
      
      const response = await fetch(`/api/summaries/${selectedSummaryId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch summary details');
      }
      
      return response.json();
    },
    enabled: !!selectedSummaryId
  });

  // Update summary mutation
  const updateSummaryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: UpdateSummaryCommand }) => {
      const response = await fetch(`/api/summaries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update summary');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch queries related to this summary
      queryClient.invalidateQueries({ queryKey: ['summary', data.id] });
      queryClient.invalidateQueries({ queryKey: ['summaries'] });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
    }
  });

  // Delete summary mutation
  const deleteSummaryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/summaries/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete summary');
      }
      
      return id;
    },
    onSuccess: (id) => {
      // Optimistically update the UI
      if (selectedSummaryId === id) {
        setSelectedSummaryId(null);
      }
      
      // Invalidate and refetch the summaries list
      queryClient.invalidateQueries({ queryKey: ['summaries'] });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
    }
  });

  // Handler functions
  const handleSelectSummary = (id: string) => {
    setSelectedSummaryId(id);
  };

  const handleOpenModal = () => {
    setIsTranscriptModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsTranscriptModalOpen(false);
  };

  const handleUpdateSummary = (id: string, data: UpdateSummaryCommand) => {
    updateSummaryMutation.mutate({ id, data });
  };

  const handleDeleteSummary = (id: string) => {
    deleteSummaryMutation.mutate(id);
  };

  const handleDismissError = () => {
    setErrorMessage(null);
  };

  return {
    // View model
    viewModel: {
      summaries,
      summaryCount,
      isLoading: isSummariesLoading,
      hasNextPage: !!hasNextPage,
      isFetchingNextPage,
      selectedSummaryId,
      selectedSummary,
      isSummaryDetailLoading,
      isTranscriptModalOpen,
      errorMessage
    } as DashboardViewModel,
    
    // Actions
    actions: {
      fetchNextPage,
      selectSummary: handleSelectSummary,
      openModal: handleOpenModal,
      closeModal: handleCloseModal,
      updateSummary: handleUpdateSummary,
      deleteSummary: handleDeleteSummary,
      dismissError: handleDismissError
    }
  };
}
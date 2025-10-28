import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { 
  CreateTranscriptCommand, 
  CreateTranscriptResponseDto,
  SummarisationStatus,
  UpdateSummaryCommand
} from '../types';

/**
 * Interface for the transcript modal view model
 */
interface TranscriptModalViewModel {
  // The current step of the modal workflow
  step: 'submit' | 'progress' | 'preview' | 'error';

  // State for the submission form
  transcriptText: string;
  wordCount: number;

  // State after submission
  transcriptId: string | null;

  // State for the preview step
  generatedSummaryMarkdown: string;
  summaryId: string | null; // ID of the created summary

  // Generic error message for any step
  errorMessage: string | null;
  
  // Loading states
  isSubmitting: boolean;
  isSaving: boolean;
}

/**
 * Custom hook to manage the transcript modal state
 */
export function useTranscriptModalState(onClose: () => void) {
  const queryClient = useQueryClient();
  const [viewModel, setViewModel] = useState<TranscriptModalViewModel>({
    step: 'submit',
    transcriptText: '',
    wordCount: 0,
    transcriptId: null,
    generatedSummaryMarkdown: '',
    summaryId: null,
    errorMessage: null,
    isSubmitting: false,
    isSaving: false
  });

  // Calculate word count when transcript text changes
  useEffect(() => {
    const wordCount = viewModel.transcriptText
      ? viewModel.transcriptText.trim().split(/\s+/).length
      : 0;
    
    setViewModel(prev => ({ ...prev, wordCount }));
  }, [viewModel.transcriptText]);

  // Submit transcript mutation
  const submitTranscriptMutation = useMutation({
    mutationFn: async (data: CreateTranscriptCommand) => {
      const response = await fetch('/api/transcripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit transcript');
      }
      
      return response.json() as Promise<CreateTranscriptResponseDto>;
    },
    onMutate: () => {
      setViewModel(prev => ({ ...prev, isSubmitting: true }));
    },
    onSuccess: (data) => {
      setViewModel(prev => ({
        ...prev,
        transcriptId: data.id,
        step: 'progress',
        isSubmitting: false
      }));
    },
    onError: (error: Error) => {
      setViewModel(prev => ({
        ...prev,
        step: 'error',
        errorMessage: error.message,
        isSubmitting: false
      }));
    }
  });

  // Poll summarization status
  const { data: statusData } = useQuery({
    queryKey: ['summarise', 'status', viewModel.transcriptId],
    queryFn: async () => {
      const response = await fetch(`/api/summarise/status/${viewModel.transcriptId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch summarization status');
      }
      
      return response.json();
    },
    enabled: viewModel.step === 'progress' && !!viewModel.transcriptId,
    refetchInterval: 5000, // Poll every 5 seconds
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: 36, // Retry for 3 minutes (36 * 5 seconds)
    retryDelay: 5000,
    onSuccess: (data) => {
      if (data.status === 'ready' && data.summaryId) {
        // Fetch the generated summary
        fetch(`/api/summaries/${data.summaryId}`)
          .then(response => {
            if (!response.ok) throw new Error('Failed to fetch generated summary');
            return response.json();
          })
          .then(summaryData => {
            setViewModel(prev => ({
              ...prev,
              step: 'preview',
              generatedSummaryMarkdown: summaryData.summaryMarkdown,
              summaryId: data.summaryId
            }));
          })
          .catch(error => {
            setViewModel(prev => ({
              ...prev,
              step: 'error',
              errorMessage: error.message
            }));
          });
      } else if (data.status === 'error') {
        setViewModel(prev => ({
          ...prev,
          step: 'error',
          errorMessage: 'Failed to generate summary. Please try again.'
        }));
      }
    },
    onError: (error: Error) => {
      setViewModel(prev => ({
        ...prev,
        step: 'error',
        errorMessage: error.message
      }));
    }
  });

  // Save summary mutation
  const saveSummaryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: UpdateSummaryCommand }) => {
      const response = await fetch(`/api/summaries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save summary');
      }
      
      return response.json();
    },
    onMutate: () => {
      setViewModel(prev => ({ ...prev, isSaving: true }));
    },
    onSuccess: () => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['summaries'] });
      
      // Close the modal
      setViewModel(prev => ({ ...prev, isSaving: false }));
      onClose();
    },
    onError: (error: Error) => {
      setViewModel(prev => ({
        ...prev,
        errorMessage: error.message,
        isSaving: false
      }));
    }
  });

  // Handler functions
  const handleTextChange = (text: string) => {
    setViewModel(prev => ({ ...prev, transcriptText: text }));
  };

  const handleSubmit = () => {
    if (viewModel.transcriptText.trim()) {
      submitTranscriptMutation.mutate({ transcriptText: viewModel.transcriptText });
    }
  };

  const handleSummaryMarkdownChange = (markdown: string) => {
    setViewModel(prev => ({ ...prev, generatedSummaryMarkdown: markdown }));
  };

  const handleSave = () => {
    if (viewModel.summaryId && viewModel.generatedSummaryMarkdown) {
      saveSummaryMutation.mutate({
        id: viewModel.summaryId,
        data: { summaryMarkdown: viewModel.generatedSummaryMarkdown }
      });
    }
  };

  const handleRetry = () => {
    setViewModel(prev => ({
      ...prev,
      step: 'submit',
      errorMessage: null
    }));
  };

  return {
    viewModel,
    actions: {
      handleTextChange,
      handleSubmit,
      handleSummaryMarkdownChange,
      handleSave,
      handleRetry
    }
  };
}
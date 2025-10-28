import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { SubmitForm } from './SubmitForm';
import { ProgressView } from './ProgressView';
import { PreviewView } from './PreviewView';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '../ui/button';
import { useTranscriptModalState } from '../../hooks/useTranscriptModalState';

interface TranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TranscriptModal({ isOpen, onClose }: TranscriptModalProps) {
  const { viewModel, actions } = useTranscriptModalState(onClose);
  
  // Prevent closing the modal during processing or saving
  const preventClose = viewModel.step === 'progress' || viewModel.isSaving;
  
  // Determine if the modal can be closed via escape key or clicking outside
  const onOpenChange = (open: boolean) => {
    if (!open && !preventClose) {
      onClose();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>
            {viewModel.step === 'submit' && 'Add Transcript'}
            {viewModel.step === 'progress' && 'Processing'}
            {viewModel.step === 'preview' && 'Summary Preview'}
            {viewModel.step === 'error' && 'Error'}
          </DialogTitle>
          
          {!preventClose && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          )}
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto">
          {viewModel.errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{viewModel.errorMessage}</AlertDescription>
            </Alert>
          )}
          
          {viewModel.step === 'submit' && (
            <SubmitForm
              transcriptText={viewModel.transcriptText}
              wordCount={viewModel.wordCount}
              onTextChange={actions.handleTextChange}
              onSubmit={actions.handleSubmit}
              isSubmitting={viewModel.isSubmitting}
            />
          )}
          
          {viewModel.step === 'progress' && (
            <ProgressView transcriptId={viewModel.transcriptId} />
          )}
          
          {viewModel.step === 'preview' && (
            <PreviewView
              summaryMarkdown={viewModel.generatedSummaryMarkdown}
              onSummaryChange={actions.handleSummaryMarkdownChange}
              onSave={actions.handleSave}
              isSaving={viewModel.isSaving}
            />
          )}
          
          {viewModel.step === 'error' && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
              <p className="text-sm text-gray-500 mb-6">
                {viewModel.errorMessage || 'An unexpected error occurred.'}
              </p>
              <Button onClick={actions.handleRetry}>Try Again</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import type { SummaryDto } from '~/types';

interface SummaryDetailProps {
  summary: SummaryDto;
  onEdit: () => void;
  onDelete: (id: string) => void;
}

export function SummaryDetail({ summary, onEdit, onDelete }: SummaryDetailProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Format the dates
  const updatedTimeAgo = formatDistanceToNow(new Date(summary.updatedAt), { addSuffix: true });
  const createdTimeAgo = formatDistanceToNow(new Date(summary.createdAt), { addSuffix: true });
  
  const handleDelete = () => {
    onDelete(summary.id);
    setIsDeleteDialogOpen(false);
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="text-sm text-gray-500">
            Updated {updatedTimeAgo}
            {summary.createdAt !== summary.updatedAt && (
              <span className="text-gray-400 ml-2">
                (Created {createdTimeAgo})
              </span>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto prose prose-sm max-w-none">
        {/* In a real implementation, we would use a markdown renderer here */}
        <pre className="whitespace-pre-wrap">{summary.summaryMarkdown}</pre>
      </div>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this summary. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
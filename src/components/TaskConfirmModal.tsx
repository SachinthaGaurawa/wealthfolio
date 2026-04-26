// src/components/TaskConfirmModal.tsx
import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface TaskConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}

export function TaskConfirmModal({ isOpen, onClose, onConfirm, title }: TaskConfirmModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white relative">
        <button onClick={onClose} className="absolute right-4 top-4 text-zinc-400 hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">Mark as Completed?</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            Are you sure you want to mark "{title}" as fully completed? This action will update your monthly expenditure calculations immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel onClick={onClose} className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
            Cancel
          </AlertDialogCancel>
          <Button onClick={() => { onConfirm(); onClose(); }} className="bg-green-600 hover:bg-green-700 text-white">
            Complete Task
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

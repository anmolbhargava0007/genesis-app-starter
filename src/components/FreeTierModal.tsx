
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface FreeTierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FreeTierModal = ({ isOpen, onClose }: FreeTierModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Free Tier Expired</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-600">
            You have consumed the free tier of Prototype. Please connect with the Product team to enable the features.
          </p>
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose}>OK</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FreeTierModal;

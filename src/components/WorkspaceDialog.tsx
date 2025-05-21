
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/context/WorkspaceContext';
import { WorkspaceWithDocuments } from '@/types/api';
import { useAuth } from '@/context/AuthContext';

interface WorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: WorkspaceWithDocuments | null;
}

const WorkspaceDialog = ({ isOpen, onClose, workspace }: WorkspaceDialogProps) => {
  const { user } = useAuth();
  const { createWorkspace, updateWorkspace } = useWorkspace();
  const [workspaceName, setWorkspaceName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!workspace;

  useEffect(() => {
    if (workspace) {
      setWorkspaceName(workspace.ws_name);
    } else {
      setWorkspaceName('');
    }
  }, [workspace]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workspaceName.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isEditing && workspace.ws_id) {
        await updateWorkspace({
          ...workspace,
          ws_name: workspaceName,
        });
      } else {
        await createWorkspace(workspaceName, user?.user_id);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save workspace:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Workspace' : 'Create New Workspace'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="col-span-3"
                autoComplete="off"
                autoFocus
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || !workspaceName.trim()}
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WorkspaceDialog;

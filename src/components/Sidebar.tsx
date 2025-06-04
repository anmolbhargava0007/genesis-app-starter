
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/context/WorkspaceContext";
import WorkspaceDialog from "./WorkspaceDialog";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaces, currentWorkspace, setCurrentWorkspace } = useWorkspace();
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  const handleWorkspaceClick = (workspaceId: number) => {
    setCurrentWorkspace(workspaceId);
    navigate(`/workspace/${workspaceId}`);
  };

  const isWorkspaceRoute = location.pathname.startsWith('/workspace/');

  return (
    <>
      <div className="w-80 bg-card border-r border-border flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-card-foreground">Workspaces</h2>
            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Workspace List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {workspaces.map((workspace) => (
            <div
              key={workspace.ws_id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50 ${
                currentWorkspace === workspace.ws_id
                  ? "border-primary bg-accent"
                  : "border-border bg-card hover:border-accent-foreground/20"
              }`}
              onClick={() => handleWorkspaceClick(workspace.ws_id!)}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-card-foreground truncate">
                    {workspace.ws_name}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span>{workspace.fileCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{workspace.messageCount || 0}</span>
                    </div>
                  </div>
                </div>
                {workspace.is_active && (
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <WorkspaceDialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
        }}
      />
    </>
  );
};

export default Sidebar;

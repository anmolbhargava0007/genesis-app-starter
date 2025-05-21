
import React, { useState, useEffect } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { WorkspaceWithDocuments } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Folder,
  FileText,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Upload,
  History,
} from "lucide-react";
import WorkspaceDialog from "./WorkspaceDialog";
import UploadModal from "./UploadModal";
import ChatHistoryDialog from "./ChatHistoryDialog";
import logoWhite from "./../../public/icons/logo-white.png";
import SidebarNav from "./SidebarNav";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
  const { userRole } = useAuth();
  const {
    workspaces,
    selectedWorkspace,
    selectWorkspace,
    deleteWorkspace,
    loadPromptHistory,
  } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [editWorkspace, setEditWorkspace] =
    useState<WorkspaceWithDocuments | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [historyWorkspaceId, setHistoryWorkspaceId] = useState<number | null>(
    null
  );
  
  // Show workspace content only on the workspace route
  const showWorkspaceContent = location.pathname === "/workspace";

  const filteredWorkspaces = searchQuery
    ? workspaces.filter((ws) =>
        ws.ws_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : workspaces;

  const handleWorkspaceClick = (workspace: WorkspaceWithDocuments) => {
    selectWorkspace(workspace);
  };

  const handleEditClick = (
    workspace: WorkspaceWithDocuments,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setEditWorkspace(workspace);
  };

  const handleDeleteClick = async (
    workspace: WorkspaceWithDocuments,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (workspace.ws_id) {
      await deleteWorkspace(workspace.ws_id);
    }
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUploadModalOpen(true);
  };

  const handleHistoryClick = (
    workspace: WorkspaceWithDocuments,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (workspace.ws_id) {
      setHistoryWorkspaceId(workspace.ws_id);
      setIsHistoryDialogOpen(true);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-800 border-r border-gray-700 w-72 overflow-hidden">
      <div className="flex justify-center">
        <img src={logoWhite} alt="Logo" className="w-64 h-[85px] mx-auto p-1" />
      </div>

      {/* SidebarNav always rendered, regardless of role */}
      <div className="border-b border-gray-700 pb-2">
        <SidebarNav />
      </div>
      
      {/* Only show workspace content when on the workspace route */}
      {showWorkspaceContent && (
        <>
          <div className="px-3 py-3">
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="w-full bg-[#A259FF] hover:bg-[#A259FF]/90 text-white rounded-md h-9 shadow-sm flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" /> New Workspace
            </Button>
          </div>

          <div className="px-3 mb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search workspaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-gray-700 border-gray-600 text-gray-200 focus-visible:ring-[#A259FF] h-9 text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
            <div className="flex items-center text-sm font-medium text-gray-400 mb-2">
              <Folder className="h-4 w-4 mr-2" /> WORKSPACES
            </div>

            <div className="space-y-1 mt-2">
              {filteredWorkspaces.map((workspace) => (
                <div
                  key={workspace.ws_id}
                  onClick={() => handleWorkspaceClick(workspace)}
                  className={`flex items-start justify-between p-2 rounded-md cursor-pointer group transition-colors duration-200 ${
                    selectedWorkspace?.ws_id === workspace.ws_id
                      ? "bg-gray-700 border-l-4 border-[#A259FF]"
                      : "hover:bg-gray-700 border-l-4 border-transparent"
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <FileText
                      className={`h-4 w-4 mt-0.5 ${
                        selectedWorkspace?.ws_id === workspace.ws_id
                          ? "text-[#A259FF]"
                          : "text-gray-400"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-200">
                        {workspace.ws_name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {workspace.documents?.length || 0} files
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white hover:bg-gray-600"
                      onClick={(e) => handleHistoryClick(workspace, e)}
                      title="View History"
                    >
                      <History className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white hover:bg-gray-600"
                      onClick={handleUploadClick}
                      title="Upload Document"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white hover:bg-gray-600"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-40 bg-gray-800 text-gray-200 border-gray-700"
                      >
                        <DropdownMenuItem
                          onClick={(e) => handleEditClick(workspace, e)}
                          className="focus:bg-gray-700 focus:text-white"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuItem
                          className="text-red-400 focus:text-red-300 focus:bg-gray-700"
                          onClick={(e) => handleDeleteClick(workspace, e)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Stats */}
          <div className="mt-auto border-t border-gray-700 p-3 bg-gray-800">
            <div className="flex items-center justify-between text-sm text-gray-300 py-1.5">
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2 text-[#A259FF]" />
                <span>Documents</span>
              </div>
              <span className="font-semibold">
                {workspaces.reduce(
                  (sum, ws) => sum + (ws.documents?.length || 0),
                  0
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-300 py-1.5">
              <span>Storage</span>
              <span className="font-semibold">12.4MB</span>
            </div>
          </div>
        </>
      )}

      {/* Dialogs */}
      <WorkspaceDialog
        isOpen={isCreateDialogOpen || !!editWorkspace}
        onClose={() => {
          setCreateDialogOpen(false);
          setEditWorkspace(null);
        }}
        workspace={editWorkspace}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      {historyWorkspaceId && (
        <ChatHistoryDialog
          isOpen={isHistoryDialogOpen}
          onClose={() => setIsHistoryDialogOpen(false)}
          workspaceId={historyWorkspaceId}
          onSelectPrompt={(prompt) => {
            loadPromptHistory(prompt);
          }}
        />
      )}
    </div>
  );
};

export default Sidebar;

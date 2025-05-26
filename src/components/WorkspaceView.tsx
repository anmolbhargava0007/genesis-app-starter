
import React, { useState, useEffect } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { FileText, Link } from "lucide-react";
import ChatView from "./ChatView";
import UploadModal from "./UploadModal";
import UrlModal from "./UrlModal";

const WorkspaceView = () => {
  const { selectedWorkspace, currentSessionType } = useWorkspace();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);

  useEffect(() => {
    setIsUploadModalOpen(false);
    setIsUrlModalOpen(false);
  }, [selectedWorkspace?.ws_id]);

  const handleUploadClick = () => {
    if (currentSessionType !== 'url') {
      setIsUploadModalOpen(true);
    }
  };

  const handleUrlClick = () => {
      setIsUrlModalOpen(true);
  };

  if (!selectedWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="p-8 bg-gray-800 rounded-lg shadow-sm border border-gray-700 max-w-md text-center">
          <FileText className="h-12 w-12 text-[#A259FF] mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-2">
            Welcome to SalesAdvisor
          </h2>
          <p className="text-gray-300 mb-6">
            Select a workspace or create a new one to get started with your
            documents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-hidden">
        {selectedWorkspace.ws_id && (
          <ChatView
            workspaceId={selectedWorkspace.ws_id}
            onUploadClick={handleUploadClick}
            onUrlClick={handleUrlClick}
          />
        )}
      </div>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
      
      <UrlModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
      />
    </div>
  );
};

export default WorkspaceView;

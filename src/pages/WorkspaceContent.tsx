
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useWorkspace } from "@/context/WorkspaceContext";
import WorkspaceView from "@/components/WorkspaceView";

const WorkspaceContent = () => {
  const { wsId } = useParams();
  const { workspaces, selectWorkspace, selectedWorkspace } = useWorkspace();

  useEffect(() => {
    if (wsId && workspaces.length > 0) {
      const workspace = workspaces.find(w => w.ws_id === parseInt(wsId));
      if (workspace && workspace.ws_id !== selectedWorkspace?.ws_id) {
        selectWorkspace(workspace);
      }
    }
  }, [wsId, workspaces, selectWorkspace, selectedWorkspace]);

  return <WorkspaceView />;
};

export default WorkspaceContent;

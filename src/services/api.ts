
import { Workspace, Document, ApiResponse, ChatPrompt } from "@/types/api";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const DEFAULT_USER_ID = 1;

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "An error occurred");
  }
  return response.json();
};

export const workspaceApi = {
  getAll: async (userId?: number): Promise<ApiResponse<Workspace[]>> => {
    const query = userId ? `?user_id=${userId}` : "";
    const response = await fetch(`${API_BASE_URL}/api/v1/workspaces${query}`);
    return handleResponse<ApiResponse<Workspace[]>>(response);
  },

  getById: async (wsId: number): Promise<ApiResponse<Workspace>> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/workspaces?ws_id=${wsId}`);
    return handleResponse<ApiResponse<Workspace>>(response);
  },

  create: async (workspace: Workspace & { session_id?: string }): Promise<ApiResponse<Workspace>> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/workspaces`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...workspace,
        user_id: workspace.user_id || DEFAULT_USER_ID,
        is_active: true,
        // Include session_id if provided
        ...(workspace.session_id && { session_id: workspace.session_id }),
      }),
    });
    return handleResponse<ApiResponse<Workspace>>(response);
  },

  update: async (workspace: Workspace): Promise<ApiResponse<Workspace>> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/workspaces`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...workspace,
        user_id: workspace.user_id || DEFAULT_USER_ID, // ensure user_id is sent
      }),
    });
    return handleResponse<ApiResponse<Workspace>>(response);
  },

  delete: async (wsId: number): Promise<ApiResponse<null>> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/workspaces`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ws_id: wsId,
        is_active: false,
      }),
    });
    return handleResponse<ApiResponse<null>>(response);
  },
};

export const documentApi = {
  getAll: async (wsId?: number, userId?: number): Promise<Document[]> => {
    let url = `${API_BASE_URL}/api/v1/ws-docs`;
    const params = [];
    if (wsId) params.push(`ws_id=${wsId}`);
    if (userId) params.push(`user_id=${userId}`);
    if (params.length > 0) {
      url += `?${params.join("&")}`;
    }
    const response = await fetch(url);
    const result = await handleResponse<{ success: boolean; data: Document[] }>(
      response
    );

    if (result.success && Array.isArray(result.data)) {
      console.log(
        `Fetched ${result.data.length} documents for workspace ${wsId}`
      );
      return result.data;
    } else {
      console.log(
        "API response structure doesn't match expected format:",
        result
      );
      return [];
    }
  },

  getById: async (docId: number): Promise<Document> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/ws-docs?ws_doc_id=${docId}`);
    return handleResponse<Document>(response);
  },

  upload: async (
    file: File,
    workspace: Workspace
  ): Promise<ApiResponse<Document>> => {
    const nameParts = file.name.split(".");
    const extension = nameParts.length > 1 ? nameParts.pop() || "pdf" : "pdf";
    const fileName = nameParts.join(".");

    const documentData: Document = {
      ws_doc_path: "",
      ws_doc_name: file.name,
      ws_doc_extn: extension,
      ws_doc_for: "",
      ws_id: workspace.ws_id || 0,
      user_id: workspace.user_id || DEFAULT_USER_ID,
      is_active: true,
    };

    const response = await fetch(`${API_BASE_URL}/api/v1/ws-docs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(documentData),
    });

    return handleResponse<ApiResponse<Document>>(response);
  },

  delete: async (docId: number): Promise<ApiResponse<null>> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/ws-docs`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ws_doc_id: docId,
        is_active: false,
      }),
    });
    return handleResponse<ApiResponse<null>>(response);
  },
};

export const promptHistoryApi = {
  savePrompt: async (promptData: ChatPrompt): Promise<ApiResponse<ChatPrompt>> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/prompts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(promptData),
    });
    return handleResponse<ApiResponse<ChatPrompt>>(response);
  },

  getPrompts: async (
    wsId: number,
    userId: number,
    sessionId: string,
    promptId?: number,
    isActive?: boolean
  ): Promise<ApiResponse<ChatPrompt[]>> => {
    let url = `${API_BASE_URL}/api/v1/prompts?ws_id=${wsId}&user_id=${userId}&session_id=${sessionId}`;
    
    if (promptId) url += `&prompt_id=${promptId}`;
    if (isActive !== undefined) url += `&is_active=${isActive}`;
    
    const response = await fetch(url);
    return handleResponse<ApiResponse<ChatPrompt[]>>(response);
  },
  
  getAllSessionsForWorkspace: async (
    wsId: number,
    userId: number
  ): Promise<ApiResponse<ChatPrompt[]>> => {
    const url = `${API_BASE_URL}/api/v1/prompts?ws_id=${wsId}&user_id=${userId}`;
    const response = await fetch(url);
    return handleResponse<ApiResponse<ChatPrompt[]>>(response);
  }
};

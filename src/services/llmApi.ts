
import { LLMResponse } from "@/types/api";
import { v4 as uuidv4 } from "uuid";

const LLM_API_BASE_URL = import.meta.env.VITE_API_LLM_URL;

export const llmApi = {
  uploadDocument: async (file: File, workspaceId: number): Promise<{ success: boolean; session_id?: string }> => {
    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("workspace_id", workspaceId.toString());

      const response = await fetch(`${LLM_API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload document to LLM API");
      }

      const data = await response.json();
      return {
        success: true,
        session_id: data.session_id
      };
    } catch (error) {
      console.error("Error uploading document to LLM API:", error);
      return { success: false };
    }
  },

  query: async (question: string, sessionId: string): Promise<LLMResponse> => {
    try {
      const formData = new URLSearchParams();
      formData.append("question", question);
      formData.append("session_id", sessionId);

      const response = await fetch(`${LLM_API_BASE_URL}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to query LLM API");
      }

      return await response.json();
    } catch (error) {
      console.error("Error querying LLM API:", error);
      
      return {
        answer: `The server is currently down. Please contact your administrator for assistance.`,
        sources: [
          {
            source_id: uuidv4(),
            summary: "This is a mock summary of the document.",
            file: "sample_document.pdf",
            page: 5,
          },
        ],
      };
    }
  },
};

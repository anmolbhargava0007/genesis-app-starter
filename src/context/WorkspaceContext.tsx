
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { toast } from "sonner";
import {
  Workspace,
  Document,
  WorkspaceWithDocuments,
  ChatMessage,
  ChatData,
  LLMResponse,
  ChatPrompt,
} from "@/types/api";
import { workspaceApi, documentApi, promptHistoryApi } from "@/services/api";
import { llmApi } from "@/services/llmApi";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "./AuthContext";

interface WorkspaceContextType {
  workspaces: WorkspaceWithDocuments[];
  selectedWorkspace: WorkspaceWithDocuments | null;
  loading: boolean;
  error: string | null;
  createWorkspace: (name: string, userId?: number) => Promise<void>;
  updateWorkspace: (workspace: Workspace) => Promise<void>;
  deleteWorkspace: (wsId: number) => Promise<void>;
  selectWorkspace: (workspace: WorkspaceWithDocuments) => void;
  uploadDocument: (file: File) => Promise<boolean>;
  deleteDocument: (docId: number) => Promise<void>;
  refreshWorkspaces: (userId?: number) => Promise<void>;
  sendMessage: (workspaceId: number, message: string) => Promise<void>;
  loadPromptHistory: (prompt: ChatPrompt) => void;
  chatMessages: ChatData;
  currentSessionDocuments: string[];
}

interface SessionIdMap {
  [workspaceId: number]: string;
}

interface SessionDocumentsMap {
  [workspaceId: number]: string[];
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

// Default values for LLM model usage
const DEFAULT_MODEL_NAME = "llama3.2:latest";
const DEFAULT_TEMPERATURE = 1.0;
const DEFAULT_TOKEN_USAGE = 100;

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceWithDocuments[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] =
    useState<WorkspaceWithDocuments | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatData>({});
  const [sessionIds, setSessionIds] = useState<SessionIdMap>({});
  const [sessionDocuments, setSessionDocuments] = useState<SessionDocumentsMap>({});
  const [currentSessionDocuments, setCurrentSessionDocuments] = useState<string[]>([]);

  useEffect(() => {
    if (user?.user_id) {
      refreshWorkspaces();
    }
  }, [user?.user_id]);

  // Load chat history when a workspace is selected
  useEffect(() => {
    if (selectedWorkspace?.ws_id && user?.user_id) {
      loadLatestChatHistory(selectedWorkspace.ws_id, user.user_id);
    }
  }, [selectedWorkspace?.ws_id, user?.user_id]);

  // Load session documents when session changes
  useEffect(() => {
    if (selectedWorkspace?.ws_id && sessionIds[selectedWorkspace.ws_id]) {
      const docs = sessionDocuments[selectedWorkspace.ws_id] || [];
      setCurrentSessionDocuments(docs);
    }
  }, [selectedWorkspace?.ws_id, sessionIds, sessionDocuments]);

  const loadLatestChatHistory = async (wsId: number, userId: number) => {
    try {
      // Get all prompts for this workspace and user
      const response = await promptHistoryApi.getAllSessionsForWorkspace(wsId, userId);
      
      if (response.success && Array.isArray(response.data) && response.data.length > 0) {
        // Group prompts by session
        const groupedBySession: Record<string, ChatPrompt[]> = {};
        response.data.forEach(prompt => {
          if (!groupedBySession[prompt.session_id]) {
            groupedBySession[prompt.session_id] = [];
          }
          groupedBySession[prompt.session_id].push(prompt);
        });
        
        // Find the latest session (with highest prompt_id)
        let latestSession: string | null = null;
        let latestPromptId = -1;
        
        Object.entries(groupedBySession).forEach(([sessionId, prompts]) => {
          // Find highest prompt_id in this session
          const maxPromptId = Math.max(...prompts.map(p => p.prompt_id || 0));
          if (maxPromptId > latestPromptId) {
            latestPromptId = maxPromptId;
            latestSession = sessionId;
          }
        });
        
        if (latestSession) {
          // Store session ID for this workspace
          setSessionIds(prev => ({
            ...prev,
            [wsId]: latestSession
          }));
          
          // Convert prompts to chat messages
          const chatPrompts = groupedBySession[latestSession];
          const formattedMessages: ChatMessage[] = [];
          
          chatPrompts.sort((a, b) => (a.prompt_id || 0) - (b.prompt_id || 0))
            .forEach(prompt => {
              // Create user message
              const userMessage: ChatMessage = {
                id: uuidv4(),
                content: prompt.prompt_text,
                type: 'user',
                timestamp: Date.now() - 1000,
              };
              
              // Create bot message
              const botMessage: ChatMessage = {
                id: uuidv4(),
                content: prompt.response_text,
                type: 'bot',
                timestamp: Date.now(),
                // Try to extract sources if available
                sources: extractSourcesFromResponse(prompt.response_text),
              };
              
              formattedMessages.push(userMessage, botMessage);
            });
          
          // Update chat messages for this workspace
          setChatMessages(prev => ({
            ...prev,
            [wsId]: formattedMessages
          }));
          
          // Extract document names (mock implementation)
          setSessionDocuments(prev => ({
            ...prev,
            [wsId]: extractDocumentNamesFromPrompts(chatPrompts)
          }));
          
          console.log(`Loaded ${formattedMessages.length} messages for workspace ${wsId}`);
        }
      } else {
        // No history found, clear messages
        setChatMessages(prev => ({
          ...prev,
          [wsId]: []
        }));
      }
    } catch (err) {
      console.error("Error loading chat history:", err);
    }
  };

  const loadPromptHistory = (prompt: ChatPrompt) => {
    if (!selectedWorkspace?.ws_id || !prompt.ws_id || !prompt.session_id) return;
    
    try {
      // Find all prompts in this session
      promptHistoryApi.getPrompts(
        prompt.ws_id,
        prompt.user_id,
        prompt.session_id
      ).then(response => {
        if (response.success && Array.isArray(response.data)) {
          // Convert to chat messages
          const sortedPrompts = response.data.sort(
            (a, b) => (a.prompt_id || 0) - (b.prompt_id || 0)
          );
          
          const formattedMessages: ChatMessage[] = [];
          
          sortedPrompts.forEach(p => {
            // Create user message
            const userMessage: ChatMessage = {
              id: uuidv4(),
              content: p.prompt_text,
              type: 'user',
              timestamp: Date.now() - 1000,
            };
            
            // Create bot message
            const botMessage: ChatMessage = {
              id: uuidv4(),
              content: p.response_text,
              type: 'bot',
              timestamp: Date.now(),
              // Try to extract sources if available
              sources: extractSourcesFromResponse(p.response_text),
            };
            
            formattedMessages.push(userMessage, botMessage);
          });
          
          // Update chat messages for this workspace
          setChatMessages(prev => ({
            ...prev,
            [selectedWorkspace.ws_id!]: formattedMessages
          }));
          
          // Update session ID for this workspace
          setSessionIds(prev => ({
            ...prev,
            [selectedWorkspace.ws_id!]: prompt.session_id
          }));
          
          // Extract document names (mock implementation)
          const documents = extractDocumentNamesFromPrompts(sortedPrompts);
          setSessionDocuments(prev => ({
            ...prev,
            [selectedWorkspace.ws_id!]: documents
          }));
          setCurrentSessionDocuments(documents);
          
          toast.success("Loaded chat history");
        }
      });
    } catch (err) {
      console.error("Failed to load prompt history:", err);
      toast.error("Failed to load chat history");
    }
  };

  // Helper function to extract document names from prompts
  const extractDocumentNamesFromPrompts = (prompts: ChatPrompt[]): string[] => {
    const documents: string[] = [];
    
    // Look for document mentions in responses
    prompts.forEach(prompt => {
      const responseText = prompt.response_text || "";
      
      // This is a simplified approach - in a real app, you'd have proper metadata
      if (responseText.includes("invoice_") || responseText.includes(".pdf")) {
        const regex = /([a-zA-Z0-9_-]+\.pdf)/g;
        const matches = responseText.match(regex);
        if (matches) {
          matches.forEach(match => {
            if (!documents.includes(match)) {
              documents.push(match);
            }
          });
        }
      }
    });
    
    return documents;
  };
  
  // Helper function to try to extract source information from response text
  const extractSourcesFromResponse = (responseText: string): any[] => {
    try {
      // Check if the response contains a JSON part with sources
      if (responseText.includes('"sources":')) {
        const match = responseText.match(/\{.*"sources":\s*(\[.*?\])/s);
        if (match && match[1]) {
          const sourcesJson = match[1];
          return JSON.parse(sourcesJson);
        }
      }
      return [];
    } catch (e) {
      console.error("Failed to extract sources from response:", e);
      return [];
    }
  };

  const refreshWorkspaces = async (userId?: number) => {
    if (!user?.user_id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await workspaceApi.getAll(user.user_id);
      if (response && Array.isArray(response.data)) {
        const transformed: WorkspaceWithDocuments[] = response.data.map(
          (ws) => ({
            ...ws,
            documents: [],
            messageCount: Math.floor(Math.random() * 50) + 5,
            fileCount: Math.floor(Math.random() * 15) + 1,
          })
        );

        for (const workspace of transformed) {
          try {
            if (workspace.ws_id) {
              const docs = await documentApi.getAll(workspace.ws_id);
              workspace.documents = docs;
              workspace.fileCount = docs.length;
            }
          } catch (err) {
            console.error(
              `Error loading docs for workspace ${workspace.ws_id}:`,
              err
            );
          }
        }

        setWorkspaces(transformed);

        if (selectedWorkspace && selectedWorkspace.ws_id) {
          const updated = transformed.find(
            (w) => w.ws_id === selectedWorkspace.ws_id
          );
          if (updated) setSelectedWorkspace(updated);
        }
      } else {
        throw new Error("Invalid response from API");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load workspaces";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async (name: string) => {
    if (!user?.user_id) return;

    try {
      setLoading(true);

      const isDuplicate = workspaces.some(
        (w) => w.ws_name.toLowerCase() === name.toLowerCase()
      );
      if (isDuplicate) {
        toast.error("A workspace with this name already exists.");
        return;
      }

      const newWorkspace: Workspace = {
        ws_name: name,
        user_id: user.user_id,
        is_active: true,
      };

      const response = await workspaceApi.create(newWorkspace);
      if (response.success) {
        toast.success("Workspace created successfully");
        await refreshWorkspaces();
      } else {
        toast.error("Failed to create workspace");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create workspace";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateWorkspace = async (workspace: Workspace) => {
    try {
      setLoading(true);

      const currentWorkspace = workspaces.find(
        (w) => w.ws_id === workspace.ws_id
      );

      if (currentWorkspace && currentWorkspace.ws_name !== workspace.ws_name) {
        const isDuplicate = workspaces.some(
          (w) =>
            w.ws_id !== workspace.ws_id &&
            w.ws_name.toLowerCase() === workspace.ws_name.toLowerCase()
        );

        if (isDuplicate) {
          toast.error("A workspace with this name already exists.");
          return;
        }
      }
      const response = await workspaceApi.update({
        ...workspace,
        user_id: user?.user_id || 1,
      });

      if (response.success) {
        toast.success("Workspace updated successfully");
        await refreshWorkspaces();
      } else {
        toast.error("Failed to update workspace");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update workspace";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkspace = async (wsId: number) => {
    try {
      setLoading(true);

      const response = await workspaceApi.delete(wsId);

      if (response.success) {
        if (selectedWorkspace && selectedWorkspace.ws_id === wsId) {
          setSelectedWorkspace(null);
        }

        toast.success("Workspace deleted successfully");
        await refreshWorkspaces();
      } else {
        toast.error("Failed to delete workspace");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete workspace";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectWorkspace = (workspace: WorkspaceWithDocuments) => {
    setSelectedWorkspace(workspace);
  };

  const uploadDocument = async (file: File): Promise<boolean> => {
    try {
      if (!selectedWorkspace) {
        toast.error("Please select a workspace first");
        return false;
      }

      setLoading(true);

      if (!file.type.includes("pdf")) {
        toast.error("Only PDF files are supported");
        return false;
      }

      // Upload to LLM service to get session ID
      if (selectedWorkspace.ws_id) {
        try {
          const result = await llmApi.uploadDocument(file, selectedWorkspace.ws_id);
          
          if (result.success && result.session_id) {
            // Save the session ID for this workspace
            setSessionIds(prev => ({
              ...prev,
              [selectedWorkspace.ws_id!]: result.session_id!
            }));
            
            // Update session documents
            setSessionDocuments(prev => ({
              ...prev,
              [selectedWorkspace.ws_id!]: [file.name]
            }));
            
            // Update current session documents
            setCurrentSessionDocuments([file.name]);
            
            console.log(`Session ID for workspace ${selectedWorkspace.ws_id}: ${result.session_id}`);
            
            // Clear chat messages for this workspace to start fresh
            setChatMessages(prev => ({
              ...prev,
              [selectedWorkspace.ws_id!]: []
            }));
          } else {
            console.error("Failed to upload to LLM API");
          }
        } catch (llmErr) {
          console.error("Failed to upload to LLM API:", llmErr);
        }
      }

      // Continue with the regular document upload
      const response = await documentApi.upload(file, {
        ...selectedWorkspace,
        user_id: user?.user_id || 1,
      });

      if (response.success) {
        toast.success("Document uploaded successfully");
        await refreshWorkspaces();
        return true;
      } else {
        toast.error("Failed to upload document");
        return false;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to upload document";
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (docId: number) => {
    try {
      setLoading(true);

      const response = await documentApi.delete(docId);

      if (response.success) {
        toast.success("Document deleted successfully");
        await refreshWorkspaces();
      } else {
        toast.error("Failed to delete document");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete document";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (
    workspaceId: number,
    message: string
  ): Promise<void> => {
    try {
      if (!user?.user_id) {
        toast.error("User not authenticated");
        return;
      }
      
      setLoading(true);

      // Add user message to state immediately
      const userMessage: ChatMessage = {
        id: uuidv4(),
        content: message,
        type: "user",
        timestamp: Date.now(),
      };

      setChatMessages((prev) => {
        const workspaceMessages = prev[workspaceId] || [];
        return {
          ...prev,
          [workspaceId]: [...workspaceMessages, userMessage],
        };
      });

      // Get session ID for this workspace
      const sessionId = sessionIds[workspaceId];
      
      if (!sessionId) {
        throw new Error("No session found. Please upload a document first.");
      }

      // Send message to LLM API with session ID
      const response = await llmApi.query(message, sessionId);

      // Add bot response
      const botMessage: ChatMessage = {
        id: uuidv4(),
        content: response.answer,
        type: "bot",
        timestamp: Date.now(),
        sources: response.sources,
      };

      setChatMessages((prev) => {
        const workspaceMessages = prev[workspaceId] || [];
        return {
          ...prev,
          [workspaceId]: [...workspaceMessages, botMessage],
        };
      });

      // Save the chat history to the API
      try {
        const promptData: ChatPrompt = {
          prompt_text: message,
          response_text: response.answer,
          model_name: DEFAULT_MODEL_NAME,
          temperature: DEFAULT_TEMPERATURE,
          token_usage: DEFAULT_TOKEN_USAGE,
          ws_id: workspaceId,
          user_id: user.user_id,
          session_id: sessionId,
          is_active: true
        };
        
        await promptHistoryApi.savePrompt(promptData);
      } catch (saveErr) {
        console.error("Failed to save prompt history:", saveErr);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send message";
      setError(errorMessage);
      toast.error(errorMessage);

      // Add error message as bot response
      const errorBotMessage: ChatMessage = {
        id: uuidv4(),
        content:
          err instanceof Error ? err.message : "Sorry, I couldn't process your request. Please try again later.",
        type: "bot",
        timestamp: Date.now(),
      };

      setChatMessages((prev) => {
        const workspaceMessages = prev[workspaceId] || [];
        return {
          ...prev,
          [workspaceId]: [...workspaceMessages, errorBotMessage],
        };
      });
    } finally {
      setLoading(false);
    }
  };

  const contextValue: WorkspaceContextType = {
    workspaces,
    selectedWorkspace,
    loading,
    error,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    selectWorkspace,
    uploadDocument,
    deleteDocument,
    refreshWorkspaces,
    sendMessage,
    loadPromptHistory,
    chatMessages,
    currentSessionDocuments,
  };

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};

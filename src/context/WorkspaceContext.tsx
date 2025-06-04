import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Workspace,
  Document,
  WorkspaceWithDocuments,
  ChatMessage,
  ChatData,
  LLMResponse,
  ChatPrompt,
  SessionType,
  SessionInfo
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
  listUploadedFiles: (sessionId: string) => Promise<string[]>;
  scrapeUrl: (url: string) => Promise<boolean>;
  currentSessionType: SessionType;
}

interface SessionIdMap {
  [workspaceId: number]: string;
}

interface SessionTypeMap {
  [workspaceId: number]: SessionType;
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

// Local storage keys
const SESSION_IDS_STORAGE_KEY = "workspace_session_ids";
const SESSION_TYPES_STORAGE_KEY = "workspace_session_types";
const SESSION_DOCUMENTS_STORAGE_KEY = "workspace_session_documents";

export const WorkspaceProvider = ({ children }: WorkspaceProviderProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceWithDocuments[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] =
    useState<WorkspaceWithDocuments | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatData>({});
  
  // Initialize session data from localStorage
  const [sessionIds, setSessionIds] = useState<SessionIdMap>(() => {
    const savedSessionIds = localStorage.getItem(SESSION_IDS_STORAGE_KEY);
    return savedSessionIds ? JSON.parse(savedSessionIds) : {};
  });
  
  const [sessionTypes, setSessionTypes] = useState<SessionTypeMap>(() => {
    const savedSessionTypes = localStorage.getItem(SESSION_TYPES_STORAGE_KEY);
    return savedSessionTypes ? JSON.parse(savedSessionTypes) : {};
  });
  
  const [sessionDocuments, setSessionDocuments] = useState<SessionDocumentsMap>(() => {
    const savedSessionDocs = localStorage.getItem(SESSION_DOCUMENTS_STORAGE_KEY);
    return savedSessionDocs ? JSON.parse(savedSessionDocs) : {};
  });
  
  const [currentSessionDocuments, setCurrentSessionDocuments] = useState<string[]>([]);
  const [currentSessionType, setCurrentSessionType] = useState<SessionType>('empty');

  // Save session data to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(SESSION_IDS_STORAGE_KEY, JSON.stringify(sessionIds));
  }, [sessionIds]);
  
  useEffect(() => {
    localStorage.setItem(SESSION_TYPES_STORAGE_KEY, JSON.stringify(sessionTypes));
  }, [sessionTypes]);
  
  useEffect(() => {
    localStorage.setItem(SESSION_DOCUMENTS_STORAGE_KEY, JSON.stringify(sessionDocuments));
  }, [sessionDocuments]);

  useEffect(() => {
    if (user?.user_id) {
      refreshWorkspaces();
    }
  }, [user?.user_id]);

  // Load chat history and session info when a workspace is selected
  useEffect(() => {
    if (selectedWorkspace?.ws_id && user?.user_id) {
      loadLatestChatHistory(selectedWorkspace.ws_id, user.user_id);

      // If workspace has a session_id, update sessionIds
      if (selectedWorkspace.session_id && selectedWorkspace.ws_id) {
        if (!sessionIds[selectedWorkspace.ws_id]) {
          setSessionIds((prev) => ({
            ...prev,
            [selectedWorkspace.ws_id!]: selectedWorkspace.session_id!,
          }));
        }

        // Update current session type based on stored data
        if (selectedWorkspace.ws_id && sessionTypes[selectedWorkspace.ws_id]) {
          setCurrentSessionType(sessionTypes[selectedWorkspace.ws_id]);
        } else {
          // Default to 'empty' if no type is stored
          setCurrentSessionType('empty');
        }

        // Load session documents for the workspace
        if (selectedWorkspace.session_id) {
          listUploadedFiles(selectedWorkspace.session_id)
            .then((files) => {
              if (files && files.length > 0) {
                // Determine session type based on file extensions
                const hasPdfs = files.some(file => file.endsWith('.pdf'));
                const hasUrls = files.some(file => file.startsWith('http'));
                
                let type: SessionType = 'empty';
                if (hasPdfs && hasUrls) {
                  type = 'pdf'; // Mixed type, default to 'pdf' for backwards compatibility
                } else if (hasPdfs) {
                  type = 'pdf';
                } else if (hasUrls) {
                  type = 'url';
                }
                
                // Store the session type
                setSessionTypes((prev) => ({
                  ...prev,
                  [selectedWorkspace.ws_id!]: type
                }));
                
                setCurrentSessionType(type);
                
                // Store the documents
                setSessionDocuments((prev) => ({
                  ...prev,
                  [selectedWorkspace.ws_id!]: files,
                }));
                
                setCurrentSessionDocuments(files);
              }
            })
            .catch((err) => {
              console.error("Error loading session files:", err);
            });
        }
      }
    }
  }, [selectedWorkspace?.ws_id, user?.user_id, selectedWorkspace?.session_id]);

  // Load session documents when session changes
  useEffect(() => {
    const loadDocumentsForWorkspace = async () => {
      if (selectedWorkspace?.ws_id && selectedWorkspace?.session_id) {
        try {
          const files = await listUploadedFiles(selectedWorkspace.session_id);
          const docs = files && files.length > 0 ? files : [];
          
          // Determine session type based on files
          let type: SessionType = 'empty';
          const hasPdfs = docs.some(doc => doc.endsWith('.pdf'));
          const hasUrls = docs.some(doc => doc.startsWith('http'));
          
          if (hasPdfs && hasUrls) {
            type = 'pdf'; // Mixed type defaults to 'pdf'
          } else if (hasPdfs) {
            type = 'pdf';
          } else if (hasUrls) {
            type = 'url';
          }
          
          // Update session type
          setSessionTypes((prev) => ({
            ...prev,
            [selectedWorkspace.ws_id!]: type
          }));
          
          setCurrentSessionType(type);
          
          // Update session documents
          setSessionDocuments((prev) => ({
            ...prev,
            [selectedWorkspace.ws_id!]: docs,
          }));

          setCurrentSessionDocuments(docs);
        } catch (err) {
          console.error("Error loading session files:", err);
          setCurrentSessionDocuments([]);
        }
      } else {
        setCurrentSessionDocuments([]);
        setCurrentSessionType('empty');
      }
    };

    loadDocumentsForWorkspace();
  }, [selectedWorkspace?.ws_id, selectedWorkspace?.session_id]);

  const loadLatestChatHistory = async (wsId: number, userId: number) => {
    try {
      // Get all prompts for this workspace and user
      const response = await promptHistoryApi.getAllSessionsForWorkspace(
        wsId,
        userId
      );

      if (
        response.success &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        // Group prompts by session
        const groupedBySession: Record<string, ChatPrompt[]> = {};
        response.data.forEach((prompt) => {
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
          const maxPromptId = Math.max(...prompts.map((p) => p.prompt_id || 0));
          if (maxPromptId > latestPromptId) {
            latestPromptId = maxPromptId;
            latestSession = sessionId;
          }
        });

        if (latestSession) {
          // Store session ID for this workspace
          setSessionIds((prev) => ({
            ...prev,
            [wsId]: latestSession,
          }));

          // Convert prompts to chat messages
          const chatPrompts = groupedBySession[latestSession];
          const formattedMessages: ChatMessage[] = [];

          chatPrompts
            .sort((a, b) => (a.prompt_id || 0) - (b.prompt_id || 0))
            .forEach((prompt) => {
              // Create user message
              const userMessage: ChatMessage = {
                id: uuidv4(),
                content: prompt.prompt_text,
                type: "user",
                timestamp: Date.now() - 1000,
              };

              // Parse sources from prompt API response
              const parsedSources = Array.isArray(prompt.sources) 
                ? prompt.sources.map((source: string, index: number) => ({
                    source_id: uuidv4(),
                    summary: source,
                    file: source.includes('http') ? source.split(' ')[1] || source : source.match(/(\w+\.pdf)/)?.[1] || `document_${index}`,
                    page: source.includes('page') ? parseInt(source.match(/page (\d+)/)?.[1] || '1') : undefined,
                  }))
                : [];

              // Create bot message with sources from API
              const botMessage: ChatMessage = {
                id: uuidv4(),
                content: prompt.response_text,
                type: "bot",
                timestamp: Date.now(),
                sources: parsedSources,
              };

              formattedMessages.push(userMessage, botMessage);
            });

          // Update chat messages for this workspace
          setChatMessages((prev) => ({
            ...prev,
            [wsId]: formattedMessages,
          }));

          // Extract document names and determine session type
          const documents = extractDocumentNamesFromPrompts(chatPrompts);
          
          // Determine session type based on documents
          const hasPdfs = documents.some(doc => doc.endsWith('.pdf'));
          const hasUrls = documents.some(doc => doc.startsWith('http'));
          
          let sessionType: SessionType = 'empty';
          if (hasPdfs && hasUrls) {
            sessionType = 'pdf'; // Mixed type defaults to 'pdf'
          } else if (hasPdfs) {
            sessionType = 'pdf';
          } else if (hasUrls) {
            sessionType = 'url';
          }
          
          // Update session type
          setSessionTypes((prev) => ({
            ...prev,
            [wsId]: sessionType
          }));
          
          if (wsId === selectedWorkspace?.ws_id) {
            setCurrentSessionType(sessionType);
          }
          
          // Update session documents
          setSessionDocuments((prev) => ({
            ...prev,
            [wsId]: documents,
          }));
          
          setCurrentSessionDocuments(documents);

          console.log(
            `Loaded ${formattedMessages.length} messages for workspace ${wsId} with session type ${sessionType}`
          );
        }
      } else {
        // No history found, clear messages
        setChatMessages((prev) => ({
          ...prev,
          [wsId]: [],
        }));
        
        // Reset session type if no history
        if (wsId === selectedWorkspace?.ws_id) {
          setCurrentSessionType('empty');
        }
      }
    } catch (err) {
      console.error("Error loading chat history:", err);
    }
  };

  const loadPromptHistory = (prompt: ChatPrompt) => {
    if (!selectedWorkspace?.ws_id || !prompt.ws_id || !prompt.session_id)
      return;

    try {
      // Find all prompts in this session
      promptHistoryApi
        .getPrompts(prompt.ws_id, prompt.user_id, prompt.session_id)
        .then((response) => {
          if (response.success && Array.isArray(response.data)) {
            // Convert to chat messages
            const sortedPrompts = response.data.sort(
              (a, b) => (a.prompt_id || 0) - (b.prompt_id || 0)
            );

            const formattedMessages: ChatMessage[] = [];

            sortedPrompts.forEach((p) => {
              // Create user message
              const userMessage: ChatMessage = {
                id: uuidv4(),
                content: p.prompt_text,
                type: "user",
                timestamp: Date.now() - 1000,
              };

              // Parse sources from prompt API response
              const parsedSources = Array.isArray(p.sources) 
                ? p.sources.map((source: string, index: number) => ({
                    source_id: uuidv4(),
                    summary: source,
                    file: source.includes('http') ? source.split(' ')[1] || source : source.match(/(\w+\.pdf)/)?.[1] || `document_${index}`,
                    page: source.includes('page') ? parseInt(source.match(/page (\d+)/)?.[1] || '1') : undefined,
                  }))
                : [];

              // Create bot message
              const botMessage: ChatMessage = {
                id: uuidv4(),
                content: p.response_text,
                type: "bot",
                timestamp: Date.now(),
                sources: parsedSources,
              };

              formattedMessages.push(userMessage, botMessage);
            });

            // Update chat messages for this workspace
            setChatMessages((prev) => ({
              ...prev,
              [selectedWorkspace.ws_id!]: formattedMessages,
            }));

            // Update session ID for this workspace
            setSessionIds((prev) => ({
              ...prev,
              [selectedWorkspace.ws_id!]: prompt.session_id,
            }));

            // Extract document names and determine session type
            const documents = extractDocumentNamesFromPrompts(sortedPrompts);
            
            // Determine session type based on documents
            const hasPdfs = documents.some(doc => doc.endsWith('.pdf'));
            const hasUrls = documents.some(doc => doc.startsWith('http'));
            
            let sessionType: SessionType = 'empty';
            if (hasPdfs && hasUrls) {
              sessionType = 'pdf'; // Mixed type defaults to 'pdf'
            } else if (hasPdfs) {
              sessionType = 'pdf';
            } else if (hasUrls) {
              sessionType = 'url';
            }
            
            // Update session type
            setSessionTypes((prev) => ({
              ...prev,
              [selectedWorkspace.ws_id!]: sessionType
            }));
            
            setCurrentSessionType(sessionType);
            
            // Update session documents
            setSessionDocuments((prev) => ({
              ...prev,
              [selectedWorkspace.ws_id!]: documents,
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

  const extractDocumentNamesFromPrompts = (prompts: ChatPrompt[]): string[] => {
    const documents: string[] = [];

    // Look for document mentions in responses
    prompts.forEach((prompt) => {
      const responseText = prompt.response_text || "";

      // Look for URLs mentioned in the response
      if (responseText.includes('http://') || responseText.includes('https://')) {
        const urlRegex = /(https?:\/\/[^\s"']+)/g;
        const matches = responseText.match(urlRegex);
        if (matches) {
          matches.forEach((match) => {
            if (!documents.includes(match) && !match.endsWith('.pdf')) {
              documents.push(match);
            }
          });
        }
      }
      
      // Look for PDF filenames
      if (responseText.includes(".pdf")) {
        const regex = /([a-zA-Z0-9_-]+\.pdf)/g;
        const matches = responseText.match(regex);
        if (matches) {
          matches.forEach((match) => {
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
  const extractSourcesFromResponse = (responseText: string, sources?: any[]): any[] => {
    try {
      // Check if the response contains a JSON part with sources
      if (responseText.includes('"sources":')) {
        const match = responseText.match(/\{.*"sources":\s*(\[.*?\])/s);
        if (match && match[1]) {
          const sourcesJson = match[1];
          return JSON.parse(sourcesJson);
        }
      }
      return sources || [];
    } catch (e) {
      console.error("Failed to extract sources from response:", e);
      return [];
    }
  };

  const listUploadedFiles = async (sessionId: string): Promise<string[]> => {
    try {
      const result = await llmApi.listFiles(sessionId);
      if (result.success && result.files) {
        return result.files;
      }
      return [];
    } catch (error) {
      console.error("Failed to list uploaded files:", error);
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

        // Sort workspaces by creation date (newest first)
        transformed.sort((a, b) => {
          if (a.ws_id && b.ws_id) {
            return b.ws_id - a.ws_id;
          }
          return 0;
        });

        for (const workspace of transformed) {
          try {
            if (workspace.ws_id) {
              const docs = await documentApi.getAll(workspace.ws_id);
              workspace.documents = docs;
              workspace.fileCount = docs.length;

              if (workspace.session_id && workspace.ws_id) {
                setSessionIds((prev) => ({
                  ...prev,
                  [workspace.ws_id!]: workspace.session_id!,
                }));
              }
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

      // First, create a session with the LLM API
      const sessionResponse = await llmApi.startSession();

      if (!sessionResponse.success || !sessionResponse.session_id) {
        toast.error("Failed to initialize the AI session");
        return;
      }

      const sessionId = sessionResponse.session_id;

      console.log(`Created new session ID: ${sessionId}`);

      // Then, create the workspace in the backend, including the session_id
      const newWorkspace: Workspace = {
        ws_name: name,
        user_id: user.user_id,
        is_active: true,
        session_id: sessionId,
      };

      const response = await workspaceApi.create(newWorkspace);
      console.log("Create response:", response);

      const workspaceData = Array.isArray(response.data)
        ? response.data[0]
        : response.data;

      if (response.success && workspaceData?.ws_id) {
        // Store session information
        setSessionIds((prev) => ({
          ...prev,
          [workspaceData.ws_id]: sessionId,
        }));
        
        // Initialize session type as empty
        setSessionTypes((prev) => ({
          ...prev,
          [workspaceData.ws_id]: 'empty'
        }));
        
        // Initialize empty documents array
        setSessionDocuments((prev) => ({
          ...prev,
          [workspaceData.ws_id]: []
        }));

        console.log(
          `Associated session ID ${sessionId} with workspace ${workspaceData.ws_id}`
        );
        toast.success("Workspace created successfully");

        await refreshWorkspaces();
        
        // Navigate to the newly created workspace
        navigate(`/workspace/${workspaceData.ws_id}`);
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
    if (workspace.ws_id) {
      navigate(`/workspace/${workspace.ws_id}`);
    }
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

      // Get the session ID for this workspace
      let sessionId = selectedWorkspace.ws_id
        ? selectedWorkspace.session_id || sessionIds[selectedWorkspace.ws_id]
        : undefined;

      if (!sessionId) {
        toast.error("No session found for this workspace");
        return false;
      }

      // Upload document to LLM API using the session ID
      try {
        const result = await llmApi.uploadDocument(file, sessionId);

        if (result.success) {
          toast.success(
            result.message || "Document uploaded successfully to AI"
          );

          // Update session type
          const wsId = selectedWorkspace.ws_id!;
          const currentType = sessionTypes[wsId] || 'empty';
          
          // Update to PDF type if it was empty, or leave as is
          if (currentType === 'empty') {
            setSessionTypes((prev) => ({
              ...prev,
              [wsId]: 'pdf'
            }));
            setCurrentSessionType('pdf');
          }

          // Update session documents
          setSessionDocuments((prev) => {
            const currentDocs = prev[wsId] || [];
            const newDocs = [...currentDocs];
            if (!currentDocs.includes(file.name)) {
              newDocs.push(file.name);
            }
            return {
              ...prev,
              [wsId]: newDocs,
            };
          });

          // Update current session documents
          setCurrentSessionDocuments((prevDocs) => {
            if (!prevDocs.includes(file.name)) {
              return [...prevDocs, file.name];
            }
            return prevDocs;
          });
        } else {
          console.error("Failed to upload to LLM API");
          toast.error("Failed to process document with AI");
        }
      } catch (llmErr) {
        console.error("Failed to upload to LLM API:", llmErr);
        toast.error("Failed to process document with AI");
      }

      // Continue with the regular document upload
      const response = await documentApi.upload(file, {
        ...selectedWorkspace,
        user_id: user?.user_id || 1,
      });

      if (response.success) {
        await refreshWorkspaces();
        return true;
      } else {
        toast.error("Failed to save document metadata");
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
    const workspace = workspaces.find(w => w.ws_id === workspaceId);
    if (!workspace?.session_id) {
      throw new Error("No session found for this workspace");
    }

    const userId = 1; // TODO: Get from auth context
    const timestamp = Date.now();
    const userMessage: ChatMessage = {
      id: `user-${timestamp}`,
      content: message,
      type: 'user',
      timestamp: timestamp.toString(),
    };

    // Add user message to UI immediately
    setChatMessages(prev => ({
      ...prev,
      [workspaceId]: [...(prev[workspaceId] || []), userMessage]
    }));

    try {
      // Step 1: Save prompt immediately with empty response
      const initialPromptData = {
        prompt_text: message,
        response_text: "",
        model_name: "llama3.2:latest",
        temperature: 1.5,
        token_usage: 200,
        ws_id: workspaceId,
        user_id: userId,
        session_id: workspace.session_id,
        resp_time: "0",
        sources: [],
        is_active: true
      };

      const promptResponse = await promptHistoryApi.savePrompt(initialPromptData);
      const promptId = promptResponse.data?.prompt_id;

      // Step 2: Get LLM response
      const llmResponse = await llmApi.query(message, workspace.session_id);

      // Step 3: Update prompt with response
      if (promptId) {
        const updatedPromptData = {
          ...initialPromptData,
          prompt_id: promptId,
          response_text: llmResponse.answer,
          sources: llmResponse.sources?.map(src => `Context: ${src.file} page ${src.page || 1}`) || []
        };

        await promptHistoryApi.savePrompt(updatedPromptData);
      }

      const botMessage: ChatMessage = {
        id: `bot-${timestamp + 1}`,
        content: llmResponse.answer,
        type: 'bot',
        timestamp: (timestamp + 1).toString(),
        sources: llmResponse.sources,
      };

      // Add bot response to UI
      setChatMessages(prev => ({
        ...prev,
        [workspaceId]: [...(prev[workspaceId] || []), botMessage]
      }));

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove user message on error
      setChatMessages(prev => ({
        ...prev,
        [workspaceId]: (prev[workspaceId] || []).filter(msg => msg.id !== userMessage.id)
      }));
      
      throw error;
    }
  };

  const scrapeUrl = async (url: string): Promise<boolean> => {
    try {
      if (!selectedWorkspace) {
        toast.error("Please select a workspace first");
        return false;
      }

      setLoading(true);

      // Get the session ID for this workspace
      let sessionId = selectedWorkspace.ws_id
        ? selectedWorkspace.session_id || sessionIds[selectedWorkspace.ws_id]
        : undefined;

      if (!sessionId) {
        toast.error("No session found for this workspace");
        return false;
      }

      // Scrape URL using the LLM API
      try {
        const result = await llmApi.scrapeUrl(url, sessionId);

        if (result.success) {
          toast.success(result.message || "URL scraped successfully");

          // Update session type if necessary
          const wsId = selectedWorkspace.ws_id!;
          const currentType = sessionTypes[wsId] || 'empty';
          
          // Update to URL type if it was empty, or leave as is
          if (currentType === 'empty') {
            setSessionTypes((prev) => ({
              ...prev,
              [wsId]: 'url'
            }));
            setCurrentSessionType('url');
          }

          // Update session documents to include the URL
          setSessionDocuments((prev) => {
            const currentDocs = prev[wsId] || [];
            const newDocs = [...currentDocs];
            if (!currentDocs.includes(url)) {
              newDocs.push(url);
            }
            return {
              ...prev,
              [wsId]: newDocs,
            };
          });

          // Update current session documents
          setCurrentSessionDocuments((prevDocs) => {
            if (!prevDocs.includes(url)) {
              return [...prevDocs, url];
            }
            return prevDocs;
          });
          
          return true;
        } else {
          console.error("Failed to scrape URL with LLM API");
          toast.error("Failed to process URL");
          return false;
        }
      } catch (error) {
        console.error("Failed to scrape URL with LLM API:", error);
        toast.error("Failed to process URL");
        return false;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to scrape URL";
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
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
    scrapeUrl,
    deleteDocument,
    refreshWorkspaces,
    sendMessage,
    loadPromptHistory,
    chatMessages,
    currentSessionDocuments,
    listUploadedFiles,
    currentSessionType,
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

interface WorkspaceProviderProps {
  children: ReactNode;
}

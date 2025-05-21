
export interface Workspace {
  ws_id?: number;
  ws_name: string;
  user_id: number;
  is_active: boolean;
}

export interface Document {
  ws_doc_id?: number;
  ws_doc_path: string;
  ws_doc_name: string;
  ws_doc_extn: string;
  ws_doc_for: string;
  ws_id: number;
  user_id: number;
  is_active: boolean;
}

export interface WorkspaceWithDocuments extends Workspace {
  documents: Document[];
  messageCount: number;
  fileCount: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface LLMSource {
  source_id: string;
  summary: string;
  file: string;
  page: number;
}

export interface LLMResponse {
  answer: string;
  sources: LLMSource[];
}

export interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'bot';
  timestamp: number;
  sources?: LLMSource[];
}

export interface ChatData {
  [workspaceId: number]: ChatMessage[];
}

export interface ChatPrompt {
  prompt_id?: number;
  prompt_text: string;
  response_text: string;
  model_name: string;
  temperature: number;
  token_usage: number;
  ws_id: number;
  user_id: number;
  session_id: string;
  is_active: boolean;
  workspaces?: {
    ws_name: string;
  };
  users?: {
    user_name: string;
  };
}

export interface SigninRequest {
  user_email: string;
  user_pwd: string;
}

export interface SignupRequest {
  user_name: string;
  user_email: string;
  user_pwd: string;
  user_mobile: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  is_active: boolean;
}

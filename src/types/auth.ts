
export interface User {
  user_id: number;
  user_name: string;
  user_email: string;
  user_mobile?: string;
  gender?: string;
  role_id?: number;
  role_name?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
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
  gender: string;
  is_active: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: User;
  };
}

export interface UserForManagement {
  user_id: number;
  user_name: string;
  user_email: string;
  role_id: number;
  role_name: string;
  user_mobile?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ChatHistoryItem {
  prompt_id: number;
  prompt_text: string;
  response_text: string;
  model_name: string;
  temperature: number;
  token_usage: number;
  ws_id: number;
  session_id: string;
  created_at: string;
  workspaces: {
    ws_name: string;
  };
}

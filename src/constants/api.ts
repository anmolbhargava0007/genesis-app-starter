
// API endpoints
export const API_BASE_URL = "http://15.206.121.90:1909/api/v1";
export const LLM_API_BASE_URL = "http://15.206.121.90:8000";

// LLM API endpoints
export const LLM_START_SESSION_ENDPOINT = `${LLM_API_BASE_URL}/start-session/`;
export const LLM_UPLOAD_PDF_ENDPOINT = `${LLM_API_BASE_URL}/upload-pdf/`;
export const LLM_ASK_QUESTION_ENDPOINT = `${LLM_API_BASE_URL}/ask-question/`;

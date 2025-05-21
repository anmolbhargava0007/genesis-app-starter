import React, { useState, useRef, useEffect } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { ChatMessage, LLMSource } from "@/types/api";
import { v4 as uuidv4 } from "uuid";

interface ChatViewProps {
  workspaceId: number;
  onUploadClick: () => void;
}

const ChatView = ({ workspaceId, onUploadClick }: ChatViewProps) => {
  const { sendMessage, chatMessages, loading, currentSessionDocuments } =
    useWorkspace();
  const [query, setQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [expandedSources, setExpandedSources] = useState<
    Record<string, boolean>
  >({});

  // 👇 Scroll to bottom when chat messages or workspace change
  useEffect(() => {
    const timeout = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    return () => clearTimeout(timeout);
  }, [workspaceId, chatMessages]);

  const handleSendMessage = async () => {
    if (!query.trim()) return;

    try {
      await sendMessage(workspaceId, query);
      setQuery("");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredMessages = chatMessages[workspaceId] || [];

  const toggleSources = (messageId: string) => {
    setExpandedSources((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const renderSources = (
    sources: LLMSource[] | undefined,
    messageId: string
  ) => {
    if (!sources || sources.length === 0) return null;

    const isExpanded = expandedSources[messageId] || false;

    return (
      <div className="mt-2">
        <button
          onClick={() => toggleSources(messageId)}
          className="text-sm text-gray-500 hover:text-gray-300 flex items-center"
        >
          <span>{isExpanded ? "Hide Citations" : "Show Citations"}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 ml-1 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {isExpanded && (
          <div className="mt-2 space-y-1 p-3 border border-gray-600 rounded-md bg-gray-800/50">
            {sources.map((source) => (
              <div key={source.source_id} className="mb-2 last:mb-0">
                <div className="flex items-center text-blue-400">
                  <FileText className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">
                    {source.file} (page {source.page})
                  </span>
                </div>
                <p className="text-sm text-gray-300 mt-1 pl-5">
                  {source.summary}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto p-4 space-y-6 bg-gray-900">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-300">
            <FileText className="h-16 w-16 mb-4 text-gray-400" />
            <h2 className="text-2xl font-semibold mb-2">
              Start a conversation
            </h2>
            <p className="max-w-md text-gray-400">
              Ask questions about your documents or upload more files to
              analyze.
            </p>
          </div>
        ) : (
          <>
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-3xl rounded-lg p-4 ${
                    message.type === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-white"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.type === "bot" &&
                    renderSources(message.sources, message.id)}
                </div>
              </div>
            ))}

            {/* 👇 Loading Bot Message Animation */}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-3xl rounded-lg p-4 bg-gray-800 text-white">
                  <div className="flex space-x-1 animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full" />
                    <div className="w-2 h-2 bg-white rounded-full" />
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-700 bg-gray-800 flex justify-start items-center">
        <div className="flex flex-wrap md:flex-nowrap gap-6 items-center justify-center w-full max-w-6xl">
          {currentSessionDocuments.length > 0 && (
            <div className="border-b border-gray-700 p-3 flex-shrink-0 bg-gray-800">
              <div className="flex items-center mb-1">
                <FileText className="h-2 w-2 mr-2 text-[#A259FF]" />
                <span className="text-sm font-medium text-gray-300">
                  Current Session Documents:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentSessionDocuments.map((doc, index) => (
                  <div
                    key={index}
                    className="bg-gray-700 text-xs px-2 py-1 rounded flex items-center"
                  >
                    <span className="text-[#A259FF]">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 flex-1">
            <Button
              type="button"
              onClick={onUploadClick}
              variant="ghost"
              className="text-gray-300 hover:text-white hover:bg-gray-700"
              title="Upload Document"
            >
              <Upload className="h-5 w-5" />
            </Button>

            <Input
              type="text"
              placeholder="Ask about your documents..."
              className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus-visible:ring-[#A259FF]"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />

            <Button
              className="bg-[#A259FF] hover:bg-[#A259FF]/90 text-white"
              onClick={handleSendMessage}
              disabled={!query.trim() || loading}
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;

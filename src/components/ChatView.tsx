import React, { useState, useRef, useEffect } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Upload,
  FileText,
  ChevronDown,
  ChevronUp,
  Link,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ChatMessage, LLMSource } from "@/types/api";
import SessionIndicator from "./SessionIndicator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ChatViewProps {
  workspaceId: number;
  onUploadClick: () => void;
  onUrlClick: () => void;
}

const ChatView = ({
  workspaceId,
  onUploadClick,
  onUrlClick,
}: ChatViewProps) => {
  const [showAll, setShowAll] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    sendMessage,
    chatMessages,
    loading,
    currentSessionDocuments,
    currentSessionType,
    selectedWorkspace,
  } = useWorkspace();
  const [query, setQuery] = useState("");
  const [queries, setQueries] = useState<Record<number, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loadingMap, setLoadingMap] = useState<{
    [workspaceId: string]: boolean;
  }>({});
  const [expandedSources, setExpandedSources] = useState<
    Record<string, boolean>
  >({});

  // Determine if chat history exists
  const hasChatHistory = chatMessages[workspaceId]?.length > 0;

  // Check session state
  const isPdfSession = currentSessionType === "pdf";
  const isUrlSession = currentSessionType === "url";
  const isEmptySession = currentSessionType === "empty";
  const hasDocuments = currentSessionDocuments.length > 0;

  // Get domain name from URL for display
  const getWebsiteDomain = (url: string): string => {
    try {
      if (!url) return "";
      if (!url.startsWith("http")) url = "https://" + url;
      const domain = new URL(url).hostname;
      return domain.startsWith("www.") ? domain : "www." + domain;
    } catch (e) {
      return url;
    }
  };

  // Get website display name
  const getScrapedWebsite = (): string => {
    if (!currentSessionDocuments.length) return "";
    const url = currentSessionDocuments.find((doc) => doc.startsWith("http"));
    return url ? getWebsiteDomain(url) : "";
  };

  const filteredMessages = chatMessages[workspaceId] || [];

  // Scroll to bottom
  useEffect(() => {
    const timeout = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timeout);
  }, [workspaceId, chatMessages]);

  const currentQuery = workspaceId ? queries[workspaceId] || "" : "";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!workspaceId) return;
    const value = e.target.value;
    setQueries((prev) => ({
      ...prev,
      [workspaceId]: value,
    }));
  };

  const handleSendMessage = async () => {
    if (!workspaceId) return;

    const currentQuery = queries[workspaceId] || "";

    if (!currentQuery.trim()) return;

    if (!hasDocuments && !hasChatHistory) {
      toast.warning(
        "Please upload a PDF or scrape a URL before sending a message."
      );
      return;
    }

    // Clear input immediately
    setQueries((prev) => ({
      ...prev,
      [workspaceId]: "",
    }));

    // Set loading true for this workspace
    setLoadingMap((prev) => ({
      ...prev,
      [workspaceId]: true,
    }));

    try {
      await sendMessage(workspaceId, currentQuery);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");

      // Restore input on failure
      setQueries((prev) => ({
        ...prev,
        [workspaceId]: currentQuery,
      }));
    } finally {
      setLoadingMap((prev) => ({
        ...prev,
        [workspaceId]: false,
      }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
                  {source.file.startsWith("http") ? (
                    <Link className="h-4 w-4 mr-1" />
                  ) : (
                    <FileText className="h-4 w-4 mr-1" />
                  )}
                  <span className="text-sm font-medium">
                    {source.file}
                    {source.page && ` (page ${source.page})`}
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

  // Main JSX
  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Chat area */}
      <div className="flex-grow overflow-y-auto px-4 py-6 space-y-6">
        {hasChatHistory ? (
          filteredMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-2xl px-5 py-4 rounded-2xl shadow-md text-sm leading-relaxed ${
                  message.type === "user"
                    ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white"
                    : "bg-gray-800 text-gray-100"
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.type === "bot" &&
                  renderSources(message.sources, message.id)}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <FileText className="h-16 w-16 mb-4 text-gray-500" />
            <h2 className="text-2xl font-semibold mb-2">
              Start a conversation
            </h2>
          </div>
        )}

        {loadingMap[workspaceId] && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-white px-5 py-3 rounded-xl animate-pulse flex gap-2">
              <div className="w-2 h-2 rounded-full bg-white" />
              <div className="w-2 h-2 rounded-full bg-white" />
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="bg-gray-900 border-t border-gray-700 sticky bottom-0 z-10 px-4 py-3">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <Button onClick={() => setIsModalOpen(true)}>View Session</Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onUploadClick}
            className="hover:bg-gray-700 text-gray-300"
          >
            <Upload />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onUrlClick}
            className="hover:bg-gray-700 text-gray-300"
          >
            <Link />
          </Button>

          <Input
            placeholder="Ask something..."
            value={queries[workspaceId] || ""}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            className="flex-grow bg-gray-800 text-gray-100 border-none focus:ring-2 focus:ring-blue-500 rounded-xl"
          />

          <Button
            variant="default"
            onClick={handleSendMessage}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 shadow-lg"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Session Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle>Current Session</DialogTitle>
          </DialogHeader>

          <SessionIndicator
            isUrlSession={isUrlSession}
            isPdfSession={isPdfSession}
            getScrapedWebsite={getScrapedWebsite}
            currentSessionDocuments={currentSessionDocuments}
          />

          <DialogFooter>
            <Button onClick={() => setIsModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatView;

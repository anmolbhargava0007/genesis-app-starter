
import React, { useState, useRef, useEffect } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Send, Upload, FileText, Link, ClipboardCopy, User, Bot } from "lucide-react";
import { toast } from "sonner";
import { ChatMessage, LLMSource } from "@/types/api";
import SessionIndicator from "./SessionIndicator";
import FreeTierModal from "./FreeTierModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFreeTierModalOpen, setIsFreeTierModalOpen] = useState(false);
  const { isAppValid } = useAuth();
  const {
    sendMessage,
    chatMessages,
    loading,
    currentSessionDocuments,
    currentSessionType,
  } = useWorkspace();

  const [queries, setQueries] = useState<Record<number, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [expandedSources, setExpandedSources] = useState<
    Record<string, boolean>
  >({});

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Determine if chat history exists
  const hasChatHistory = chatMessages[workspaceId]?.length > 0;
  const isPdfSession = currentSessionType === "pdf";
  const isUrlSession = currentSessionType === "url";
  const hasDocuments = currentSessionDocuments.length > 0;

  const filteredMessages = chatMessages[workspaceId] || [];

  // Scroll to bottom on new messages
  useEffect(() => {
    const timeout = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timeout);
  }, [workspaceId, chatMessages]);

  const autoResize = () => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = inputRef.current.scrollHeight + "px";
    }
  };

  useEffect(() => {
    autoResize();
  }, [queries[workspaceId]]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setQueries((prev) => ({
      ...prev,
      [workspaceId]: value,
    }));
  };

  const checkFreeTierAccess = (): boolean => {
    if (!isAppValid) {
      setIsFreeTierModalOpen(true);
      return false;
    }
    return true;
  };

  const handleSendMessage = async () => {
    if (!checkFreeTierAccess()) return;
    const currentQuery = queries[workspaceId] || "";
    if (!currentQuery.trim()) return;
    if (!hasDocuments && !hasChatHistory) {
      toast.warning(
        "Please upload a PDF or scrape a URL before sending a message."
      );
      return;
    }

    // clear and show loading
    setQueries((prev) => ({ ...prev, [workspaceId]: "" }));
    setLoadingMap((prev) => ({ ...prev, [workspaceId]: true }));

    try {
      await sendMessage(workspaceId, currentQuery);
    } catch (error) {
      console.error(error);
      toast.error("Failed to send message");
      // restore text
      setQueries((prev) => ({ ...prev, [workspaceId]: currentQuery }));
    } finally {
      setLoadingMap((prev) => ({ ...prev, [workspaceId]: false }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
      <div className="mt-4 pt-3 border-t border-border/50">
        <button
          onClick={() => toggleSources(messageId)}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center transition-colors"
        >
          <span>{isExpanded ? "Hide Citations" : "Show Citations"} ({sources.length})</span>
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
          <div className="mt-3 space-y-3 p-4 border border-border rounded-lg bg-muted/30">
            {sources.map((src, index) => (
              <div key={src.source_id} className="border-l-2 border-primary/30 pl-3">
                <div className="flex items-center text-primary">
                  {src.file.startsWith("http") ? (
                    <Link className="h-4 w-4 mr-2" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  <span className="text-sm font-medium">
                    [{index + 1}] {src.file} {src.page && `(page ${src.page})`}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{src.summary}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleUploadClick = () => {
    if (checkFreeTierAccess()) onUploadClick();
  };
  const handleUrlClick = () => {
    if (checkFreeTierAccess()) onUrlClick();
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat messages */}
      <div className="flex-grow overflow-y-auto px-4 py-6 space-y-6">
        {hasChatHistory ? (
          filteredMessages.map((msg) => (
            <div key={msg.id} className="space-y-1">
              {/* Message header with timestamp */}
              <div className={`flex items-center gap-2 ${
                msg.type === "user" ? "justify-end" : "justify-start"
              }`}>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {msg.type === "user" ? (
                    <>
                      <span>You</span>
                      <User className="h-3 w-3" />
                    </>
                  ) : (
                    <>
                      <Bot className="h-3 w-3" />
                      <span>Assistant</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{formatTimestamp(msg.timestamp)}</span>
                </div>
              </div>
              
              {/* Message content */}
              <div className={`flex ${
                msg.type === "user" ? "justify-end" : "justify-start"
              }`}>
                <div className={`relative max-w-3xl px-5 py-4 rounded-2xl text-sm leading-relaxed shadow-sm border ${
                  msg.type === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-card-foreground"
                }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {msg.type === "bot" && (
                    <>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(msg.content);
                          toast.success("Response copied");
                        }}
                        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy response"
                      >
                        <ClipboardCopy className="h-4 w-4" />
                      </button>
                      {renderSources(msg.sources, msg.id)}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <FileText className="h-16 w-16 mb-4 text-muted-foreground/50" />
            <h2 className="text-2xl font-semibold">Start a conversation</h2>
            <p className="text-sm mt-2">Upload documents or scrape URLs to begin</p>
          </div>
        )}

        {loadingMap[workspaceId] && (
          <div className="flex justify-start">
            <div className="bg-card text-card-foreground px-5 py-3 rounded-xl animate-pulse flex gap-2 border shadow-sm">
              <div className="w-2 h-2 rounded-full bg-primary/50" />
              <div className="w-2 h-2 rounded-full bg-primary/50" />
              <div className="w-2 h-2 rounded-full bg-primary/50" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="bg-muted/30 p-2 w-[80%] mx-auto flex flex-col gap-2 rounded-xl border border-border">
        <div className="relative">
          <textarea
            ref={inputRef}
            rows={1}
            placeholder="Ask anything related to the uploaded files or URLs."
            value={queries[workspaceId] || ""}
            onChange={(e) => {
              handleInputChange(e);
              autoResize();
            }}
            onKeyDown={handleKeyPress}
            className="w-full resize-none bg-transparent text-foreground border-none focus:outline-none focus:ring-0 rounded-xl px-4 py-3 min-h-[40px] max-h-48 overflow-y-auto placeholder:text-muted-foreground"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-between gap-2 flex-wrap">
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              variant="secondary"
              className="px-3 py-2 text-sm"
            >
              Session info
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUploadClick}
              className="hover:bg-accent text-muted-foreground hover:text-foreground p-2"
            >
              <Upload className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUrlClick}
              className="hover:bg-accent text-muted-foreground hover:text-foreground p-2"
            >
              <Link className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="default"
            onClick={handleSendMessage}
            disabled={loading}
            className="rounded-xl px-4 py-2 shadow-md text-sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Session Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Current Session</DialogTitle>
          </DialogHeader>

          <SessionIndicator
            isUrlSession={isUrlSession}
            isPdfSession={isPdfSession}
            getScrapedWebsite={() => ""}
            currentSessionDocuments={currentSessionDocuments}
          />

          <DialogFooter>
            <Button onClick={() => setIsModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FreeTierModal
        isOpen={isFreeTierModalOpen}
        onClose={() => setIsFreeTierModalOpen(false)}
      />
    </div>
  );
};

export default ChatView;

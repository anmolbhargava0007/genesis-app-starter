import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { History, MessageSquare } from "lucide-react";
import { ChatPrompt } from "@/types/api";
import { promptHistoryApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface ChatHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: number;
  onSelectPrompt: (prompt: ChatPrompt) => void;
}

interface SessionGroup {
  sessionId: string;
  prompts: ChatPrompt[];
  firstPromptTime: string;
  documents: string[];
}

const ChatHistoryDialog = ({
  isOpen,
  onClose,
  workspaceId,
  onSelectPrompt,
}: ChatHistoryDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sessionGroups, setSessionGroups] = useState<SessionGroup[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && workspaceId && user?.user_id) {
      loadHistory();
    }
  }, [isOpen, workspaceId, user?.user_id]);

  const loadHistory = async () => {
    if (!user?.user_id) return;
    try {
      setLoading(true);
      const response = await promptHistoryApi.getAllSessionsForWorkspace(
        workspaceId,
        user.user_id
      );

      if (response.success && Array.isArray(response.data)) {
        const groupedBySession: Record<string, ChatPrompt[]> = {};
        response.data.forEach((prompt) => {
          if (!groupedBySession[prompt.session_id]) {
            groupedBySession[prompt.session_id] = [];
          }
          groupedBySession[prompt.session_id].push(prompt);
        });

        const groups = Object.entries(groupedBySession).map(([sessionId, prompts]) => {
          const sortedPrompts = [...prompts].sort(
            (a, b) => (a.prompt_id || 0) - (b.prompt_id || 0)
          );
          const documents = extractDocumentNames(sortedPrompts);
          const firstPromptTime = new Date().toLocaleDateString();
          return { sessionId, prompts: sortedPrompts, firstPromptTime, documents };
        });

        const sortedGroups = groups.sort((a, b) => {
          const aLatestId = a.prompts[a.prompts.length - 1]?.prompt_id || 0;
          const bLatestId = b.prompts[b.prompts.length - 1]?.prompt_id || 0;
          return bLatestId - aLatestId;
        });

        setSessionGroups(sortedGroups);
        if (sortedGroups.length > 0) {
          setExpandedSession(sortedGroups[0].sessionId);
        }
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
      toast.error("Failed to load chat history");
    } finally {
      setLoading(false);
    }
  };

  const extractDocumentNames = (prompts: ChatPrompt[]): string[] => {
    const documents: string[] = [];
    prompts.forEach((prompt) => {
      const responseText = prompt.response_text || "";
      if (responseText.includes("invoice_") || responseText.includes(".pdf")) {
        const matches = responseText.match(/([a-zA-Z0-9_-]+\.pdf)/g);
        matches?.forEach((match) => {
          if (!documents.includes(match)) {
            documents.push(match);
          }
        });
      }
    });
    return documents;
  };

  const handlePromptClick = (prompt: ChatPrompt) => {
    onSelectPrompt(prompt);
    onClose();
  };

  const toggleSession = (sessionId: string) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-zinc-900 text-white rounded-xl border border-zinc-700 shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg text-white">
            <History className="h-5 w-5 text-purple-400" />
            Chat History
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-purple-500 rounded-full border-t-transparent" />
            </div>
          ) : sessionGroups.length > 0 ? (
            <div className="space-y-4">
              {sessionGroups.map((group) => (
                <div key={group.sessionId} className="bg-zinc-800 rounded-lg shadow-sm">
                  <Button
                    variant="ghost"
                    className="w-full flex justify-between items-center px-4 py-3 text-left bg-zinc-800 hover:bg-zinc-700 transition"
                    onClick={() => toggleSession(group.sessionId)}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">
                        Session {group.sessionId.slice(0, 8)}...
                      </span>
                      <span className="text-xs text-zinc-400">
                        {group.firstPromptTime} • {group.prompts.length} messages
                      </span>
                    </div>
                    <span className="text-white">{expandedSession === group.sessionId ? "▲" : "▼"}</span>
                  </Button>

                  {expandedSession === group.sessionId && (
                    <div className="p-3 pt-0">
                      {group.documents.length > 0 && (
                        <div className="mb-3 p-3 bg-zinc-700 rounded-lg text-sm">
                          <div className="font-medium text-white mb-1">Documents:</div>
                          <ul className="list-disc list-inside text-zinc-300">
                            {group.documents.map((doc, idx) => (
                              <li key={idx}>{doc}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="space-y-1">
                        {group.prompts.map((prompt) => (
                          <Button
                            key={prompt.prompt_id}
                            variant="ghost"
                            className="w-full justify-start text-left px-3 py-2 text-sm hover:bg-zinc-700 text-white transition"
                            onClick={() => handlePromptClick(prompt)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2 text-purple-300" />
                            <span className="truncate">{prompt.prompt_text}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <History className="h-10 w-10 mb-3 text-purple-300" />
              <p>No chat history found</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ChatHistoryDialog;
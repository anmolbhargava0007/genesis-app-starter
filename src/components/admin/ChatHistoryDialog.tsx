
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChatHistoryItem } from "@/types/auth";
import { authApi } from "@/services/authApi";
import { toast } from "sonner";

interface ChatHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
}

// Helper function to group chat history by session
function groupBySession(history: ChatHistoryItem[]) {
  return history.reduce((acc, item) => {
    if (!acc[item.session_id]) {
      acc[item.session_id] = {
        sessionId: item.session_id,
        workspaceName: item.workspaces?.ws_name || "Unknown Workspace",
        items: [],
      };
    }
    acc[item.session_id].items.push(item);
    return acc;
  }, {} as Record<string, { sessionId: string; workspaceName: string; items: ChatHistoryItem[] }>);
}

const ChatHistoryDialog = ({ isOpen, onClose, userId }: ChatHistoryDialogProps) => {
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      fetchChatHistory();
    }
  }, [isOpen, userId]);

  const fetchChatHistory = async () => {
    setLoading(true);
    try {
      const response = await authApi.getUserChatHistory(userId);
      setHistory(response.data || []);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      toast.error("Failed to load chat history");
    } finally {
      setLoading(false);
    }
  };

  const sessionsGrouped = groupBySession(history);
  const sessions = Object.values(sessionsGrouped);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Chat History</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-pulse">Loading chat history...</div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No chat history found for this user
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {sessions.map((session, index) => (
              <AccordionItem key={session.sessionId} value={`session-${index}`}>
                <AccordionTrigger>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{session.workspaceName}</span>
                    <span className="text-xs text-muted-foreground">
                      {session.items.length} messages • Session ID: {session.sessionId.substring(0, 8)}...
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {session.items.map((item) => (
                      <div key={item.prompt_id} className="border rounded-md p-4">
                        <div className="font-medium mb-2">
                          Prompt #{item.prompt_id}: {item.prompt_text}
                        </div>
                        <div className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded border">
                          {item.response_text}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Model: {item.model_name} • Temperature: {item.temperature} • Tokens: {item.token_usage}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ChatHistoryDialog;

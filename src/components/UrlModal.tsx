
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { toast } from "sonner";
import { llmApi } from "@/services/llmApi";

interface UrlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UrlModal = ({ isOpen, onClose }: UrlModalProps) => {
  const { selectedWorkspace } = useWorkspace();
  const [url, setUrl] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);

  const handleScrapeUrl = async () => {
    if (!url.trim() || !selectedWorkspace?.session_id) {
      toast.error("Please enter a valid URL");
      return;
    }

    try {
      setProcessing(true);

      const result = await llmApi.scrapeUrl(url, selectedWorkspace.session_id);

      if (result.success) {
        toast.success(result.message || "URL scraped successfully");
        onClose();
        // Force refresh the workspace to update the UI with scraped content info
        window.location.reload();
      } else {
        toast.error("Failed to scrape URL");
      }
    } catch (error) {
      console.error("Failed to scrape URL:", error);
      toast.error("Failed to scrape URL");
    } finally {
      setProcessing(false);
    }
  };

  // Reset URL when modal opens or closes
  React.useEffect(() => {
    if (!isOpen) {
      setUrl("");
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={() => !processing && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scrape Website</DialogTitle>
          <DialogDescription>
            Enter a URL to scrape and analyze with SalesAdvisor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center space-x-2">
            <Link className="h-4 w-4 text-[#A259FF]" />
            <Input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
              disabled={processing}
              autoFocus
            />
          </div>
          <div className="text-sm text-gray-500">
            Enter a complete URL including the http:// or https:// prefix
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-[#A259FF] hover:bg-[#A259FF]/90 text-white"
            onClick={handleScrapeUrl}
            disabled={!url.trim() || processing}
          >
            {processing ? (
              <>
                <span className="mr-2">Processing...</span>
                <div className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-white rounded-full" />
              </>
            ) : (
              <>Scrape Website</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UrlModal;

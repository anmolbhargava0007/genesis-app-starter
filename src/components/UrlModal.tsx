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

interface UrlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UrlModal = ({ isOpen, onClose }: UrlModalProps) => {
  const { selectedWorkspace, scrapeUrl, currentSessionDocuments } = useWorkspace();
  const [url, setUrl] = useState<string>("");
  const [processing, setProcessing] = useState<boolean>(false);

  const handleScrapeUrl = async () => {
    if (!url.trim() || !selectedWorkspace?.session_id) {
      toast.error("Please enter a valid URL");
      return;
    }

    // Check if this URL has already been scraped
    const normalizedUrl = url.toLowerCase().trim();
    const isDuplicate = currentSessionDocuments.some((doc) => {
      return (
        doc.toLowerCase() === normalizedUrl ||
        doc.toLowerCase() === normalizedUrl.replace(/^https?:\/\//, "")
      );
    });

    if (isDuplicate) {
      toast.warning("This URL has already been scraped");
      return;
    }

    try {
      setProcessing(true);

      const success = await scrapeUrl(url);

      if (success) {
        toast.success("URL scraped successfully");
        onClose();
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleScrapeUrl();
          }}
        >
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
              type="submit"
              className="bg-[#A259FF] hover:bg-[#A259FF]/90 text-white"
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
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UrlModal;


import { Link, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface SessionIndicatorProps {
  isUrlSession: boolean;
  isPdfSession: boolean;
  getScrapedWebsite: () => string;
  currentSessionDocuments: string[];
}

export default function SessionIndicator({
  isUrlSession,
  isPdfSession,
  getScrapedWebsite,
  currentSessionDocuments,
}: SessionIndicatorProps) {
  // Helper function to determine if a document is a URL
  const isUrl = (doc: string) => {
    return doc.startsWith('http://') || doc.startsWith('https://');
  };
  
  // Helper function to get website domain for display
  const getWebsiteDomain = (url: string): string => {
    try {
      if (!url) return url;
      if (!url.startsWith("http")) url = "https://" + url;
      const domain = new URL(url).hostname;
      return domain.startsWith("www.") ? domain : "www." + domain;
    } catch (e) {
      return url;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Session Documents & URLs</h2>
      
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {currentSessionDocuments.length === 0 ? (
          <div className="text-gray-400 italic">No documents or URLs in current session</div>
        ) : (
          currentSessionDocuments.map((doc, i) => (
            <div
              key={i}
              className="flex items-center bg-gray-800 px-3 py-2 rounded-md"
            >
              {isUrl(doc) ? (
                <>
                  <Link className="h-4 w-4 text-[#A259FF] mr-2 flex-shrink-0" />
                  <span className="text-[#A259FF] truncate text-sm" title={doc}>
                    {getWebsiteDomain(doc)}
                  </span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 text-[#A259FF] mr-2 flex-shrink-0" />
                  <span className="text-[#A259FF] truncate text-sm" title={doc}>
                    {doc}
                  </span>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

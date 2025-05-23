import { Link, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export default function SessionIndicator({
  isUrlSession,
  isPdfSession,
  getScrapedWebsite,
  currentSessionDocuments,
  
}) {
  const isWebsite = isUrlSession;

  return (
    <div className="flex items-center mb-1">

      <Dialog>
        <DialogTrigger asChild>
          <div className="mt-2 space-y-1 text-sm text-gray-300 max-h-40 overflow-y-auto">
            {isWebsite ? (
              <div className="text-[#A259FF]">{getScrapedWebsite()}</div>
            ) : (
              currentSessionDocuments?.map((doc, i) => (
                <div
                  key={i}
                  className="bg-gray-700 px-2 py-1 rounded text-[#A259FF] text-xs"
                >
                  {doc}
                </div>
              ))
            )}
          </div>
        </DialogTrigger>
      </Dialog>
    </div>
  );
}

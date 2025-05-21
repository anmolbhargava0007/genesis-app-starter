
import React, { useState } from "react";
import { Document } from "@/types/api";
import { FileText, CheckCircle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface DocumentListProps {
  documents: Document[];
  onDelete?: (docId: number) => Promise<void>;
}

const DocumentList = ({ documents = [], onDelete }: DocumentListProps) => {
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);

  const handleDelete = async () => {
    if (onDelete && selectedDocId !== null) {
      try {
        await onDelete(selectedDocId);
        setSelectedDocId(null); // Close dialog
      } catch (error) {
        console.error("Failed to delete document:", error);
      }
    }
  };

  if (documents.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-1">
        {documents.map((doc) => (
          <div
            key={doc.ws_doc_id}
            className="flex items-center bg-[#F8F9FA] border border-[#E9ECEF] rounded p-2 hover:bg-[#F1F3F5]"
          >
            <CheckCircle className="h-4 w-4 text-[#1ABC9C] mr-2 flex-shrink-0" />
            <div className="flex items-center flex-grow overflow-hidden">
              <FileText className="h-4 w-4 text-[#0A66C2] mr-2 flex-shrink-0" />
              <span
                className="text-[#2C2C2E] truncate text-sm"
                title={doc.ws_doc_name}
              >
                {doc.ws_doc_name}
              </span>
            </div>
            {onDelete && doc.ws_doc_id && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    onClick={() => setSelectedDocId(doc.ws_doc_id!)}
                    className="ml-2 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                    title="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this document? This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setSelectedDocId(null)}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default DocumentList;

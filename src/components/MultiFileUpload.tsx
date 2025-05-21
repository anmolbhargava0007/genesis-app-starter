import React, { useRef } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MultiFileUploadProps {
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  disabled?: boolean;
  onUploadSubmit?: () => void;
  selectedFiles: File[];
}

const MultiFileUpload = ({
  onFilesSelected,
  onRemoveFile,
  disabled = false,
  onUploadSubmit,
  selectedFiles,
}: MultiFileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }
    const newFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.includes("pdf")) {
        continue;
      }
      newFiles.push(file);
    }
    if (newFiles.length > 0) {
      onFilesSelected(newFiles);
    }
    // Clear the input to allow the same file to be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      {selectedFiles.length > 0 && (
        <div className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4 border p-3 rounded-md bg-gray-50">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center bg-white border border-gray-200 rounded-md p-2"
              >
                <FileText className="h-4 w-4 text-[#0A66C2] mr-2 flex-shrink-0" />
                <span
                  className="text-sm text-[#2C2C2E] truncate flex-grow"
                  title={file.name}
                >
                  {file.name}
                </span>
                <button
                  onClick={() => onRemoveFile(index)}
                  className="ml-1 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 flex-shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mb-3">
            {selectedFiles.length} document
            {selectedFiles.length !== 1 ? "s" : ""} selected. Click "Submit{" "}
            {selectedFiles.length} Document
            {selectedFiles.length !== 1 ? "s" : ""}" to complete the upload.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={handleUploadClick}
          disabled={disabled}
          className="bg-[#A259FF] hover:bg-[#A259FF]/90 text-white"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload PDFs
        </Button>
        {selectedFiles.length > 0 && onUploadSubmit && (
          <Button
            onClick={onUploadSubmit}
            className="bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white"
            disabled={disabled}
          >
            <FileText className="h-4 w-4 mr-2" />
            Submit {selectedFiles.length} Document
            {selectedFiles.length !== 1 ? "s" : ""}
          </Button>
        )}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="application/pdf"
          onChange={handleFileChange}
          multiple
        />
      </div>
    </div>
  );
};

export default MultiFileUpload;

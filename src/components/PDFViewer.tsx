
import React, { useState, useEffect } from 'react';

interface PDFViewerProps {
  file: File | null;
}

const PDFViewer = ({ file }: PDFViewerProps) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Clean up previous URL object to avoid memory leaks
    if (url) {
      URL.revokeObjectURL(url);
    }
    
    if (file) {
      setLoading(true);
      const fileUrl = URL.createObjectURL(file);
      setUrl(fileUrl);
      
      // Clean up when component unmounts
      return () => {
        URL.revokeObjectURL(fileUrl);
      };
    }
  }, [file]);

  useEffect(() => {
    if (url) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [url]);
  
  if (!file || !url) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
        <p className="text-gray-500">No PDF selected</p>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full border border-gray-200 rounded-md overflow-hidden relative">
      {loading && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-sm text-gray-600">Loading PDF...</p>
          </div>
        </div>
      )}
      <object
        data={url}
        type="application/pdf"
        className="w-full h-full min-h-[400px]"
      >
        <div className="p-4 text-center">
          <p>Your browser does not support PDFs. <a href={url} download={file.name} className="text-blue-500 hover:underline">Download the PDF</a> instead.</p>
        </div>
      </object>
    </div>
  );
};

export default PDFViewer;

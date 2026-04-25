import React, { useRef, useState } from 'react';
import { Upload, FileUp, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface FileUploaderProps {
  onFilesAdded: (files: File[]) => void;
  isProcessing: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFilesAdded, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesAdded(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={cn(
        "relative rounded-xl border border-dashed p-6 flex flex-col items-center justify-center gap-3 text-center group transition-all duration-200",
        isDragging ? "border-editorial-text bg-editorial-hover scale-[0.98]" : "border-[#D4CFC2] bg-editorial-hover",
        isProcessing && "opacity-50 pointer-events-none"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".docx,.pdf,.txt"
        onChange={(e) => e.target.files && onFilesAdded(Array.from(e.target.files))}
        className="hidden"
      />

      <div className="space-y-1">
        <p className="text-[11px] text-editorial-accent leading-relaxed">
          {isProcessing ? "Analyzing documents..." : "Drop .docx, .pdf, or .txt files here to merge into your manuscript."}
        </p>
      </div>

      <button
        onClick={() => inputRef.current?.click()}
        disabled={isProcessing}
        className="text-[10px] font-bold text-editorial-text uppercase tracking-tighter cursor-pointer hover:underline disabled:opacity-50"
      >
        {isProcessing ? (
          <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={12} /> Processing</span>
        ) : "+ Import Document"}
      </button>
    </div>
  );
};

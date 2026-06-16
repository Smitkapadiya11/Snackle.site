"use client";

import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onFileSelect: (file: File) => void;
  accept?: string;
  disabled?: boolean;
}

export default function FileDropzone({
  onFileSelect,
  accept = ".csv,.xlsx,.xls",
  disabled = false,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      onFileSelect(file);
    },
    [onFileSelect],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, handleFile],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-colors",
        isDragging ? "border-white bg-white/10" : "border-gray-600 bg-[#252525]",
        disabled && "opacity-50",
      )}
    >
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {fileName ? (
        <>
          <FileSpreadsheet className="mb-4 h-12 w-12 text-green-400" />
          <p className="text-lg font-semibold text-white">{fileName}</p>
          <p className="mt-1 text-sm text-gray-400">Click or drop to replace</p>
        </>
      ) : (
        <>
          <Upload className="mb-4 h-12 w-12 text-gray-400" />
          <p className="text-lg font-semibold text-white">Drop your CSV or Excel file here</p>
          <p className="mt-2 text-sm text-gray-400">or click to browse</p>
          <p className="mt-4 rounded-lg bg-black/30 px-4 py-2 font-mono text-xs text-gray-500">
            date | product_name | sku | units_sold | price | stock_on_hand
          </p>
        </>
      )}
    </div>
  );
}

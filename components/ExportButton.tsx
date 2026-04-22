/**
 * Export Button Component
 * 
 * Reusable button component for exporting data in various formats
 * Interoperability Architecture: Standardized Data Export (ADD ID 64)
 */

"use client";

import { Download, DownloadCloud } from "lucide-react";
import { useState } from "react";

interface ExportButtonProps {
  /** Button label text */
  label?: string;
  /** Format to export as */
  format?: "csv" | "json";
  /** Callback function to handle export */
  onExport: (format: "csv" | "json") => Promise<void> | void;
  /** Optional CSS class */
  className?: string;
  /** Is button disabled */
  disabled?: boolean;
  /** Show loading state */
  isLoading?: boolean;
  /** Button size */
  size?: "sm" | "md" | "lg";
  /** Show dropdown for format selection */
  showFormatMenu?: boolean;
}

export default function ExportButton({
  label = "Export Report",
  format = "csv",
  onExport,
  className = "",
  disabled = false,
  isLoading = false,
  size = "md",
  showFormatMenu = false,
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const sizeClasses = {
    sm: "px-3 py-1 text-sm",
    md: "px-6 py-2 text-base",
    lg: "px-8 py-3 text-lg",
  };

  const handleExport = async (selectedFormat: "csv" | "json") => {
    setIsExporting(true);
    try {
      await onExport(selectedFormat);
      if (showFormatMenu) {
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (showFormatMenu) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || isExporting}
          className={`flex items-center gap-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${className}`}
        >
          {isExporting ? (
            <DownloadCloud className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {label}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
            <button
              onClick={() => handleExport("csv")}
              disabled={isExporting}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50 first:rounded-t-lg border-b border-gray-200"
            >
              <div className="font-medium text-gray-900">Export as CSV</div>
              <div className="text-xs text-gray-600">Spreadsheet format</div>
            </button>
            <button
              onClick={() => handleExport("json")}
              disabled={isExporting}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50 last:rounded-b-lg"
            >
              <div className="font-medium text-gray-900">Export as JSON</div>
              <div className="text-xs text-gray-600">Data portability</div>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => handleExport(format)}
      disabled={disabled || isExporting}
      className={`flex items-center gap-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${className}`}
    >
      {isExporting ? (
        <DownloadCloud className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {label}
    </button>
  );
}

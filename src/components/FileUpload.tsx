import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { FaceCheckRecord } from '../utils/types';

interface FileUploadProps {
  onFileUploaded: (records: FaceCheckRecord[]) => void;
  onParseFile: (file: File) => Promise<FaceCheckRecord[]>;
}

export function FileUpload({ onFileUploaded, onParseFile }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [recordCount, setRecordCount] = useState<number>(0);
  const [dateRange, setDateRange] = useState<string>('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFile = async (file: File) => {
    setError('');
    
    // Validate file type
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setError('Invalid file type. Please upload .xlsx, .xls, or .csv files only.');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setUploadedFile(file);
    setIsLoading(true);

    try {
      const records = await onParseFile(file);
      setRecordCount(records.length);
      
      // Calculate date range
      if (records.length > 0) {
        const dates = records.map(r => r.timestamp).sort((a, b) => a.getTime() - b.getTime());
        const firstDate = dates[0].toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
        const lastDate = dates[dates.length - 1].toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
        setDateRange(`${firstDate} - ${lastDate}`);
      }
      
      onFileUploaded(records);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setUploadedFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setUploadedFile(null);
    setError('');
    setRecordCount(0);
    setDateRange('');
    onFileUploaded([]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card
      title="Upload FaceCheck Export File"
      description="Upload attendance data from FaceCheck application"
      action={
        uploadedFile && (
          <Button onClick={handleClear} variant="ghost" size="sm">
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )
      }
    >
      {!uploadedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
            }
          `}
        >
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isLoading}
          />
          
          <div className="flex flex-col items-center justify-center space-y-4">
            <Upload className={`w-12 h-12 ${isDragging ? 'text-primary-500' : 'text-slate-400'}`} />
            <div>
              <p className="text-lg font-medium text-slate-700">
                {isDragging ? 'Drop file here' : 'Drag & drop file here'}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                or click to browse
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Accepts: .xlsx, .xls, .csv</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <FileSpreadsheet className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 truncate">{uploadedFile.name}</p>
              <p className="text-sm text-slate-600 mt-1">
                {formatFileSize(uploadedFile.size)}
              </p>
            </div>
          </div>

          {recordCount > 0 && (
            <div className="p-4 bg-secondary-50 border border-secondary-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-secondary-500 rounded-full"></div>
                <p className="text-sm font-medium text-slate-900">
                  {recordCount} record{recordCount !== 1 ? 's' : ''} found
                </p>
              </div>
              {dateRange && (
                <p className="text-sm text-slate-600 ml-4">
                  Date range: {dateRange}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="mt-4 flex items-center justify-center gap-2 text-slate-600">
          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Processing file...</span>
        </div>
      )}
    </Card>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileIcon, ImageIcon, FileTextIcon, Trash2, Upload } from "lucide-react";
import { formatFileSize, getFileTypeFromUrl } from "../utils/fileUpload";

interface FileUploadProps {
  file: File | null;
  fileUrl: string | null;
  onFileChange: (file: File | null) => void;
  onFileUrlChange: (url: string | null) => void;
  label?: string;
  accept?: string;
  maxSize?: number; // in MB
}

export function FileUpload({
  file,
  fileUrl,
  onFileChange,
  onFileUrlChange,
  label = "File",
  accept = "*/*",
  maxSize = 10
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size
      if (selectedFile.size > maxSize * 1024 * 1024) {
        alert(`File size must be less than ${maxSize}MB`);
        return;
      }
      
      onFileChange(selectedFile);
      // Clear the existing URL when a new file is selected
      if (fileUrl) {
        onFileUrlChange(null);
      }
    }
  };

  const handleRemoveFile = () => {
    onFileChange(null);
    onFileUrlChange(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      // Check file size
      if (droppedFile.size > maxSize * 1024 * 1024) {
        alert(`File size must be less than ${maxSize}MB`);
        return;
      }
      
      onFileChange(droppedFile);
      // Clear the existing URL when a new file is selected
      if (fileUrl) {
        onFileUrlChange(null);
      }
    }
  };

  const getFileIcon = (type: 'image' | 'pdf' | 'document') => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-8 w-8 text-muted-foreground" />;
      case 'pdf':
        return <FileTextIcon className="h-8 w-8 text-red-500" />;
      default:
        return <FileIcon className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const renderFilePreview = () => {
    if (file) {
      const isImage = file.type.startsWith('image/');
      
      return (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20">
          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center overflow-hidden border">
            {isImage ? (
              <img 
                src={URL.createObjectURL(file)} 
                alt={file.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              getFileIcon(file.type === 'application/pdf' ? 'pdf' : 'document')
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
            onClick={handleRemoveFile}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    if (fileUrl) {
      const fileType = getFileTypeFromUrl(fileUrl);
      const fileName = fileUrl.split('/').pop() || 'Unknown file';
      
      return (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20">
          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center overflow-hidden border">
            {fileType === 'image' ? (
              <img 
                src={fileUrl} 
                alt={fileName} 
                className="w-full h-full object-cover"
              />
            ) : (
              getFileIcon(fileType)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              View file
            </a>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
            onClick={handleRemoveFile}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {(file || fileUrl) ? (
        renderFilePreview()
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop a file here, or click to select
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Maximum file size: {maxSize}MB
          </p>
          <Input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            Select File
          </Button>
        </div>
      )}
    </div>
  );
} 
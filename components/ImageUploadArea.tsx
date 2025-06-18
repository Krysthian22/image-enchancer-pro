
import React, { useCallback, useState } from 'react';

interface ImageUploadAreaProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

const ImageUploadArea: React.FC<ImageUploadAreaProps> = ({ onFilesSelected, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFilesSelected(Array.from(event.target.files));
      event.target.value = ''; // Reset file input
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(event.dataTransfer.files));
      event.dataTransfer.clearData();
    }
  }, [onFilesSelected]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  return (
    <div className="mb-8 p-6 bg-gray-800 rounded-lg shadow-xl">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-md transition-colors duration-200
                    ${isDragging ? 'border-purple-500 bg-gray-700' : 'border-gray-600 hover:border-purple-400'}`}
      >
        <input
          type="file"
          id="fileUpload"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="opacity-0 absolute w-px h-px overflow-hidden -z-10" // Changed from "hidden"
          disabled={isProcessing}
          aria-hidden="true" // Good practice for screen readers as it's visually hidden
        />
        <label
          htmlFor="fileUpload"
          className={`cursor-pointer flex flex-col items-center text-center ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <i className="fas fa-cloud-upload-alt text-5xl text-purple-400 mb-4"></i>
          <p className="text-xl font-semibold text-gray-200">Drag & drop images here</p>
          <p className="text-gray-400">or click to browse</p>
          <span className="mt-2 text-sm text-gray-500">(Max 5MB per image, PNG, JPG, WEBP)</span>
        </label>
      </div>
    </div>
  );
};

export default ImageUploadArea;

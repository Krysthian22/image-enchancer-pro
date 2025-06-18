
export interface TextSettings {
  isActive: boolean;
  xOffset: number; // Pixels from center
  yOffset: number; // Pixels from center (e.g., positive moves down)
  color: string; // Effective color used, can be auto-detected or manually set
  fontSize: number; // e.g., 24
  fontFamily: string;
  manualColorOverride?: '#000000' | '#FFFFFF' | null; // User's manual choice for color
}

export interface ProcessedImageFile {
  id: string;
  // file: File; // Removed: File content will be read upfront
  name: string;
  originalDataUrl: string; // Will store Base64 DataURL from FileReader
  clientProcessedDataUrl?: string; // After desaturation and 3:4 crop
  clientSmoothingEnabled: boolean; // User's choice for client-side blur

  overlayText: string;
  textSettings: TextSettings;
  processedWithTextDataUrl?: string; // After text overlay is applied

  status: 'pending-initial-read' | 'pending-configuration' | 'client-processing' | 'text-rendering' | 'client-complete' | 'error';
  errorMessage?: string;
}
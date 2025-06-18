
import React, { useState, useCallback, useEffect, useRef } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ImageUploadArea from './components/ImageUploadArea';
import Controls from './components/Controls';
import ImageDisplayCard from './components/ImageDisplayCard';
import { ProcessedImageFile, TextSettings } from './types';
import { processImageClientSide, renderTextOnImage } from './services/imageProcessor';
import BatchActionsFooter from './components/BatchActionsFooter';
import { DEFAULT_FONT_SIZE, DEFAULT_FONT_FAMILY, DEFAULT_TEXT_COLOR, IMAGE_TARGET_HEIGHT, IMAGE_TARGET_WIDTH } from './constants';

const App: React.FC = () => {
  const [processedFiles, setProcessedFiles] = useState<ProcessedImageFile[]>([]);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isProcessingAnyClientSide, setIsProcessingAnyClientSide] = useState<boolean>(false);
  const [isBatchProcessingActive, setIsBatchProcessingActive] = useState<boolean>(false);
  
  const debounceTimers = useRef<{ [key: string]: number }>({});
  const processedFilesRef = useRef(processedFiles);

  useEffect(() => {
    processedFilesRef.current = processedFiles;
  }, [processedFiles]);

  useEffect(() => {
    const currentlyProcessing = processedFiles.some(f => f.status === 'client-processing' || f.status === 'text-rendering');
    setIsProcessingAnyClientSide(currentlyProcessing);
  }, [processedFiles]);

  const updateFileProperties = useCallback((id: string, updates: Partial<ProcessedImageFile>) => {
    setProcessedFiles(prevFiles => {
      const fileIndex = prevFiles.findIndex(f => f.id === id);
      if (fileIndex === -1) return prevFiles;

      const updatedFile = { ...prevFiles[fileIndex], ...updates };
      
      if (updates.textSettings) {
        updatedFile.textSettings = { ...prevFiles[fileIndex].textSettings, ...updates.textSettings };
      }
      
      const newFiles = [...prevFiles];
      newFiles[fileIndex] = updatedFile;
      return newFiles;
    });
  }, []);

  const triggerTextRender = useCallback(async (imageFileToRender: ProcessedImageFile) => {
    if (!imageFileToRender.clientProcessedDataUrl || !imageFileToRender.textSettings.isActive) {
       if (!imageFileToRender.textSettings.isActive) { 
           updateFileProperties(imageFileToRender.id, { processedWithTextDataUrl: undefined, status: 'client-complete' });
       }
      return;
    }
    updateFileProperties(imageFileToRender.id, { status: 'text-rendering' });
    try {
      const { dataUrl: textDataUrl, chosenColor } = await renderTextOnImage(
        imageFileToRender.clientProcessedDataUrl,
        imageFileToRender.overlayText,
        imageFileToRender.textSettings,
        IMAGE_TARGET_WIDTH,
        IMAGE_TARGET_HEIGHT
      );
      updateFileProperties(imageFileToRender.id, {
        processedWithTextDataUrl: textDataUrl,
        textSettings: { ...imageFileToRender.textSettings, color: chosenColor },
        status: 'client-complete'
      });
    } catch (error) {
      console.error("Text rendering error for ID:", imageFileToRender.id, error);
      const errorMessage = error instanceof Error ? error.message : "Text rendering failed";
      updateFileProperties(imageFileToRender.id, { status: 'error', errorMessage: `Text: ${errorMessage}` });
    }
  }, [updateFileProperties]);

  const scheduleTextRender = useCallback((imageId: string) => {
    if (debounceTimers.current[imageId]) {
        clearTimeout(debounceTimers.current[imageId]);
    }
    debounceTimers.current[imageId] = window.setTimeout(() => {
        const imageFile = processedFilesRef.current.find(f => f.id === imageId);
        if (imageFile && imageFile.status === 'client-complete' && imageFile.textSettings.isActive && imageFile.clientProcessedDataUrl) {
            triggerTextRender(imageFile);
        }
    }, 300); 
  }, [triggerTextRender]);


  const handleFilesSelected = (files: File[]) => {
    setGeneralError(null);
    const newEntries: ProcessedImageFile[] = [];
    
    files.forEach(file => {
      const id = `${file.name}-${Date.now()}`;
      const defaultTextSettings: TextSettings = {
        isActive: false, xOffset: 0, yOffset: 0, 
        color: DEFAULT_TEXT_COLOR, 
        fontSize: DEFAULT_FONT_SIZE, 
        fontFamily: DEFAULT_FONT_FAMILY,
        manualColorOverride: null,
      };

      if (file.size > 5 * 1024 * 1024) { 
         const errorFileEntry: ProcessedImageFile = {
            id: `${id}-size-error`, name: file.name, originalDataUrl: '', 
            status: 'error', errorMessage: 'File size exceeds 5MB limit.',
            clientSmoothingEnabled: false, overlayText: '', textSettings: defaultTextSettings,
         };
         newEntries.push(errorFileEntry);
        return; 
      }
      
      const initialFileEntry: ProcessedImageFile = {
        id, name: file.name, originalDataUrl: '', // Placeholder
        status: 'pending-initial-read', clientSmoothingEnabled: false,
        overlayText: '', textSettings: defaultTextSettings,
      };
      newEntries.push(initialFileEntry);

      const reader = new FileReader();
      reader.onload = (e_reader) => {
        const fileDataUrl = e_reader.target?.result as string;
        if (!fileDataUrl) {
          updateFileProperties(id, {
            status: 'error',
            errorMessage: 'Failed to read file content initially.',
          });
          return;
        }
        updateFileProperties(id, {
          originalDataUrl: fileDataUrl,
          status: 'pending-configuration',
        });
      };
      reader.onerror = () => {
        updateFileProperties(id, {
          status: 'error',
          errorMessage: 'Error initially reading file.',
        });
      };
      reader.readAsDataURL(file);
    });
    setProcessedFiles(prev => [...newEntries, ...prev]);
  };

  const handleSetImageSmoothing = useCallback((id: string, enabled: boolean) => {
    updateFileProperties(id, { clientSmoothingEnabled: enabled });
  }, [updateFileProperties]);

  const handleSetOverlayText = useCallback((id: string, text: string) => {
    updateFileProperties(id, { overlayText: text });
    const imageFile = processedFilesRef.current.find(f => f.id === id);
    if (imageFile && imageFile.status === 'client-complete' && imageFile.textSettings.isActive && imageFile.clientProcessedDataUrl) {
        scheduleTextRender(id);
    }
  }, [updateFileProperties, scheduleTextRender]);

  const handleSetTextSetting = useCallback((id: string, key: keyof TextSettings, value: any) => {
    const currentFile = processedFilesRef.current.find(f => f.id === id);
    if (!currentFile) return;

    const newTextSettings = { ...currentFile.textSettings, [key]: value };
    updateFileProperties(id, { textSettings: newTextSettings });
      
    if (currentFile.status === 'client-complete' && newTextSettings.isActive && currentFile.clientProcessedDataUrl) {
      scheduleTextRender(id);
    }
  }, [updateFileProperties, scheduleTextRender]);
  
  const handleToggleTextOverlayActive = useCallback((id: string, isActive: boolean) => {
    const currentFile = processedFilesRef.current.find(f => f.id === id);
    if (!currentFile) return;

    let updates: Partial<ProcessedImageFile> = { 
        textSettings: { ...currentFile.textSettings, isActive } 
    };

    if (currentFile.status === 'client-complete') {
      if (!isActive) {
        updates = { ...updates, processedWithTextDataUrl: undefined };
      } else if (currentFile.clientProcessedDataUrl) {
        scheduleTextRender(id);
      }
    }
    updateFileProperties(id, updates);

  }, [updateFileProperties, scheduleTextRender]);


  const handleStartSingleImageProcessing = useCallback(async (id: string) => {
    const imageFile = processedFilesRef.current.find(f => f.id === id);
    if (!imageFile || imageFile.status !== 'pending-configuration' || !imageFile.originalDataUrl ) return;
    if (isProcessingAnyClientSide && !isBatchProcessingActive) return;

    updateFileProperties(id, { status: 'client-processing' });
    try {
      // originalDataUrl is now the Base64 DataURL of the original file
      const { processedDataUrl } = await processImageClientSide(
        imageFile.originalDataUrl,
        imageFile.clientSmoothingEnabled
      );
      
      updateFileProperties(id, {
        clientProcessedDataUrl: processedDataUrl,
        status: 'client-complete'
      });

      const potentiallyUpdatedFile = processedFilesRef.current.find(f => f.id === id);
      if (potentiallyUpdatedFile && potentiallyUpdatedFile.textSettings.isActive && potentiallyUpdatedFile.overlayText && potentiallyUpdatedFile.clientProcessedDataUrl) {
         scheduleTextRender(id);
      }

    } catch (error) {
      console.error("Client-side processing error for ID:", id, error);
      const errorMessage = error instanceof Error ? error.message : "Client processing failed";
      updateFileProperties(id, { status: 'error', errorMessage });
    }
  }, [updateFileProperties, isProcessingAnyClientSide, isBatchProcessingActive, scheduleTextRender]);


  const processNextPendingImage = useCallback(() => {
    if (!isBatchProcessingActive) return;
    const nextImageToProcess = processedFilesRef.current.find(f => f.status === 'pending-configuration');
    if (nextImageToProcess) {
      if(!isProcessingAnyClientSide && nextImageToProcess.originalDataUrl){ // Ensure data URL is loaded
         handleStartSingleImageProcessing(nextImageToProcess.id);
      }
    } else {
      const stillProcessing = processedFilesRef.current.some(f => f.status === 'client-processing' || f.status === 'text-rendering');
      if (!stillProcessing) {
           setIsBatchProcessingActive(false); 
      }
    }
  }, [isBatchProcessingActive, handleStartSingleImageProcessing, isProcessingAnyClientSide]);

  useEffect(() => {
    if (isBatchProcessingActive && !isProcessingAnyClientSide) {
      processNextPendingImage();
    }
  }, [isBatchProcessingActive, isProcessingAnyClientSide, processedFiles, processNextPendingImage]);

  const handleProcessAllClick = useCallback(() => {
    const hasPending = processedFilesRef.current.some(f => f.status === 'pending-configuration' && f.originalDataUrl);
    if (hasPending && !isProcessingAnyClientSide && !isBatchProcessingActive) {
      setIsBatchProcessingActive(true);
    }
  }, [isProcessingAnyClientSide, isBatchProcessingActive]);
  
  const handleRemoveImage = useCallback((id: string) => {
    setProcessedFiles(prevFiles => {
      const fileToRemoveIndex = prevFiles.findIndex(f => f.id === id);
      if (fileToRemoveIndex === -1) return prevFiles;
      
      // No need to revoke originalDataUrl as it's not a blob URL anymore
      if (debounceTimers.current[id]) { 
        clearTimeout(debounceTimers.current[id]);
        delete debounceTimers.current[id];
      }
      const updatedFiles = prevFiles.filter(f => f.id !== id);
      
      if (isBatchProcessingActive) {
          const stillPending = updatedFiles.some(f => f.status === 'pending-configuration');
          const stillProcessingFromBatch = updatedFiles.some(f => f.status === 'client-processing' || f.status === 'text-rendering');
          if (!stillPending && !stillProcessingFromBatch) {
              setIsBatchProcessingActive(false);
          }
      }
      return updatedFiles;
    });
  }, [isBatchProcessingActive]); 
  
  useEffect(() => {
    // No specific cleanup needed for originalDataUrl here as they are Base64 strings.
    // Debounce timers cleanup is important.
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []); 

  const handleDownloadAllProcessed = useCallback(() => {
    let downloadCount = 0;
    processedFilesRef.current.forEach((file) => { 
      if (file.status === 'client-complete') {
        const urlToDownload = (file.textSettings.isActive && file.processedWithTextDataUrl) 
                              ? file.processedWithTextDataUrl 
                              : file.clientProcessedDataUrl;
        if (urlToDownload) {
          setTimeout(() => {
            const link = document.createElement('a');
            link.href = urlToDownload;
            const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
            const suffix = (file.textSettings.isActive && file.processedWithTextDataUrl) ? '_text_overlay' : '_processed';
            link.download = `${baseName}${suffix}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }, downloadCount * 500); 
          downloadCount++;
        }
      }
    });
  }, []);

  const canProcessAll = processedFiles.some(f => f.status === 'pending-configuration' && f.originalDataUrl) && !isProcessingAnyClientSide && !isBatchProcessingActive;
  const canDownloadAll = processedFiles.some(f => f.status === 'client-complete');


  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100">
      <Header />
      <main className="container mx-auto p-4 sm:p-6 flex-grow w-full">
        {generalError && (
          <div className="mb-4 p-4 bg-red-800 border border-red-600 text-red-100 rounded-md shadow-lg" role="alert">
            <h3 className="font-bold text-lg"><i className="fas fa-exclamation-triangle mr-2"></i>Error!</h3>
            <p>{generalError}</p>
          </div>
        )}
        <ImageUploadArea
            onFilesSelected={handleFilesSelected}
            isProcessing={isProcessingAnyClientSide || isBatchProcessingActive || processedFiles.some(f => f.status === 'pending-initial-read')}
        />
        
        <Controls isProcessingAnyClientSide={isProcessingAnyClientSide || isBatchProcessingActive || processedFiles.some(f => f.status === 'pending-initial-read')} />
        
        {processedFiles.length === 0 && !generalError && (
            <div className="text-center py-12">
                <i className="fas fa-images text-6xl text-gray-600 mb-4"></i>
                <p className="text-2xl text-gray-500">Upload some images to get started!</p>
                <p className="text-gray-600">Add text, configure, and process your images.</p>
            </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:gap-8">
          {processedFiles.map(pf => (
            <ImageDisplayCard
              key={pf.id}
              imageFile={pf}
              onRemoveImage={handleRemoveImage}
              onSetSmoothing={handleSetImageSmoothing}
              onStartProcessing={handleStartSingleImageProcessing}
              onSetOverlayText={handleSetOverlayText}
              onSetTextSetting={handleSetTextSetting}
              onToggleTextOverlayActive={handleToggleTextOverlayActive}
              isAnyProcessing={isProcessingAnyClientSide}
              isBatchActive={isBatchProcessingActive}
            />
          ))}
        </div>
        
        {processedFiles.length > 0 && (
            <BatchActionsFooter 
                onProcessAll={handleProcessAllClick}
                canProcessAll={canProcessAll}
                isBatchProcessing={isBatchProcessingActive}
                isAnyProcessing={isProcessingAnyClientSide}
                hasPendingFiles={processedFiles.some(f => f.status === 'pending-configuration' && !!f.originalDataUrl)}
                onDownloadAll={handleDownloadAllProcessed}
                canDownloadAll={canDownloadAll}
            />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
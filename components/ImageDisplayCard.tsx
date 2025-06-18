
import React from 'react';
import { ProcessedImageFile, TextSettings } from '../types';
import Spinner from './Spinner';
import { 
    TEXT_OFFSET_X_RANGE_MAX, TEXT_OFFSET_X_RANGE_MIN, 
    TEXT_OFFSET_Y_RANGE_MAX, TEXT_OFFSET_Y_RANGE_MIN, 
    DEFAULT_TEXT_COLOR, MIN_FONT_SIZE, MAX_FONT_SIZE, DEFAULT_FONT_SIZE
} from '../constants';

interface ImageDisplayCardProps {
  imageFile: ProcessedImageFile;
  onRemoveImage: (id: string) => void;
  onSetSmoothing: (id: string, enabled: boolean) => void; 
  onStartProcessing: (id: string) => void;
  onSetOverlayText: (id: string, text: string) => void;
  onSetTextSetting: (id: string, key: keyof TextSettings, value: any) => void;
  onToggleTextOverlayActive: (id: string, isActive: boolean) => void;
  isAnyProcessing: boolean; 
  isBatchActive: boolean;
}

const ImageDisplayCardComponent: React.FC<ImageDisplayCardProps> = ({ 
  imageFile, 
  onRemoveImage,
  onSetSmoothing,
  onStartProcessing,
  onSetOverlayText,
  onSetTextSetting,
  onToggleTextOverlayActive,
  isAnyProcessing,
  isBatchActive 
}) => {
  const { 
    id, name, originalDataUrl, clientProcessedDataUrl, status, errorMessage,
    clientSmoothingEnabled, overlayText, textSettings, processedWithTextDataUrl
  } = imageFile;

  const getStatusColor = () => {
    if (status === 'error') return 'border-red-500';
    if (status === 'client-complete') return 'border-green-500';
    if (status === 'client-processing' || status === 'text-rendering') return 'border-blue-500';
    if (status === 'pending-configuration' || status === 'pending-initial-read') return 'border-yellow-500';
    return 'border-gray-600';
  };
  
  const getStatusText = () => {
    switch(status) {
        case 'pending-initial-read': return 'Preparing file...';
        case 'pending-configuration': 
            if (isBatchActive) return 'Waiting for batch...';
            return 'Ready to process. Configure options.';
        case 'client-processing': return 'Processing Image (Grayscale, Crop, Smooth)...';
        case 'text-rendering': return 'Applying Text Overlay...';
        case 'client-complete': return 'Processing Complete!';
        case 'error': return `Error: ${errorMessage || 'Unknown error'}`;
        default: return 'Unknown status';
    }
  }

  const handleDownload = (dataUrl: string | undefined, filenameSuffix: string) => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    const baseName = name.substring(0, name.lastIndexOf('.')) || name;
    link.download = `${baseName}_${filenameSuffix}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const finalProcessedUrl = (textSettings.isActive && processedWithTextDataUrl) ? processedWithTextDataUrl : clientProcessedDataUrl;

  const canProcessIndividually = status === 'pending-configuration' && !!originalDataUrl && !isAnyProcessing && !isBatchActive;
  
  const generalControlsDisabled = isAnyProcessing || isBatchActive || (status !== 'pending-configuration' && status !== 'client-complete');
  const processingStageControlsDisabled = generalControlsDisabled;

  // Refactored textControlsDisabled to avoid TypeScript warning and improve clarity
  const textControlsDisabled = !textSettings.isActive ||
    status === 'pending-initial-read' ||
    status === 'client-processing' ||
    status === 'text-rendering' ||
    status === 'error' ||
    (status === 'pending-configuration' && (isAnyProcessing || isBatchActive));


  return (
    <div className={`bg-gray-800 rounded-xl shadow-2xl overflow-hidden border-2 ${getStatusColor()} transition-all duration-300`}>
      <div className="p-4 bg-gray-700">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-100 truncate" title={name}>{name}</h3>
            <button
                onClick={() => onRemoveImage(id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Remove image"
                disabled={status === 'client-processing' || status === 'text-rendering' || status === 'pending-initial-read' || (isBatchActive && status !== 'error')}
                aria-label={`Remove image ${name}`}
            >
                <i className="fas fa-times-circle text-xl"></i>
            </button>
        </div>
        <p className={`text-sm mt-1 ${status === 'error' ? 'text-red-400' : (status === 'pending-configuration' || status === 'pending-initial-read' ? (isBatchActive ? 'text-blue-300' : 'text-yellow-300') : 'text-gray-400')}`}>{getStatusText()}</p>
      </div>

      {(status === 'pending-configuration' || status === 'client-complete') && (
        <div className="p-4 border-t border-gray-700 bg-gray-750 space-y-4">
          {status === 'pending-configuration' && (
            <div className="flex items-center space-x-3">
              <label htmlFor={`smoothing-${id}`} className="flex items-center cursor-pointer">
                <input type="checkbox" id={`smoothing-${id}`} className="sr-only" checked={clientSmoothingEnabled}
                  onChange={(e) => onSetSmoothing(id, e.target.checked)} disabled={processingStageControlsDisabled} aria-describedby={`smoothing-label-${id}`} />
                <div className={`relative block w-10 h-5 rounded-full transition-colors ${processingStageControlsDisabled ? 'bg-gray-500' : (clientSmoothingEnabled ? 'bg-teal-600' : 'bg-gray-600')}`}>
                  <div className={`dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${clientSmoothingEnabled ? 'translate-x-5' : ''}`}></div>
                </div>
                <span id={`smoothing-label-${id}`} className={`ml-3 text-sm font-medium ${processingStageControlsDisabled ? 'text-gray-500' : 'text-gray-200'}`}>Basic Smoothing</span>
              </label>
            </div>
          )}

          <div>
            <label htmlFor={`text-active-${id}`} className="flex items-center cursor-pointer mb-2">
              <input type="checkbox" id={`text-active-${id}`} className="sr-only" checked={textSettings.isActive}
                onChange={(e) => onToggleTextOverlayActive(id, e.target.checked)} disabled={((processingStageControlsDisabled && status !== 'client-complete'))} aria-describedby={`text-active-label-${id}`} />
              <div className={`relative block w-10 h-5 rounded-full transition-colors ${ ((processingStageControlsDisabled && status !== 'client-complete')) ? 'bg-gray-500' : (textSettings.isActive ? 'bg-purple-600' : 'bg-gray-600')}`}>
                 <div className={`dot absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${textSettings.isActive ? 'translate-x-5' : ''}`}></div>
              </div>
              <span id={`text-active-label-${id}`} className={`ml-3 text-sm font-medium ${((processingStageControlsDisabled && status !== 'client-complete')) ? 'text-gray-500' : 'text-gray-200'}`}>Enable Text Overlay</span>
            </label>

            {textSettings.isActive && (
              <div className="space-y-4 pl-2 border-l-2 border-gray-600 ml-2 pt-2">
                <textarea id={`text-input-${id}`} value={overlayText}
                  onChange={(e) => onSetOverlayText(id, e.target.value)}
                  placeholder="Enter text here (Shift+Enter for new line)"
                  disabled={textControlsDisabled}
                  rows={3}
                  className="w-full p-2 bg-gray-600 border border-gray-500 rounded-md text-sm text-gray-100 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-400 disabled:opacity-70 resize-y" 
                />
                
                <div className="grid grid-cols-2 gap-x-3 gap-y-4 items-center">
                  <div>
                    <label htmlFor={`text-fontsize-${id}`} className="block text-xs font-medium text-gray-400 mb-0.5">Font Size (px)</label>
                    <input 
                      type="number" 
                      id={`text-fontsize-${id}`} 
                      value={textSettings.fontSize}
                      min={MIN_FONT_SIZE}
                      max={MAX_FONT_SIZE}
                      onChange={(e) => {
                          let val = parseInt(e.target.value);
                          if (isNaN(val)) val = DEFAULT_FONT_SIZE;
                          val = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, val));
                          onSetTextSetting(id, 'fontSize', val);
                      }}
                      disabled={textControlsDisabled}
                      className="w-full p-2 bg-gray-600 border border-gray-500 rounded-md text-sm text-gray-100 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-70"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const currentEffectiveColor = textSettings.color || DEFAULT_TEXT_COLOR;
                      const nextManualColor = currentEffectiveColor === '#FFFFFF' ? '#000000' : '#FFFFFF';
                      onSetTextSetting(id, 'manualColorOverride', nextManualColor);
                    }}
                    disabled={textControlsDisabled}
                    className={`self-end px-3 py-2 text-xs font-medium rounded-md transition-colors h-10
                                ${textControlsDisabled 
                                  ? 'bg-gray-500 text-gray-400 cursor-not-allowed' 
                                  : 'bg-gray-500 hover:bg-gray-400 text-white'}`}
                    title={ (textSettings.color || DEFAULT_TEXT_COLOR) === '#FFFFFF' ? "Switch text to Black" : "Switch text to White"}
                    aria-label="Toggle text color"
                  >
                    <i className="fas fa-adjust mr-1"></i>
                    {(textSettings.color || DEFAULT_TEXT_COLOR) === '#FFFFFF' ? "Set Black" : "Set White"}
                  </button>
                </div>

                <> 
                  <div>
                    <label htmlFor={`text-x-slider-${id}`} className="block text-xs font-medium text-gray-400 mb-0.5">
                      Horizontal Offset (px): {textSettings.xOffset}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        id={`text-x-slider-${id}`}
                        value={textSettings.xOffset}
                        min={TEXT_OFFSET_X_RANGE_MIN}
                        max={TEXT_OFFSET_X_RANGE_MAX}
                        step="1"
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            onSetTextSetting(id, 'xOffset', isNaN(val) ? 0 : val);
                        }}
                        disabled={textControlsDisabled}
                        className="w-full h-2 bg-gray-500 rounded-lg appearance-none cursor-pointer accent-purple-600 disabled:opacity-70 flex-grow"
                      />
                      <input
                        type="number"
                        id={`text-x-input-${id}`}
                        value={textSettings.xOffset}
                        min={TEXT_OFFSET_X_RANGE_MIN}
                        max={TEXT_OFFSET_X_RANGE_MAX}
                        step="1"
                        onChange={(e) => {
                            let val = parseInt(e.target.value);
                            if (isNaN(val)) val = 0; 
                            val = Math.max(TEXT_OFFSET_X_RANGE_MIN, Math.min(TEXT_OFFSET_X_RANGE_MAX, val));
                            onSetTextSetting(id, 'xOffset', val);
                        }}
                        disabled={textControlsDisabled}
                        className="w-20 p-1.5 bg-gray-600 border border-gray-500 rounded-md text-sm text-gray-100 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-70 text-center"
                        aria-label="Horizontal offset value"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor={`text-y-slider-${id}`} className="block text-xs font-medium text-gray-400 mb-0.5">
                      Vertical Offset (px): {textSettings.yOffset}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        id={`text-y-slider-${id}`}
                        value={textSettings.yOffset}
                        min={TEXT_OFFSET_Y_RANGE_MIN}
                        max={TEXT_OFFSET_Y_RANGE_MAX}
                        step="1"
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            onSetTextSetting(id, 'yOffset', isNaN(val) ? 0 : val);
                        }}
                        disabled={textControlsDisabled}
                        className="w-full h-2 bg-gray-500 rounded-lg appearance-none cursor-pointer accent-purple-600 disabled:opacity-70 flex-grow"
                      />
                      <input
                        type="number"
                        id={`text-y-input-${id}`}
                        value={textSettings.yOffset}
                        min={TEXT_OFFSET_Y_RANGE_MIN}
                        max={TEXT_OFFSET_Y_RANGE_MAX}
                        step="1"
                        onChange={(e) => {
                            let val = parseInt(e.target.value);
                            if (isNaN(val)) val = 0;
                            val = Math.max(TEXT_OFFSET_Y_RANGE_MIN, Math.min(TEXT_OFFSET_Y_RANGE_MAX, val));
                            onSetTextSetting(id, 'yOffset', val);
                        }}
                        disabled={textControlsDisabled}
                        className="w-20 p-1.5 bg-gray-600 border border-gray-500 rounded-md text-sm text-gray-100 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-70 text-center"
                        aria-label="Vertical offset value"
                      />
                    </div>
                  </div>
                </>
              </div>
            )}
          </div>
          
          {status === 'pending-configuration' && (
            <button onClick={() => onStartProcessing(id)} disabled={!canProcessIndividually}
              className={`w-full px-4 py-2 text-sm font-semibold rounded-md transition-colors
                          ${canProcessIndividually ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}>
              {isAnyProcessing && !isBatchActive ? 'Another image processing...' : (isBatchActive ? 'Batch active...' : 'Process Image')}
            </button>
          )}
        </div>
      )}

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div className="text-center">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Original</h4>
          {status === 'pending-initial-read' && <div className="h-80 flex items-center justify-center bg-gray-700 rounded-md text-gray-500">Reading file...</div>}
          {status !== 'pending-initial-read' && originalDataUrl && (
             <img src={originalDataUrl} alt={`Original preview of ${name}`} className="w-full h-auto object-contain rounded-md shadow-md max-h-80 mx-auto bg-gray-700" />
          )}
          {status !== 'pending-initial-read' && !originalDataUrl && status !== 'error' && (
             <div className="h-80 flex items-center justify-center bg-gray-700 rounded-md text-gray-500">Preview not available.</div>
          )}
           {status === 'error' && !originalDataUrl && ( // Specific case for pre-read errors like size limit
             <div className="h-80 flex items-center justify-center bg-gray-700 rounded-md text-red-400 p-2" role="alert">{errorMessage || 'Preview not available due to error'}</div>
           )}
        </div>

        <div className="text-center">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Processed Output</h4>
          {(status === 'client-processing' || status === 'text-rendering') && <div className="h-80 flex items-center justify-center bg-gray-700 rounded-md" role="status" aria-live="polite"><Spinner /></div>}
          {(status === 'pending-configuration' || status === 'pending-initial-read') && <div className="h-80 flex items-center justify-center bg-gray-700 rounded-md text-gray-500">Awaiting processing...</div>}
          
          {(status === 'client-complete' && finalProcessedUrl) && (
            <>
              <img src={finalProcessedUrl} alt={`Processed output of ${name}`} className="w-full h-auto object-contain rounded-md shadow-md max-h-80 mx-auto bg-gray-700" 
                   style={{ backgroundColor: textSettings.isActive ? textSettings.color === '#FFFFFF' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' : 'transparent' }}/>
              <button
                onClick={() => handleDownload(finalProcessedUrl, 'final_output')}
                className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md shadow transition-colors"
                title="Download final image">
                <i className="fas fa-download mr-1" aria-hidden="true"></i> Download
              </button>
            </>
          )}
          {status === 'error' && <div className="h-80 flex items-center justify-center bg-gray-700 rounded-md text-red-400 p-2" role="alert">{errorMessage || 'Processing failed'}</div>}
          {status === 'client-complete' && !finalProcessedUrl && <div className="h-80 flex items-center justify-center bg-gray-700 rounded-md text-gray-500">Output not yet available.</div>}
        </div>
      </div>
    </div>
  );
};

const ImageDisplayCard = React.memo(ImageDisplayCardComponent);

export default ImageDisplayCard;

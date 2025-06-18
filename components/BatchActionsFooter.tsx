
import React from 'react';

interface BatchActionsFooterProps {
  onProcessAll: () => void;
  canProcessAll: boolean;
  isBatchProcessing: boolean;
  isAnyProcessing: boolean; // Added to know if any single image processing is active
  hasPendingFiles: boolean;
  onDownloadAll: () => void;
  canDownloadAll: boolean;
}

const BatchActionsFooter: React.FC<BatchActionsFooterProps> = ({
  onProcessAll,
  canProcessAll,
  isBatchProcessing,
  isAnyProcessing, // Use this prop
  hasPendingFiles,
  onDownloadAll,
  canDownloadAll
}) => {
  if (!hasPendingFiles && !isBatchProcessing && !canDownloadAll) {
    return null;
  }

  let processButtonText = 'Process All Pending Images';
  let processButtonDisabled = !canProcessAll;

  if (isBatchProcessing) {
    processButtonText = 'Batch Processing in Progress...';
    processButtonDisabled = true; 
  }

  const downloadAllDisabled = isBatchProcessing || isAnyProcessing;

  return (
    <div className="mt-8 py-6 border-t border-gray-700 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
      { (hasPendingFiles || isBatchProcessing) && (
        <button
          onClick={onProcessAll}
          disabled={processButtonDisabled}
          className={`px-6 py-3 text-base font-semibold rounded-lg transition-all duration-150 ease-in-out
                      flex items-center justify-center space-x-2
                      ${processButtonDisabled
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                      }`}
        >
          {isBatchProcessing && (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          <span>{processButtonText}</span>
        </button>
      )}

      {canDownloadAll && (
         <button
          onClick={onDownloadAll}
          disabled={downloadAllDisabled}
          className={`px-6 py-3 text-base font-semibold rounded-lg transition-all duration-150 ease-in-out
                      flex items-center justify-center space-x-2
                      ${downloadAllDisabled
                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                      }`}
          title={ downloadAllDisabled ? "Wait for processing to finish before downloading all" : "Download all completed images"}
        >
          <i className="fas fa-archive mr-2"></i>
          <span>Download All Completed</span>
        </button>
      )}
    </div>
  );
};

export default BatchActionsFooter;

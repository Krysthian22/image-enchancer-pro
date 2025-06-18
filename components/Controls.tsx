import React from 'react';

interface ControlsProps {
  isProcessingAnyClientSide: boolean; // This prop now indicates if any client processing OR batch is active
}

const Controls: React.FC<ControlsProps> = ({
  isProcessingAnyClientSide
}) => {
  // If nothing is processing (neither single image nor batch), don't render.
  if (!isProcessingAnyClientSide) {
    return null; 
  }

  return (
    <div className="mb-6 p-4 bg-gray-800 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
      <div></div> {/* Placeholder for alignment */}

      {isProcessingAnyClientSide && (
        <div className="flex items-center text-purple-400">
            <i className="fas fa-spinner fa-spin mr-2"></i> Processing images...
        </div>
      )}
    </div>
  );
};

export default Controls;
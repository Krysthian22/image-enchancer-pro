
export const APP_TITLE = "Image Enhancer Pro";
export const IMAGE_TARGET_WIDTH = 600; // For 3:4 aspect ratio
export const IMAGE_TARGET_HEIGHT = 800; // For 3:4 aspect ratio

export const DEFAULT_FONT_SIZE = 24; // In pixels for canvas
export const MIN_FONT_SIZE = 8;
export const MAX_FONT_SIZE = 120;
export const DEFAULT_FONT_FAMILY = 'Arial, sans-serif';

// New precise offset ranges based on image dimensions
export const TEXT_OFFSET_X_RANGE_MIN = -(IMAGE_TARGET_WIDTH / 2); // -300
export const TEXT_OFFSET_X_RANGE_MAX = IMAGE_TARGET_WIDTH / 2;  // +300
export const TEXT_OFFSET_Y_RANGE_MIN = -(IMAGE_TARGET_HEIGHT / 2); // -400
export const TEXT_OFFSET_Y_RANGE_MAX = IMAGE_TARGET_HEIGHT / 2;  // +400

export const DEFAULT_TEXT_COLOR = '#FFFFFF'; // Fallback text color
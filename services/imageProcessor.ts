
import { IMAGE_TARGET_WIDTH, IMAGE_TARGET_HEIGHT, DEFAULT_FONT_FAMILY, DEFAULT_TEXT_COLOR } from '../constants';
import { TextSettings } from '../types';

export const processImageClientSide = (
  originalFileContentDataUrl: string, // Changed from file: File
  applyClientSmoothing: boolean
): Promise<{ processedDataUrl: string, width: number, height: number }> => { // originalDataUrl removed from return
  return new Promise((resolve, reject) => {
    // FileReader logic is removed as originalFileContentDataUrl is already a DataURL.

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Failed to get canvas context."));
        return;
      }

      const targetWidth = IMAGE_TARGET_WIDTH;
      const targetHeight = IMAGE_TARGET_HEIGHT;
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const imgAspectRatio = img.naturalWidth / img.naturalHeight;
      const canvasAspectRatio = targetWidth / targetHeight;

      let sx = 0, sy = 0, sWidth = img.naturalWidth, sHeight = img.naturalHeight;

      if (imgAspectRatio > canvasAspectRatio) {
        sWidth = img.naturalHeight * canvasAspectRatio;
        sx = (img.naturalWidth - sWidth) / 2;
      } else if (imgAspectRatio < canvasAspectRatio) {
        sHeight = img.naturalWidth / canvasAspectRatio;
        sy = (img.naturalHeight - sHeight) / 2;
      }
      
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = luminance;
        data[i + 1] = luminance;
        data[i + 2] = luminance;
      }
      ctx.putImageData(imageData, 0, 0);

      if (applyClientSmoothing) {
        ctx.filter = 'blur(1px)';
        ctx.drawImage(canvas, 0, 0); 
        ctx.filter = 'none'; 
      }

      const processedDataUrl = canvas.toDataURL('image/png');
      resolve({ processedDataUrl, width: targetWidth, height: targetHeight });
    };
    img.onerror = () => {
      reject(new Error("Failed to load image from data.")); // Updated error message
    };
    img.src = originalFileContentDataUrl; // Use the passed-in DataURL
  });
};

const getAverageBrightness = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): number => {
  if (width <= 0 || height <= 0) return 128;
  const imageData = ctx.getImageData(Math.floor(x), Math.floor(y), Math.max(1, Math.ceil(width)), Math.max(1, Math.ceil(height)));
  const data = imageData.data;
  let sumBrightness = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    sumBrightness += data[i]; // Grayscale, R=G=B
    count++;
  }
  return count > 0 ? sumBrightness / count : 128;
};

export const renderTextOnImage = (
  baseImageSrc: string,
  text: string,
  settings: TextSettings,
  imageWidth: number,
  imageHeight: number
): Promise<{ dataUrl: string; chosenColor: string }> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error("Failed to get canvas context for text rendering."));
      return;
    }

    canvas.width = imageWidth;
    canvas.height = imageHeight;

    const baseImg = new Image();
    baseImg.onload = () => {
      ctx.drawImage(baseImg, 0, 0, imageWidth, imageHeight);

      if (text.trim() === '' || !settings.isActive) {
        resolve({ dataUrl: canvas.toDataURL('image/png'), chosenColor: settings.color || DEFAULT_TEXT_COLOR });
        return;
      }
      
      const lines = text.split('\n');
      const fontSize = settings.fontSize;
      const fontFamily = settings.fontFamily || DEFAULT_FONT_FAMILY;
      const lineSpacingFactor = 1.2; 
      const lineHeight = fontSize * lineSpacingFactor;
      
      ctx.font = `bold ${fontSize}px ${fontFamily}`; // Apply bold font weight
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let maxLineWidth = 0;
      lines.forEach(line => {
        maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
      });

      const totalTextHeight = (lines.length * fontSize) + ((lines.length - 1) * (fontSize * (lineSpacingFactor - 1)));
      
      const overallTextX = imageWidth / 2 + settings.xOffset;
      const blockCenterY = imageHeight / 2 + settings.yOffset;
      const startY = blockCenterY - totalTextHeight / 2 + fontSize / 2;

      const contrastSampleX = overallTextX - maxLineWidth / 2;
      const contrastSampleY = blockCenterY - totalTextHeight / 2;
      const contrastSampleWidth = maxLineWidth;
      const contrastSampleHeight = totalTextHeight;

      let chosenColor: string;
      if (settings.manualColorOverride) {
        chosenColor = settings.manualColorOverride;
      } else {
        const avgBrightness = getAverageBrightness(
          ctx, 
          contrastSampleX, 
          contrastSampleY, 
          contrastSampleWidth, 
          contrastSampleHeight
        );
        chosenColor = avgBrightness > 128 ? '#000000' : '#FFFFFF';
      }
      
      ctx.fillStyle = chosenColor;

      let currentY = startY;
      lines.forEach(line => {
        // The existing shadow for black text provides a subtle border/emphasis,
        // which should work well with the bold font.
        if (chosenColor === '#000000') {
          ctx.shadowColor = 'rgba(0,0,0,0.6)'; // Kept a less intense shadow
          ctx.shadowOffsetX = 0.3; // Small offset
          ctx.shadowOffsetY = 0.3; // Small offset
          ctx.shadowBlur = 0.5;    // Slight blur for softness
        }
        
        ctx.fillText(line, overallTextX, currentY);
        
        // Reset shadow for subsequent drawing operations or if not black text
        if (chosenColor === '#000000') {
          ctx.shadowColor = 'transparent';
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.shadowBlur = 0;
        }
        currentY += lineHeight;
      });
      
      resolve({ dataUrl: canvas.toDataURL('image/png'), chosenColor });
    };
    baseImg.onerror = () => {
      reject(new Error("Failed to load base image for text rendering."));
    };
    baseImg.src = baseImageSrc;
  });
};

/**
 * Image Cropper Component
 * Allows users to crop/resize images to fixed dimensions
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface ImageCropperProps {
  image: string;
  width: number;
  height: number;
  aspectRatio?: number;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
}

export function ImageCropper({
  image,
  width,
  height,
  aspectRatio,
  onCropComplete,
  onCancel,
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const drawImage = useCallback(() => {
    if (!canvasRef.current || !imgRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw image
    const img = imgRef.current;
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;

    ctx.drawImage(img, position.x, position.y, scaledWidth, scaledHeight);

    // Draw crop area outline
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.setLineDash([]);
  }, [position.x, position.y, scale]);

  useEffect(() => {
    drawImage();
  }, [drawImage]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = async () => {
    if (!canvasRef.current || !imgRef.current) return;

    try {
      // Create a canvas for the final cropped image
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = width;
      croppedCanvas.height = height;

      const ctx = croppedCanvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      // Draw the cropped portion
      const img = imgRef.current;
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      ctx.drawImage(img, position.x, position.y, scaledWidth, scaledHeight, 0, 0, width, height);

      // Convert to blob and pass back
      croppedCanvas.toBlob((blob) => {
        if (!blob) throw new Error('Failed to create blob');

        const reader = new FileReader();
        reader.onloadend = () => {
          onCropComplete(reader.result as string);
          toast.success('Image cropped successfully!');
        };
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error('Crop error:', error);
      toast.error('Failed to crop image');
    }
  };

  useEffect(() => {
    const img = imgRef.current;
    if (img) {
      img.onload = drawImage;
    }
  }, [drawImage]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <h3 className="text-2xl font-bold text-gray-900">
            Crop Image ({width}x{height}px)
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Drag to reposition • Use scroll to zoom
          </p>
        </div>

        {/* Image Container */}
        <div className="p-6">
          <div className="mb-6 bg-gray-100 rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={(e) => {
                e.preventDefault();
                const newScale = Math.max(0.5, Math.min(3, scale - e.deltaY * 0.001));
                setScale(newScale);
              }}
              className="w-full cursor-move border-4 border-amber-400"
            />
            <img
              ref={imgRef}
              src={image}
              crossOrigin="anonymous"
              alt="Crop preview"
              style={{ display: 'none' }}
              onLoad={drawImage}
            />
          </div>

          {/* Scale Slider */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zoom: {Math.round(scale * 100)}%
            </label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCrop}
              className="flex-1"
            >
              Crop & Upload
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

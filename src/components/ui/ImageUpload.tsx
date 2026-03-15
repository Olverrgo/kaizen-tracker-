import { useRef, useState } from 'react';
import { ImagePlus, X, ZoomIn } from 'lucide-react';
import type { ImageAttachment } from '../../types';
import { generateId } from '../../lib/utils';

interface ImageUploadProps {
  images: ImageAttachment[];
  onChange: (images: ImageAttachment[]) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onChange, maxImages = 5 }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: ImageAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      if (images.length + newImages.length >= maxImages) break;

      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      // Convert to base64
      const base64 = await fileToBase64(file);

      newImages.push({
        id: generateId(),
        data: base64,
        name: file.name,
        type: file.type,
        addedAt: new Date(),
      });
    }

    onChange([...images, ...newImages]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleRemove = (id: string) => {
    onChange(images.filter((img) => img.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative aspect-square rounded-lg overflow-hidden group"
            >
              <img
                src={image.data}
                alt={image.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewImage(image.data)}
                  className="p-1.5 bg-white rounded-full hover:bg-gray-100"
                >
                  <ZoomIn className="h-4 w-4 text-gray-700" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(image.id)}
                  className="p-1.5 bg-white rounded-full hover:bg-gray-100"
                >
                  <X className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {images.length < maxImages && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-400 hover:bg-primary-50/50 transition-colors flex flex-col items-center gap-2"
        >
          <ImagePlus className="h-8 w-8 text-gray-400" />
          <span className="text-sm text-gray-500">
            Agregar imagen ({images.length}/{maxImages})
          </span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

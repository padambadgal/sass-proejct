import { useEffect, useRef, useState } from 'react';
import apiClient from '../../api/client';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const ImageUpload = ({
  value,
  onChange,       // (url: string) => void   — updates the local form state
  onUploaded,     // (updatedUser) => void    — updates AuthContext
  onFileChange,
  label = 'Upload Image',
  aspect = 'square',
  className = '',
  uploadUrl = '/profile',
  uploadField = 'avatar',
  responseImageField = 'avatar',
  removeUrl = '/profile',
  removeField = 'deleteAvatar',
  removeMessage = 'Image removed',
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loadedImageUrl, setLoadedImageUrl] = useState('');
  const [failedImageUrl, setFailedImageUrl] = useState('');
  const inputRef = useRef(null);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    if (!uploadUrl && onFileChange) {
      setPreviewUrl(URL.createObjectURL(file));
      onFileChange(file);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    if (!uploadUrl) {
      toast.error('Save the record before uploading an image');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append(uploadField, file);

      const res = await apiClient.patch(uploadUrl, formData, {
        headers: { 'Content-Type': undefined },
      });

      const data = res.data?.data;
      const updatedUser = data?.user;
      const newUrl = data?.url
        || data?.[responseImageField]
        || updatedUser?.[responseImageField]
        || data?.business?.[responseImageField]
        || data?.service?.[responseImageField]
        || '';

      onChange?.(newUrl);
      onUploaded?.(updatedUser);
    } catch (err) {
      console.error('Upload error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    try {
      const res = removeUrl
        ? await apiClient.patch(removeUrl, { [removeField]: true })
        : null;
      const updatedUser = res?.data?.data?.user;
      setPreviewUrl('');
      onFileChange?.(null);
      onChange?.('');
      onUploaded?.(updatedUser);
      toast.success(removeMessage);
    } catch (err) {
      console.error('Image removal error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Failed to remove image');
    }
  };

  const aspectClass = aspect === 'square' ? 'md:aspect-square' : 'md:aspect-video';
  const mobileShapeClass = 'w-24 h-24 mx-auto rounded-full md:w-full md:h-auto md:mx-0 md:rounded-xl';
  const imageValue = previewUrl || value;
  const imageLoaded = imageValue && loadedImageUrl === imageValue;
  const imageLoadError = imageValue && failedImageUrl === imageValue;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {imageValue ? (
        <div className={`relative ${mobileShapeClass} overflow-hidden border border-gray-200 ${aspectClass} aspect-square bg-gray-50 group`}>
          {!imageLoaded && !imageLoadError && (
            <div
              className="absolute inset-0 z-10 animate-pulse bg-gray-200"
              aria-label="Loading image"
              role="status"
            >
              <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
            </div>
          )}
          {imageLoadError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
              <ImageIcon size={28} />
              <span className="text-xs">Image could not be loaded</span>
            </div>
          )}
          <img
            src={imageValue}
            alt="Uploaded"
            onLoad={() => setLoadedImageUrl(imageValue)}
            onError={() => setFailedImageUrl(imageValue)}
            className={`w-full h-full object-cover transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-2 bg-white rounded-full text-gray-800 hover:bg-gray-100"
              title="Replace"
            >
              <Upload size={16} />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600"
              title="Remove"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`${mobileShapeClass} border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/50 transition flex flex-col items-center justify-center gap-2 p-3 md:p-6 text-gray-500 ${aspectClass} aspect-square disabled:opacity-50`}
        >
          {uploading ? (
            <>
              <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
              <span className="text-sm">Uploading...</span>
            </>
          ) : (
            <>
              <div className="p-3 bg-indigo-100 rounded-full">
                <ImageIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <span className="text-sm font-medium">Click to upload</span>
              <span className="text-xs text-gray-400">JPG, PNG, WEBP up to 5MB</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;
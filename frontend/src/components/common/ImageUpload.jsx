import { useRef, useState } from 'react';
import apiClient from '../../api/client';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const ImageUpload = ({
  value,
  onChange,       // (url: string) => void   — updates the local form state
  onUploaded,     // (updatedUser) => void    — updates AuthContext
  label = 'Upload Image',
  aspect = 'square',
  className = '',
}) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

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

  setUploading(true);
  try {
    const formData = new FormData();
    formData.append('avatar', file);   // MUST match upload.single('avatar')

    // ✅ Force axios to let the browser set multipart Content-Type with boundary
    const res = await apiClient.patch('/profile', formData, {
      headers: { 'Content-Type': undefined },
    });

    const updatedUser = res.data?.data?.user;
    const newUrl = res.data?.data?.url || updatedUser?.avatar || '';

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
      const res = await apiClient.patch('/profile', { deleteAvatar: true });
      const updatedUser = res.data?.data?.user;
      onChange?.('');
      onUploaded?.(updatedUser);
      toast.success('Avatar removed');
    } catch (err) {
      // If the backend has no delete branch, just clear locally
      onChange?.('');
    }
  };

  const aspectClass = aspect === 'square' ? 'aspect-square' : 'aspect-video';

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {value ? (
        <div className={`relative rounded-xl overflow-hidden border border-gray-200 ${aspectClass} bg-gray-50 group`}>
          <img src={value} alt="Uploaded" className="w-full h-full object-cover" />
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
          className={`w-full rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/50 transition flex flex-col items-center justify-center gap-2 p-6 text-gray-500 ${aspectClass} disabled:opacity-50`}
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
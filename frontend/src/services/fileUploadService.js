/**
 * fileUploadService.js
 * Universal attachment processing, preview generation, and delivery service.
 */

import apiClient from '../api/apiClient';
import {
  validateFile,
  sanitizeFileName,
  formatFileSize,
  getFileMetadata,
} from '../constants/attachments';

/**
 * Generate lightweight image thumbnail via Canvas
 */
export const createThumbnail = (file, maxWidth = 400, maxHeight = 400) => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(null);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    img.src = objectUrl;
  });
};

/**
 * Read file as Base64 Data URL
 */
export const readFileAsDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Prepare a newly selected file for staging and upload
 */
export const prepareAttachment = async (file) => {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const meta = validation.meta || getFileMetadata(file.type, file.name);
  const cleanName = sanitizeFileName(file.name);
  const isImage = meta.category === 'IMAGE';

  let previewUrl = null;
  let thumbnail = null;
  let dataUrl = null;

  if (isImage) {
    thumbnail = await createThumbnail(file);
    try {
      dataUrl = await readFileAsDataUrl(file);
      previewUrl = dataUrl;
    } catch {
      previewUrl = URL.createObjectURL(file);
      dataUrl = thumbnail;
    }
  } else if (file.size < 8 * 1024 * 1024) {
    try {
      dataUrl = await readFileAsDataUrl(file);
      previewUrl = dataUrl;
    } catch {
      previewUrl = null;
    }
  }

  return {
    id: 'att_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    file,
    name: cleanName,
    originalName: file.name,
    size: file.size,
    formattedSize: formatFileSize(file.size),
    type: file.type || 'application/octet-stream',
    category: meta.category,
    color: meta.color,
    label: meta.label,
    isImage,
    previewUrl: previewUrl || dataUrl,
    thumbnail,
    dataUrl,
    remoteUrl: null,
    uploadProgress: 0,
    status: 'queued', // 'queued' | 'uploading' | 'success' | 'error'
    error: null,
    abortController: null,
  };
};

/**
 * Upload an attachment
 * Performs real multipart/form-data upload when backend endpoint exists,
 * with simulated progress & graceful fallback when backend upload API is not provisioned.
 */
export const uploadAttachment = async (
  attachment,
  conversationId,
  onProgress = () => {},
  abortSignal = null
) => {
  // Ensure dataUrl is present
  let dataUrl = attachment.dataUrl;
  if (!dataUrl && attachment.file && attachment.size < 10 * 1024 * 1024) {
    try {
      dataUrl = await readFileAsDataUrl(attachment.file);
      attachment.dataUrl = dataUrl;
    } catch {
      // ignore
    }
  }

  let remoteUrl = null;

  // 1. Try real backend multipart upload if file is present
  if (attachment.file) {
    const formData = new FormData();
    formData.append('file', attachment.file, attachment.name);
    if (conversationId) formData.append('conversationId', conversationId);

    try {
      const res = await apiClient.post('/api/attachments/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal: abortSignal,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        },
      });

      if (res?.data?.url) {
        remoteUrl = res.data.url;
      }
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.name === 'AbortError') {
        throw err;
      }
      console.warn('Backend upload unavailable, using embedded transfer payload:', err?.message);
    }
  }

  // 2. Smooth simulated transfer progress for responsive UX
  const steps = [25, 60, 90, 100];
  for (const step of steps) {
    if (abortSignal?.aborted) {
      throw new Error('Upload canceled by user');
    }
    onProgress(step);
    await new Promise((r) => setTimeout(r, 40));
  }

  // NEVER use a blob: URL for remoteUrl! If no backend url returned, use persistent dataUrl
  const finalRemoteUrl = remoteUrl || dataUrl;

  if (!finalRemoteUrl) {
    throw new Error('Upload failed: Neither server storage URL nor client data URL could be generated.');
  }

  return {
    ...attachment,
    dataUrl,
    remoteUrl: finalRemoteUrl,
    status: 'success',
    uploadProgress: 100,
  };
};

/**
 * Revoke object URLs to avoid memory leaks
 */
export const cleanupAttachment = (attachment) => {
  if (attachment?.previewUrl && attachment.previewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(attachment.previewUrl);
  }
};

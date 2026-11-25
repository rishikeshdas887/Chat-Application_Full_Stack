/**
 * attachments.js
 * Central configuration and helper utilities for SyncPulse message attachments.
 */

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB max size
export const MAX_ATTACHMENTS_PER_MESSAGE = 5;

// Allowed MIME types mapped to human-readable categories
export const ALLOWED_MIME_TYPES = {
  // Images
  'image/jpeg': { category: 'IMAGE', ext: '.jpg', label: 'JPEG Image', color: '#818cf8' },
  'image/png': { category: 'IMAGE', ext: '.png', label: 'PNG Image', color: '#818cf8' },
  'image/webp': { category: 'IMAGE', ext: '.webp', label: 'WebP Image', color: '#818cf8' },
  'image/gif': { category: 'IMAGE', ext: '.gif', label: 'GIF Animation', color: '#818cf8' },

  // PDF
  'application/pdf': { category: 'PDF', ext: '.pdf', label: 'PDF Document', color: '#ef4444' },

  // Microsoft Office / OpenDocument
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    category: 'DOCX',
    ext: '.docx',
    label: 'Word Document',
    color: '#3b82f6',
  },
  'application/msword': { category: 'DOCX', ext: '.doc', label: 'Word Document', color: '#3b82f6' },

  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    category: 'XLSX',
    ext: '.xlsx',
    label: 'Excel Spreadsheet',
    color: '#10b981',
  },
  'application/vnd.ms-excel': { category: 'XLSX', ext: '.xls', label: 'Excel Spreadsheet', color: '#10b981' },

  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    category: 'PPTX',
    ext: '.pptx',
    label: 'PowerPoint Presentation',
    color: '#f97316',
  },
  'application/vnd.ms-powerpoint': {
    category: 'PPTX',
    ext: '.ppt',
    label: 'PowerPoint Presentation',
    color: '#f97316',
  },

  // Plain Text & Code
  'text/plain': { category: 'TXT', ext: '.txt', label: 'Plain Text', color: '#64748b' },
  'text/markdown': { category: 'TXT', ext: '.md', label: 'Markdown', color: '#64748b' },
  'text/csv': { category: 'TXT', ext: '.csv', label: 'CSV Spreadsheet', color: '#10b981' },

  // Archives
  'application/zip': { category: 'ZIP', ext: '.zip', label: 'ZIP Archive', color: '#f59e0b' },
  'application/x-zip-compressed': { category: 'ZIP', ext: '.zip', label: 'ZIP Archive', color: '#f59e0b' },
  'application/x-zip': { category: 'ZIP', ext: '.zip', label: 'ZIP Archive', color: '#f59e0b' },
};

export const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.webp', '.gif',
  '.pdf',
  '.docx', '.doc',
  '.xlsx', '.xls',
  '.pptx', '.ppt',
  '.txt', '.md', '.csv',
  '.zip',
];

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/zip',
  'application/x-zip-compressed',
];

/**
 * Format raw byte size into human readable string
 */
export const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const idx = Math.min(i, units.length - 1);
  const size = bytes / Math.pow(1024, idx);
  return `${size >= 10 || idx === 0 ? Math.round(size) : size.toFixed(1)} ${units[idx]}`;
};

/**
 * Get category and visual configuration from MIME type or file extension
 */
export const getFileMetadata = (mimeType = '', filename = '') => {
  const cleanMime = (mimeType || '').toLowerCase().trim();
  if (ALLOWED_MIME_TYPES[cleanMime]) {
    return ALLOWED_MIME_TYPES[cleanMime];
  }

  // Fallback check by extension
  const cleanName = (filename || '').toLowerCase().trim();
  const ext = '.' + cleanName.split('.').pop();

  for (const info of Object.values(ALLOWED_MIME_TYPES)) {
    if (info.ext === ext) return info;
  }

  if (IMAGE_MIME_TYPES.some((m) => cleanMime.startsWith('image/'))) {
    return { category: 'IMAGE', ext, label: 'Image', color: '#818cf8' };
  }

  return { category: 'FILE', ext, label: 'Document', color: '#64748b' };
};

/**
 * Sanitize filename to prevent path traversal or injection attacks
 */
export const sanitizeFileName = (name) => {
  if (!name || typeof name !== 'string') return 'attachment';
  // Strip paths and control characters
  let clean = name.replace(/^.*[\\/]/, '').replace(/[^\w.-]/g, '_');
  if (clean.length > 80) {
    const ext = clean.includes('.') ? '.' + clean.split('.').pop() : '';
    clean = clean.slice(0, 80 - ext.length) + ext;
  }
  return clean || 'attachment';
};

/**
 * Comprehensive client-side validation
 */
export const validateFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds the 25 MB limit (${formatFileSize(file.size)}).`,
    };
  }

  const meta = getFileMetadata(file.type, file.name);
  const ext = '.' + (file.name || '').split('.').pop().toLowerCase();

  const isAllowedExt = ALLOWED_EXTENSIONS.includes(ext);
  const isAllowedMime = Boolean(ALLOWED_MIME_TYPES[file.type]) || file.type.startsWith('image/');

  if (!isAllowedExt && !isAllowedMime) {
    return {
      valid: false,
      error: `File type "${ext || file.type}" is not supported. Please select an image, PDF, Office document, TXT, or ZIP.`,
    };
  }

  return { valid: true, meta };
};

import React from 'react';
import { formatFileSize, getFileMetadata } from '../../constants/attachments';

const isSafeAttachmentUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim();
  if (clean.toLowerCase().startsWith('javascript:') || clean.toLowerCase().startsWith('data:text/html')) {
    return false;
  }
  try {
    const parsed = new URL(clean, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'blob:' || clean.startsWith('data:');
  } catch {
    return clean.startsWith('data:');
  }
};

const AttachmentCard = ({
  attachment,
  isOwn = false,
  onDownload,
  onCancel,
  onRetry,
}) => {
  if (!attachment) return null;

  const {
    name = 'document',
    size = 0,
    type = '',
    category,
    color,
    uploadProgress = 100,
    status = 'success',
    error,
    dataUrl,
    remoteUrl,
  } = attachment;

  const meta = getFileMetadata(type, name);
  const badgeColor = color || meta.color;
  const badgeCategory = category || meta.category;
  const downloadUrl = remoteUrl || dataUrl;
  const safeDownloadUrl = isSafeAttachmentUrl(downloadUrl) ? downloadUrl : null;

  const handleDownloadClick = (e) => {
    if (onDownload) {
      e.preventDefault();
      onDownload(attachment);
    }
  };

  // Icon symbol based on category
  const renderIcon = () => {
    switch (badgeCategory) {
      case 'PDF':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 15h6M9 11h4" />
          </svg>
        );
      case 'XLSX':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-6m3 6v-4m3 4v-2M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
          </svg>
        );
      case 'DOCX':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'PPTX':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
          </svg>
        );
      case 'ZIP':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        );
      default:
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  return (
    <div
      className="attachment-card-box"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '10px 14px',
        borderRadius: '12px',
        backgroundColor: isOwn ? 'rgba(0, 0, 0, 0.18)' : 'rgba(255, 255, 255, 0.06)',
        border: isOwn ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
        minWidth: 'min(240px, 100%)',
        maxWidth: '360px',
        width: '100%',
        boxSizing: 'border-box',
        transition: 'all 0.15s ease',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Category Icon Badge */}
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: `${badgeColor}22`,
            border: `1px solid ${badgeColor}44`,
            color: badgeColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {renderIcon()}
        </div>

        {/* File Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            title={name}
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: isOwn ? '#ffffff' : 'inherit',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: isOwn ? 'rgba(255, 255, 255, 0.75)' : '#94a3b8',
              marginTop: '2px',
            }}
          >
            <span
              style={{
                textTransform: 'uppercase',
                fontWeight: 700,
                color: badgeColor,
                fontSize: '10px',
                letterSpacing: '0.04em',
              }}
            >
              {badgeCategory}
            </span>
            <span>•</span>
            <span>{formatFileSize(size)}</span>
          </div>
        </div>

        {/* Action Button: Download, Cancel, or Retry */}
        {status === 'uploading' ? (
          <button
            type="button"
            onClick={onCancel}
            title="Cancel upload"
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        ) : status === 'error' ? (
          <button
            type="button"
            onClick={onRetry}
            title={error || 'Retry upload'}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Retry
          </button>
        ) : safeDownloadUrl ? (
          <a
            href={safeDownloadUrl}
            download={name}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleDownloadClick}
            title="Download file"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: isOwn ? 'rgba(255, 255, 255, 0.2)' : 'rgba(99, 102, 241, 0.15)',
              border: isOwn ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)',
              color: isOwn ? '#ffffff' : '#818cf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              textDecoration: 'none',
              flexShrink: 0,
              transition: 'transform 0.15s ease',
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
        ) : null}
      </div>

      {/* Progress Bar for Uploading State */}
      {status === 'uploading' && (
        <div style={{ marginTop: '2px' }}>
          <div
            style={{
              height: '4px',
              borderRadius: '2px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${uploadProgress}%`,
                backgroundColor: badgeColor,
                transition: 'width 0.2s ease',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: isOwn ? 'rgba(255, 255, 255, 0.7)' : '#94a3b8',
              marginTop: '3px',
            }}
          >
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
        </div>
      )}

      {/* Error state message */}
      {status === 'error' && error && (
        <div style={{ fontSize: '11px', color: '#f87171', marginTop: '2px' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default AttachmentCard;

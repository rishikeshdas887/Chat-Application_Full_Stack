import React, { useState } from 'react';

const ImageGallery = ({ images = [], onSelectImage }) => {
  const [failedIndices, setFailedIndices] = useState({});

  if (!images || images.length === 0) return null;

  const handleImageClick = (img, index) => {
    if (onSelectImage) {
      onSelectImage(img, index);
    }
  };

  const handleImageError = (index) => {
    setFailedIndices((prev) => ({ ...prev, [index]: true }));
  };

  const resolveSrc = (img, index) => {
    // 1. Direct valid data URL or base64 image data (instant & permanently offline-resilient)
    if (img.dataUrl && typeof img.dataUrl === 'string' && img.dataUrl.startsWith('data:image/')) {
      return img.dataUrl;
    }
    if (img.thumbnail && typeof img.thumbnail === 'string' && img.thumbnail.startsWith('data:image/')) {
      return img.thumbnail;
    }
    if (img.content && typeof img.content === 'string' && img.content.startsWith('data:image/')) {
      return img.content;
    }

    // 2. If no network failure has occurred yet, try remote or blob URL
    if (!failedIndices[index]) {
      if (img.url && typeof img.url === 'string' && !img.url.startsWith('blob:')) {
        return img.url;
      }
      return img.url || img.previewUrl || img.dataUrl || img.thumbnail || img.content;
    }

    // 3. Fallback when remote URL fails
    if (img.dataUrl && typeof img.dataUrl === 'string') {
      return img.dataUrl;
    }
    if (img.thumbnail && typeof img.thumbnail === 'string') {
      return img.thumbnail;
    }
    if (img.previewUrl && typeof img.previewUrl === 'string' && !img.previewUrl.startsWith('blob:')) {
      return img.previewUrl;
    }
    return null;
  };

  // Single Image Presentation
  if (images.length === 1) {
    const img = images[0];
    const src = resolveSrc(img, 0);
    const name = img.name || 'Image';

    if (!src) {
      return (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>🖼</span>
          <span>Failed to load image preview</span>
        </div>
      );
    }

    return (
      <div
        style={{
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          cursor: 'pointer',
          maxWidth: '340px',
          maxHeight: '360px',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
        }}
        onClick={() => handleImageClick(img, 0)}
      >
        <img
          src={src}
          alt={name}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '360px',
            display: 'block',
            objectFit: 'cover',
            transition: 'transform 0.2s ease',
          }}
          onError={() => handleImageError(0)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        />

        {/* Hover zoom pill overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            borderRadius: '6px',
            padding: '4px 8px',
            color: '#ffffff',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            pointerEvents: 'none',
          }}
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
          <span>Expand</span>
        </div>
      </div>
    );
  }

  // Multi-Image Grid Presentation (2x2 or mosaic)
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: images.length === 2 ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
        gap: '6px',
        maxWidth: '380px',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {images.map((img, index) => {
        const src = resolveSrc(img, index);
        const name = img.name || `Image ${index + 1}`;

        return (
          <div
            key={index}
            style={{
              position: 'relative',
              borderRadius: '8px',
              overflow: 'hidden',
              height: '140px',
              cursor: 'pointer',
              backgroundColor: 'rgba(0,0,0,0.2)',
            }}
            onClick={() => handleImageClick(img, index)}
          >
            {src ? (
              <img
                src={src}
                alt={name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  transition: 'transform 0.2s ease',
                }}
                onError={() => handleImageError(index)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              />
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  color: '#94a3b8',
                }}
              >
                Failed to load
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ImageGallery;

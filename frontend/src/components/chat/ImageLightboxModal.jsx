import React, { useEffect, useState } from 'react';

const ImageLightboxModal = ({ image, onClose }) => {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!image) return null;

  const src = image.url || image.dataUrl || image.previewUrl || image.content;
  const name = image.name || 'Image';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={onClose}
    >
      {/* Top Controls Bar */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '24px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#ffffff',
          zIndex: 10,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>{name}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Zoom controls */}
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            title="Zoom Out"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            -
          </button>
          <span style={{ fontSize: '12px', minWidth: '40px', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            title="Zoom In"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            +
          </button>

          {/* Download link */}
          <a
            href={src}
            download={name}
            title="Download full image"
            style={{
              background: 'rgba(99, 102, 241, 0.3)',
              border: '1px solid rgba(99, 102, 241, 0.5)',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Download
          </a>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            title="Close (ESC)"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Image Box */}
      <div
        style={{
          maxWidth: '90vw',
          maxHeight: '85vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          cursor: 'default',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={name}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
            maxWidth: '100%',
            maxHeight: '80vh',
            objectFit: 'contain',
            borderRadius: '10px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          }}
        />
      </div>
    </div>
  );
};

export default ImageLightboxModal;

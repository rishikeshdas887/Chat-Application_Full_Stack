import React from 'react';

const DropzoneOverlay = ({ isDragging }) => {
  if (!isDragging) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: '12px',
        zIndex: 40,
        backgroundColor: 'rgba(79, 70, 229, 0.18)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '2px dashed #818cf8',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        color: '#ffffff',
        pointerEvents: 'none',
        animation: 'fadeIn 0.15s ease-out',
        boxShadow: '0 0 40px rgba(99, 102, 241, 0.35) inset',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          backgroundColor: 'rgba(99, 102, 241, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
        }}
      >
        <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.01em' }}>
          Drop files to attach
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', marginTop: '4px' }}>
          Supports images, PDFs, Word, Excel, PowerPoint, TXT, and ZIP (up to 25 MB)
        </div>
      </div>
    </div>
  );
};

export default DropzoneOverlay;

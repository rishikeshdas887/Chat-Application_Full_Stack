import React from 'react';
import { formatFileSize } from '../../constants/attachments';

const AttachmentStagingTray = ({
  attachments = [],
  onRemove,
  onClearAll,
  caption = '',
  onCaptionChange,
}) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div
      style={{
        padding: '10px 14px',
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        animation: 'slideDown 0.15s ease-out',
      }}
    >
      {/* Top Header: Count & Clear */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
        }}
      >
        <span style={{ fontWeight: 600, color: '#818cf8' }}>
          Staged Attachments ({attachments.length}/5)
        </span>
        <button
          type="button"
          onClick={onClearAll}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '11px',
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'underline',
          }}
        >
          Remove all
        </button>
      </div>

      {/* Cards Scroll Row */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '2px',
        }}
      >
        {attachments.map((att) => {
          const isImg = att.isImage && (att.previewUrl || att.thumbnail);

          return (
            <div
              key={att.id}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                minWidth: isImg ? '140px' : '180px',
                maxWidth: '220px',
                flexShrink: 0,
              }}
            >
              {/* Thumbnail or Category Badge */}
              {isImg ? (
                <img
                  src={att.thumbnail || att.previewUrl}
                  alt={att.name}
                  style={{
                    width: '36px',
                    height: '36px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    backgroundColor: `${att.color}22`,
                    border: `1px solid ${att.color}44`,
                    color: att.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 700,
                  }}
                >
                  {att.category}
                </div>
              )}

              {/* Title and Size */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  title={att.name}
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#f8fafc',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {att.name}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  {formatFileSize(att.size)}
                </div>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => onRemove(att.id)}
                title="Remove attachment"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: '#f87171',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: 0,
                  position: 'relative',
                  zIndex: 10,
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* Optional Caption Input Field */}
      {onCaptionChange && (
        <input
          type="text"
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Add an optional caption to your attachment(s)..."
          style={{
            width: '100%',
            padding: '8px 12px',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '8px',
            color: '#f8fafc',
            fontSize: '13px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      )}
    </div>
  );
};

export default AttachmentStagingTray;

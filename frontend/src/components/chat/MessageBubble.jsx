import React from 'react';
import Avatar from '../ui/Avatar';
import AttachmentCard from './AttachmentCard';
import ImageGallery from './ImageGallery';

const isSafeUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'blob:' || url.startsWith('data:image/');
  } catch {
    return url.startsWith('data:image/');
  }
};

const formatTimestamp = (ts) => {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const MessageBubble = ({
  message,
  isOwn = false,
  showSender = true,
  onSelectImage,
}) => {
  const timeStr = formatTimestamp(message.createdAt);
  const type = message.type || 'TEXT';

  // Parse structured attachment payloads if present
  let attachment = null;
  let captionText = message.content;

  if (message.content && typeof message.content === 'string') {
    const trimmed = message.content.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.attachment) {
          attachment = parsed.attachment;
          captionText = parsed.caption || '';
        } else if (Array.isArray(parsed.attachments) && parsed.attachments.length > 0) {
          attachment = parsed.attachments[0];
          captionText = parsed.caption || '';
        }
      } catch {
        // Plain string fallback
      }
    }
  }

  const isAttachmentMessage = Boolean(attachment);
  const isImageAttachment =
    (isAttachmentMessage && (attachment.isImage || attachment.category === 'IMAGE' || attachment.type?.startsWith('image/'))) ||
    type === 'IMAGE' ||
    (typeof message.content === 'string' && message.content.startsWith('data:image/'));

  return (
    <div
      className="message-bubble-wrapper"
      style={{
        display: 'flex',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: '8px',
        margin: '8px 0',
        padding: '0 clamp(8px, 2.5vw, 20px)',
        animation: 'fadeIn 150ms ease-out',
      }}
    >
      {/* Sender Avatar for incoming messages */}
      {!isOwn && (
        <div style={{ opacity: showSender ? 1 : 0, width: '32px', flexShrink: 0 }}>
          {showSender && <Avatar name={message.senderUsername || 'User'} size="sm" />}
        </div>
      )}

      <div
        className="message-bubble-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isOwn ? 'flex-end' : 'flex-start',
          maxWidth: 'clamp(74%, 88vw, 85%)',
        }}
      >
        {/* Sender username for received messages */}
        {!isOwn && showSender && message.senderUsername && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-secondary, #94a3b8)',
              marginBottom: '3px',
              marginLeft: '4px',
            }}
          >
            {message.senderUsername}
          </span>
        )}

        {/* Bubble Box */}
        <div
          style={{
            padding: isAttachmentMessage && !captionText ? '6px' : '10px 16px',
            borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isOwn
              ? 'var(--bubble-sent-bg, linear-gradient(135deg, #4f46e5 0%, #3730a3 100%))'
              : 'var(--bubble-received-bg, rgba(255, 255, 255, 0.88))',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            color: isOwn ? 'var(--bubble-sent-text, #ffffff)' : 'var(--bubble-received-text, #0f172a)',
            fontSize: '14px',
            lineHeight: '1.5',
            wordBreak: 'break-word',
            boxShadow: isOwn
              ? '0 4px 14px rgba(79, 70, 229, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.25)'
              : 'var(--shadow-sm, 0 4px 14px rgba(0, 0, 0, 0.04))',
            border: isOwn
              ? '1px solid rgba(255, 255, 255, 0.15)'
              : 'var(--bubble-received-border, 1px solid rgba(226, 232, 240, 0.85))',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {/* Structured Attachment or Plain Type Handlers */}
          {isAttachmentMessage ? (
            <>
              {isImageAttachment ? (
                <ImageGallery
                  images={[
                    {
                      url: attachment.remoteUrl || attachment.dataUrl || attachment.previewUrl,
                      dataUrl: attachment.dataUrl || (attachment.remoteUrl?.startsWith('data:image/') ? attachment.remoteUrl : null),
                      thumbnail: attachment.thumbnail,
                      previewUrl: attachment.previewUrl,
                      name: attachment.name || 'Photo',
                    },
                  ]}
                  onSelectImage={onSelectImage}
                />
              ) : (
                <AttachmentCard attachment={attachment} isOwn={isOwn} />
              )}

              {/* Caption text */}
              {captionText && (
                <div style={{ padding: '0 4px', whiteSpace: 'pre-wrap' }}>
                  {captionText}
                </div>
              )}
            </>
          ) : type === 'IMAGE' && isSafeUrl(message.content) ? (
            <ImageGallery
              images={[
                {
                  url: message.content,
                  dataUrl: message.content.startsWith('data:image/') ? message.content : null,
                  name: 'Shared Visual',
                },
              ]}
              onSelectImage={onSelectImage}
            />
          ) : type === 'FILE' && isSafeUrl(message.content) ? (
            <AttachmentCard
              attachment={{
                name: message.content.split('/').pop() || 'document',
                remoteUrl: message.content,
                size: 0,
                type: 'application/octet-stream',
              }}
              isOwn={isOwn}
            />
          ) : (
            <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
          )}
        </div>

        {/* Metadata: Timestamp & Status Check */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '3px',
            padding: '0 4px',
            fontSize: '11px',
            color: 'var(--text-muted, #94a3b8)',
          }}
        >
          <span>{timeStr}</span>
          {isOwn && (
            <span style={{ color: '#818cf8', fontSize: '12px' }} title="Delivered">
              ✓✓
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;

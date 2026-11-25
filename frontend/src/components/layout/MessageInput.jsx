import React, { useState, useRef, useEffect } from 'react';
import AttachmentPickerMenu from '../chat/AttachmentPickerMenu';
import AttachmentStagingTray from '../chat/AttachmentStagingTray';
import CameraCaptureModal from '../chat/CameraCaptureModal';
import { formatFileSize } from '../../constants/attachments';

const MessageInput = ({
  onSend,
  onSendAttachments,
  disabled = false,
  placeholder = 'Type a message or paste images...',
  fileSelector,
}) => {
  const [text, setText] = useState('');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  const {
    stagedAttachments = [],
    selectorError = '',
    clearError,
    caption = '',
    setCaption,
    imageInputRef,
    docInputRef,
    cameraInputRef,
    addFiles,
    removeAttachment,
    clearAllAttachments,
    triggerImagePicker,
    triggerDocumentPicker,
    triggerCameraCapture,
    handleClipboardPaste,
  } = fileSelector || {};

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  const handleCameraPhotoCaptured = async (capturedData) => {
    const { file, dataUrl, caption: photoCaption, name, type } = capturedData;
    const sizeBytes = file ? file.size : Math.round((dataUrl.length * 3) / 4);

    const attachmentItem = {
      id: 'cam_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      file,
      name: name || `Camera_${Date.now()}.jpg`,
      originalName: name || `Camera_${Date.now()}.jpg`,
      size: sizeBytes,
      formattedSize: formatFileSize(sizeBytes),
      type: type || 'image/jpeg',
      category: 'IMAGE',
      color: '#818cf8',
      label: 'Photo',
      isImage: true,
      previewUrl: dataUrl,
      dataUrl: dataUrl,
      remoteUrl: dataUrl,
      status: 'success',
      uploadProgress: 100,
    };

    if (onSendAttachments) {
      await onSendAttachments([attachmentItem], photoCaption || '');
    } else if (fileSelector?.addFiles && file) {
      fileSelector.addFiles([file]);
    }
  };

  const handleSend = () => {
    if (disabled) return;

    // 1. If files are staged, send attachments with optional caption
    if (stagedAttachments.length > 0 && onSendAttachments) {
      const finalCaption = text.trim() || caption.trim();
      onSendAttachments(stagedAttachments, finalCaption);
      clearAllAttachments();
      setText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      return;
    }

    // 2. Otherwise send normal text message
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed, 'TEXT');
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.nativeEvent?.isComposing || e.isComposing) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = (e) => {
    if (handleClipboardPaste && handleClipboardPaste(e)) {
      // Image was pasted from clipboard and staged!
      return;
    }
  };

  const hasAttachments = stagedAttachments.length > 0;
  const canSend = text.trim().length > 0 || hasAttachments;

  return (
    <div
      className="composer-container"
      style={{
        padding: '10px clamp(8px, 3vw, 20px) max(10px, env(safe-area-inset-bottom, 10px))',
        backgroundColor: 'var(--bg-composer, rgba(17, 24, 39, 0.88))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-light, rgba(255, 255, 255, 0.08))',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        position: 'relative',
      }}
    >
      {/* Hidden Universal File Inputs */}
      {imageInputRef && (
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
          }}
        />
      )}
      {docInputRef && (
        <input
          ref={docInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.txt,.md,.csv,.zip,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,application/zip"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
          }}
        />
      )}
      {cameraInputRef && (
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
          }}
        />
      )}

      {/* Attachment Staging Tray */}
      {hasAttachments && (
        <AttachmentStagingTray
          attachments={stagedAttachments}
          onRemove={removeAttachment}
          onClearAll={clearAllAttachments}
          caption={caption}
          onCaptionChange={setCaption}
        />
      )}

      {/* Selector Error Banner */}
      {selectorError && (
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{selectorError}</span>
          <button
            type="button"
            onClick={clearError}
            style={{
              background: 'none',
              border: 'none',
              color: '#f87171',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Composer Input Box */}
      <div
        style={{
          border: isFocused
            ? '1.5px solid var(--primary, #6366f1)'
            : '1px solid var(--border-light, rgba(255, 255, 255, 0.12))',
          borderRadius: '16px',
          backgroundColor: 'var(--bg-card, rgba(255, 255, 255, 0.04))',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          boxShadow: isFocused ? '0 0 16px rgba(99, 102, 241, 0.25)' : 'none',
          transition: 'all 0.15s ease',
          position: 'relative',
        }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={hasAttachments ? 'Add an optional caption...' : placeholder}
          disabled={disabled}
          rows={1}
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            outline: 'none',
            resize: 'none',
            color: 'var(--text-main, #f8fafc)',
            fontSize: '14px',
            lineHeight: '1.45',
            fontFamily: 'inherit',
            maxHeight: '120px',
            padding: '4px 2px',
            boxSizing: 'border-box',
          }}
        />

        {/* Action Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '4px',
          }}
        >
          {/* Left Buttons: Attachments & Camera */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
            {/* Attachment Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setShowAttachmentMenu((prev) => !prev)}
              title="Attach photos, documents, or files"
              disabled={disabled}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: showAttachmentMenu ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                border: showAttachmentMenu
                  ? '1px solid rgba(99, 102, 241, 0.4)'
                  : '1px solid transparent',
                color: showAttachmentMenu ? '#818cf8' : 'var(--text-muted, #94a3b8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            </button>

            {/* Quick Camera Capture Button (Opens WhatsApp-style live viewfinder) */}
            <button
              type="button"
              onClick={() => setIsCameraModalOpen(true)}
              title="Open camera viewfinder"
              disabled={disabled}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid transparent',
                color: 'var(--text-muted, #94a3b8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>

            {/* Popover Attachment Menu */}
            <AttachmentPickerMenu
              isOpen={showAttachmentMenu}
              onClose={() => setShowAttachmentMenu(false)}
              onPickImages={triggerImagePicker}
              onPickDocuments={triggerDocumentPicker}
              onCameraCapture={() => {
                setShowAttachmentMenu(false);
                setIsCameraModalOpen(true);
              }}
            />
          </div>

          {/* Right Button: Send */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                color: 'var(--text-muted, #64748b)',
                display: 'none',
              }}
              className="desktop-hint"
            >
              Return to send
            </span>

            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend || disabled}
              title="Send message"
              style={{
                padding: '8px 16px',
                backgroundColor: canSend ? '#4f46e5' : 'rgba(255, 255, 255, 0.08)',
                color: canSend ? '#ffffff' : 'rgba(255, 255, 255, 0.3)',
                border: 'none',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: canSend ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
                boxShadow: canSend ? '0 4px 12px rgba(79, 70, 229, 0.35)' : 'none',
              }}
            >
              <span>Send</span>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp-Style Live Camera Viewfinder Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapturePhoto={handleCameraPhotoCaptured}
      />
    </div>
  );
};

export default MessageInput;

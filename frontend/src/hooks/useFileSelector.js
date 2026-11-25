import { useState, useRef, useCallback } from 'react';
import { prepareAttachment, cleanupAttachment } from '../services/fileUploadService';
import { MAX_ATTACHMENTS_PER_MESSAGE } from '../constants/attachments';

export const useFileSelector = () => {
  const [stagedAttachments, setStagedAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectorError, setSelectorError] = useState('');
  const [caption, setCaption] = useState('');

  const imageInputRef = useRef(null);
  const docInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const clearError = useCallback(() => setSelectorError(''), []);

  // Process list of File objects from any source (picker, drag-drop, paste)
  const addFiles = useCallback(
    async (fileList) => {
      if (!fileList || fileList.length === 0) return;
      clearError();

      const files = Array.from(fileList);
      const remainingSlots = MAX_ATTACHMENTS_PER_MESSAGE - stagedAttachments.length;

      if (remainingSlots <= 0) {
        setSelectorError(`Maximum ${MAX_ATTACHMENTS_PER_MESSAGE} attachments allowed per message.`);
        return;
      }

      const filesToProcess = files.slice(0, remainingSlots);
      if (files.length > remainingSlots) {
        setSelectorError(
          `Only first ${remainingSlots} files added. Max ${MAX_ATTACHMENTS_PER_MESSAGE} allowed per message.`
        );
      }

      const newlyPrepared = [];
      const errors = [];

      for (const file of filesToProcess) {
        try {
          const prepared = await prepareAttachment(file);
          newlyPrepared.push(prepared);
        } catch (err) {
          errors.push(err.message || `Failed to process ${file.name}`);
        }
      }

      if (errors.length > 0) {
        setSelectorError(errors.join(' '));
      }

      if (newlyPrepared.length > 0) {
        setStagedAttachments((prev) => [...prev, ...newlyPrepared]);
      }
    },
    [stagedAttachments.length, clearError]
  );

  // Trigger input dialogs
  const triggerImagePicker = useCallback(() => {
    clearError();
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
      imageInputRef.current.click();
    }
  }, [clearError]);

  const triggerDocumentPicker = useCallback(() => {
    clearError();
    if (docInputRef.current) {
      docInputRef.current.value = '';
      docInputRef.current.click();
    }
  }, [clearError]);

  const triggerCameraCapture = useCallback(() => {
    clearError();
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  }, [clearError]);

  // Remove single attachment
  const removeAttachment = useCallback((id) => {
    setStagedAttachments((prev) => {
      const target = prev.find((att) => att.id === id);
      if (target) cleanupAttachment(target);
      return prev.filter((att) => att.id !== id);
    });
  }, []);

  // Clear all staged attachments
  const clearAllAttachments = useCallback(() => {
    stagedAttachments.forEach((att) => cleanupAttachment(att));
    setStagedAttachments([]);
    setCaption('');
    clearError();
  }, [stagedAttachments, clearError]);

  // Clipboard Paste handler (for images pasted via Cmd/Ctrl + V)
  const handleClipboardPaste = useCallback(
    (e) => {
      if (!e.clipboardData || !e.clipboardData.items) return false;

      const items = e.clipboardData.items;
      const pastedFiles = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            // Give unnamed clipboard paste a clear descriptive name
            if (!file.name || file.name === 'image.png') {
              const ext = file.type.split('/')[1] || 'png';
              const namedFile = new File([file], `Pasted_Image_${Date.now()}.${ext}`, {
                type: file.type,
              });
              pastedFiles.push(namedFile);
            } else {
              pastedFiles.push(file);
            }
          }
        }
      }

      if (pastedFiles.length > 0) {
        e.preventDefault();
        addFiles(pastedFiles);
        return true;
      }
      return false;
    },
    [addFiles]
  );

  // Drag-and-drop listeners
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only toggle if leaving the target boundary
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  return {
    stagedAttachments,
    isDragging,
    selectorError,
    caption,
    setCaption,
    clearError,
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
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};

export default useFileSelector;

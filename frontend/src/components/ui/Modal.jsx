import React, { useEffect, useRef, useId } from 'react';

const Modal = ({ isOpen, onClose, title, subtitle, children, maxWidth = '480px' }) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);

  // Keep onCloseRef fresh without triggering effects
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    // Save active element that opened the modal
    previousActiveElement.current = document.activeElement;

    // Only focus the modal container on initial open if focus is not already inside
    const modalEl = modalRef.current;
    if (modalEl && !modalEl.contains(document.activeElement)) {
      modalEl.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCloseRef.current?.();
        return;
      }

      // Focus trap for Tab
      if (e.key === 'Tab' && modalEl) {
        const rawFocusableElements = modalEl.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const focusableElements = Array.from(rawFocusableElements).filter(
          (el) => !el.disabled && el.offsetParent !== null && el.getAttribute('aria-hidden') !== 'true'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || document.activeElement === modalEl) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to original element
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]); // ONLY depends on isOpen, never re-focuses on render or onClose change

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
        animation: 'fadeIn 150ms ease-out',
      }}
      onClick={() => onCloseRef.current?.()}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(24px) saturate(190%)',
          WebkitBackdropFilter: 'blur(24px) saturate(190%)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: maxWidth,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          overflow: 'hidden',
          outline: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 id={titleId} style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', margin: '4px 0 0' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={() => onCloseRef.current?.()}
            aria-label="Close modal"
            style={{
              padding: '6px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              lineHeight: 1,
              transition: 'background 150ms, color 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

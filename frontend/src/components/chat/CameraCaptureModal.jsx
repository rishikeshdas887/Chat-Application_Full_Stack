import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

const CameraCaptureModal = ({ isOpen, onClose, onCapturePhoto }) => {
  const [stream, setStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null); // base64 dataUrl
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [caption, setCaption] = useState('');
  const [facingMode, setFacingMode] = useState('user'); // 'user' | 'environment'
  const [cameraError, setCameraError] = useState('');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const fallbackInputRef = useRef(null);

  // Stop video stream cleanly without triggering React dependency re-renders
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (err) {
        console.warn('Error stopping tracks:', err);
      }
      streamRef.current = null;
    }
    setStream(null);
  }, []);

  // Start live camera stream
  const startCamera = useCallback(async (mode) => {
    setCameraError('');

    // Stop existing stream if running
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch {
        // ignore
      }
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser in this mode.');
      }

      // Check available video devices
      const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);

      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (constraintErr) {
        console.warn('Ideal resolution not supported, attempting standard video stream:', constraintErr);
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('getUserMedia error:', err);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission was denied. Please allow camera access in your browser, or tap below to use device camera.'
          : 'Unable to access live webcam. Tap below to capture using your native device camera.'
      );
    }
  }, []);

  // Effect to manage stream lifecycle with modal visibility
  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      setCapturedBlob(null);
      setCaption('');
      startCamera(facingMode);
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode, startCamera, stopStream]);

  // Ensure stream stays attached to videoRef when switching between states
  useEffect(() => {
    if (stream && videoRef.current && !capturedPhoto) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [stream, capturedPhoto]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        stopStream();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, stopStream]);

  // Capture Snapshot from video frame
  const handleTakeSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth || video.clientWidth || 1280;
    const height = video.videoHeight || video.clientHeight || 720;
    if (!width || !height) return;

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // If front camera, mirror image for natural selfie feel
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setCapturedPhoto(dataUrl);

      canvas.toBlob(
        (blob) => {
          setCapturedBlob(blob);
        },
        'image/jpeg',
        0.88
      );

      video.pause();
    } catch (err) {
      console.error('Failed to capture snapshot from video:', err);
    }
  };

  // Discard and retake photo
  const handleRetake = () => {
    setCapturedPhoto(null);
    setCapturedBlob(null);
    setCaption('');
    if (videoRef.current && stream) {
      videoRef.current.play().catch(() => {});
    }
  };

  // Flip camera front / back
  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Confirm and send captured photo
  const handleSendPhoto = () => {
    if (!capturedPhoto) return;

    const filename = `Camera_Photo_${Date.now()}.jpg`;
    const file = capturedBlob
      ? new File([capturedBlob], filename, { type: 'image/jpeg' })
      : null;

    onCapturePhoto({
      file,
      dataUrl: capturedPhoto,
      caption: caption.trim(),
      name: filename,
      type: 'image/jpeg',
    });

    stopStream();
    onClose();
  };

  // Native input fallback handler
  const handleNativeFallbackChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onCapturePhoto({
        file,
        dataUrl: reader.result,
        caption: '',
        name: file.name || `Camera_${Date.now()}.jpg`,
        type: file.type || 'image/jpeg',
      });
      stopStream();
      onClose();
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopStream();
          onClose();
        }
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          height: '100%',
          maxHeight: '820px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          backgroundColor: '#0b141a',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 25px 65px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 30,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, transparent 100%)',
          }}
        >
          {capturedPhoto ? (
            <button
              type="button"
              onClick={handleRetake}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.22)',
                border: 'none',
                color: '#ffffff',
                padding: '8px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span>↺</span>
              <span>Retake</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                stopStream();
                onClose();
              }}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.22)',
                border: 'none',
                color: '#ffffff',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
              }}
              title="Close camera"
            >
              ✕
            </button>
          )}

          <span
            style={{
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            }}
          >
            {capturedPhoto ? 'Preview Photo' : 'WhatsApp Camera'}
          </span>

          {!capturedPhoto && hasMultipleCameras ? (
            <button
              type="button"
              onClick={handleFlipCamera}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.22)',
                border: 'none',
                color: '#ffffff',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
              }}
              title="Flip camera"
            >
              🔄
            </button>
          ) : (
            <div style={{ width: '38px' }} />
          )}
        </div>

        {/* Viewfinder Canvas Area */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000000',
            overflow: 'hidden',
          }}
        >
          {cameraError ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: '#f87171',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <span style={{ fontSize: '42px' }}>📷</span>
              <p style={{ fontSize: '14px', lineHeight: 1.5, color: '#e2e8f0', margin: 0 }}>
                {cameraError}
              </p>
              <button
                type="button"
                onClick={() => fallbackInputRef.current?.click()}
                style={{
                  padding: '12px 22px',
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                }}
              >
                <span>📸</span>
                <span>Open Device Camera</span>
              </button>
            </div>
          ) : capturedPhoto ? (
            /* Captured Snapshot Preview */
            <img
              src={capturedPhoto}
              alt="Captured snapshot"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          ) : (
            /* Live Video Viewfinder */
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  videoRef.current.play().catch(() => {});
                }
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
              }}
            />
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Hidden Fallback Input */}
          <input
            ref={fallbackInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleNativeFallbackChange}
          />
        </div>

        {/* Bottom Control / Shutter Bar */}
        <div
          style={{
            flexShrink: 0,
            padding: '20px',
            backgroundColor: '#0b141a',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            zIndex: 20,
          }}
        >
          {capturedPhoto ? (
            /* WhatsApp Caption + Send Controls */
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendPhoto();
                }}
                placeholder="Add a caption..."
                autoFocus
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '24px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />

              <button
                type="button"
                onClick={handleSendPhoto}
                title="Send photo"
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: '#25d366', // WhatsApp green
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)',
                  transition: 'transform 0.15s ease',
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          ) : !cameraError ? (
            /* Live Camera Shutter Button */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <button
                type="button"
                title="Take photo"
                data-testid="camera-shutter-btn"
                onClick={handleTakeSnapshot}
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  border: '4px solid #ffffff',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  outline: 'none',
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                  }}
                />
              </button>
              <span style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '0.04em' }}>
                TAP TO TAKE PHOTO
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CameraCaptureModal;

import React from 'react';

const sizeMap = { sm: 16, md: 24, lg: 36 };

const Spinner = ({ size = 'md', color = 'currentColor' }) => {
  const px = sizeMap[size] || sizeMap.md;

  return (
    <>
      <style>{`
        @keyframes spinner-rotate {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          width: px,
          height: px,
          border: `2px solid transparent`,
          borderTopColor: color,
          borderRightColor: color,
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'spinner-rotate 0.7s linear infinite',
          flexShrink: 0,
        }}
      />
    </>
  );
};

export default Spinner;

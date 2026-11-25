import React from 'react';

const Skeleton = ({ width = '100%', height = '16px', borderRadius = '6px', style = {}, className = '' }) => {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#e2e8f0',
        backgroundImage: 'linear-gradient(90deg, #e2e8f0 0px, #f1f5f9 40px, #e2e8f0 80px)',
        backgroundSize: '200% 100%',
        animation: 'skeletonShimmer 1.5s infinite linear',
        ...style,
      }}
    >
      <style>{`
        @keyframes skeletonShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default Skeleton;

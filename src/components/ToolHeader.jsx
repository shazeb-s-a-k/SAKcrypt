import React from 'react';

const ToolHeader = ({ title, subtitle }) => {
  return (
    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
      <h1 style={{ fontSize: '3rem' }}><span className="text-gradient">{title}</span></h1>
      <p style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
    </div>
  );
};

export default ToolHeader;

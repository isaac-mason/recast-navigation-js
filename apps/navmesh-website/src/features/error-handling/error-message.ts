import React from 'react';

export const ErrorMessage = ({ children, ...props }: React.HTMLProps<HTMLDivElement>) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    bottom: '0px',
    left: 'calc(50% - 140px)',
    width: '280px',
    zIndex: 1,
    margin: '0.5em',
    padding: '0.5em',
    backgroundColor: '#222',
    color: '#fae864',
    border: '1px solid #fae864',
    borderRadius: '0.2em',
    fontSize: '1em',
    fontWeight: 400,
  };

  return (
    <div style={style} {...props}>
      {children}
    </div>
  );
};

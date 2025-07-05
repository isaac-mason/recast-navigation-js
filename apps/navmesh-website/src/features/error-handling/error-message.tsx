import type React from 'react';

const errorMessageStyle: React.CSSProperties = {
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

export const ErrorMessage = ({
  children,
  ...props
}: React.HTMLProps<HTMLDivElement>) => {
  return (
    <div style={errorMessageStyle} {...props}>
      {children}
    </div>
  );
};

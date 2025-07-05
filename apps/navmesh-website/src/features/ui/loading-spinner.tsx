const centeredStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  boxSizing: 'border-box',
  width: '100%',
  height: '100dvh',
  padding: '2em',
};

const spinnerStyle: React.CSSProperties = {
  width: '50px',
  height: '50px',
  border: '3px solid rgba(0, 0, 0, 0)',
  borderTop: '3px solid #fff',
  borderRadius: '50%',
  animation: 'spin 1s ease infinite',
};

export const LoadingSpinner = () => {
  return (
    <>
      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
      <div style={centeredStyle}>
        <div style={spinnerStyle} />
      </div>
    </>
  );
};

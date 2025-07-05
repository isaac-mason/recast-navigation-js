import { useDropzone } from 'react-dropzone';

const wrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  fontSize: '2em',
  fontWeight: 600,
  lineHeight: 1.3,
  textAlign: 'center',
  color: '#fff',
};

const exampleButtonStyle: React.CSSProperties = {
  padding: 0,
  border: 'none',
  background: 'none',
  color: '#0094ff',
  fontSize: 'inherit',
  fontWeight: 'inherit',
  textDecoration: 'underline',
  cursor: 'pointer',
};

export type ModelDropZoneProps = {
  onDrop: (acceptedFiles: File[]) => void;
  selectExample: () => void;
};

export const ModelDropZone = ({
  onDrop,
  selectExample,
}: ModelDropZoneProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
  });

  return (
    <div style={wrapperStyle} {...getRootProps()}>
      <input {...getInputProps()} />

      {isDragActive ? (
        <p>Drop your model here ...</p>
      ) : (
        <>
          <p>
            Drag 'n' drop your model <span>here</span> or{' '}
            <button
              style={exampleButtonStyle}
              onClick={(e) => {
                e.stopPropagation();
                selectExample();
              }}
            >
              try it with an example model
            </button>
          </p>
        </>
      )}
    </div>
  );
};

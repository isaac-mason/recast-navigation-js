import { useDropzone } from 'react-dropzone';
import styled from 'styled-components';

const ModelDropZoneWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  width: 100%;
  height: 100%;

  font-size: 2em;

  font-weight: 600;
  line-height: 1.3;
  text-align: center;

  color: #fff;

  .example {
    padding: 0;
    border: none;
    background: none;

    color: #0094ff;

    font-size: inherit;
    font-weight: inherit;
    text-decoration: underline;

    cursor: pointer;
  }
`;

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
    <ModelDropZoneWrapper {...getRootProps()}>
      <input {...getInputProps()} />

      {isDragActive ? (
        <p>Drop your model here ...</p>
      ) : (
        <>
          <p>
            Drag 'n' drop your model <span>here</span> or{' '}
            <button
              className="example"
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
    </ModelDropZoneWrapper>
  );
};

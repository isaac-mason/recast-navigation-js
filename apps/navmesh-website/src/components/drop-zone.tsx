import { useDropzone } from 'react-dropzone';
import styled from 'styled-components';

const DropZoneWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  width: 100%;
  height: 100%;

  font-size: 2em;

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

export type DropZoneProps = {
  onDrop: (acceptedFiles: File[]) => void;
  selectExample: () => void;
};

export const DropZone = ({ onDrop, selectExample }: DropZoneProps) => {
  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      maxFiles: 1,
    });

  return (
    <DropZoneWrapper {...getRootProps()}>
      <input {...getInputProps()} />

      {isDragActive ? (
        <p>Drop your GLTF file here ...</p>
      ) : (
        <p>
          Drag 'n' drop your GLTF file <span>here</span> or{' '}
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
      )}

      {fileRejections.length ? (
        <p>Only .gltf or .glb files are accepted</p>
      ) : null}
    </DropZoneWrapper>
  );
};

import { useDropzone } from 'react-dropzone';
import styled from 'styled-components';

const DropZoneWrapper = styled.div`
  font-size: 1.2em;
  font-weight: 600;
  line-height: 1.3;

  color: #fff;

  .example {
    color: #0094ff;
    text-decoration: underline;
    cursor: pointer;

    border: none;
    background: none;

    font-size: inherit;
    font-weight: inherit;
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
      // accept: { '': ['.gltf', '.glb'] },
    });

  return (
    <DropZoneWrapper {...getRootProps()}>
      <input {...getInputProps()} />

      {isDragActive ? (
        <p>Drop the files here ...</p>
      ) : (
        <p>
          Drag {"'"}n{"'"} drop your GLTF file <span>here</span> or{' '}
          <button className="example" onClick={selectExample}>try it with an example model</button>
        </p>
      )}

      {fileRejections.length ? (
        <p>Only .gltf or .glb files are accepted</p>
      ) : null}
    </DropZoneWrapper>
  );
};

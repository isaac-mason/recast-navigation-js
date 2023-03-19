import { Bounds, Html } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import styled from 'styled-components';

const DropZone = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;

  width: calc(100% - 4em);
  height: 50vh;
  padding: 2em;

  font-size: 1.2em;
  line-height: 1.3;

  color: #fff;

  border: #fff dashed 2px;

  .example {
    color: #0094ff;
    text-decoration: underline;
    cursor: pointer;
  }
`;

const App = () => {
  const onExample = () => {};

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {};

  return (
    <>
      <Bounds fit>
        <Html transform>
          <DropZone>
            <h2>
              Drag 'n' drop your GLTF file here or{' '}
              <a className="example">try with an example model</a>
            </h2>
          </DropZone>
        </Html>
      </Bounds>
    </>
  );
};

export default () => {
  return (
    <>
      <Canvas
        camera={{
          position: [0, 0, 10],
        }}
      >
        <App />
      </Canvas>
    </>
  );
};

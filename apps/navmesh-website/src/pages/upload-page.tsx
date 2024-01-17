import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { RouterPaths } from '../app';
import dungeonGltfUrl from '../assets/dungeon.gltf?url';
import {
  ModelDropZone,
  gltfLoader,
  loadModel,
  readFile,
} from '../features/upload';
import { useEditorState } from '../state/editor-state';

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100dvh;
`;

const FooterContainer = styled.footer`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;

  display: flex;
  justify-content: space-between;
  align-items: center;

  box-sizing: border-box;
  padding: 1em;
  font-size: 0.95rem;
  font-weight: 300;

  color: #efefef;

  a {
    color: #efefef;
  }

  div {
    width: 100%;
  }

  :nth-child(1) {
    text-align: left;
  }

  :nth-child(2) {
    text-align: center;
  }

  :nth-child(3) {
    text-align: right;
  }
`;

const GithubSvg = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="25"
    height="25"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    fill="none"
    stroke="#fff"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" />
  </svg>
);

const Footer = () => {
  return (
    <FooterContainer>
      <div>NavMesh Generator</div>

      <div>
        Powered by{' '}
        <a
          target="_blank"
          href="https://github.com/isaac-mason/recast-navigation-js"
        >
          recast-navigation-js
        </a>
      </div>

      <div>
        <a
          target="_blank"
          href="https://github.com/isaac-mason/recast-navigation-js"
        >
          <GithubSvg />
        </a>
      </div>
    </FooterContainer>
  );
};

export const UploadPage = () => {
  const { model, setEditorState } = useEditorState();
  const navigate = useNavigate();

  const selectExample = useCallback(async () => {
    if (model) return;

    setEditorState({
      loading: true,
    });

    gltfLoader.load(
      dungeonGltfUrl,
      ({ scene }) => {
        setEditorState({ model: scene, loading: false });

        navigate(RouterPaths.editor);
      },
      undefined,
      () => {
        setEditorState({
          loading: false,
          error: 'Failed to load example model',
        });
      }
    );
  }, []);

  const onDropFile = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setEditorState({
      error: undefined,
      loading: true,
    });

    try {
      const modelFile = acceptedFiles[0];
      const { buffer } = await readFile(modelFile);

      const model = await loadModel(buffer, modelFile);
      console.log('loaded model', model);

      setEditorState({
        model,
      });

      navigate(RouterPaths.editor);
    } catch (e) {
      const message = (e as { message: string })?.message;

      setEditorState({
        error:
          `Something went wrong! Please ensure the file is a valid GLTF, GLB, FBX or OBJ` +
          (message ? ` - ${message}` : ''),
      });
    } finally {
      setEditorState({
        loading: false,
      });
    }
  }, []);

  return (
    <Layout>
      <ModelDropZone onDrop={onDropFile} selectExample={selectExample} />

      <Footer />
    </Layout>
  );
};

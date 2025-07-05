import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { RouterPaths } from '../app';
import dungeonGltfUrl from '../assets/dungeon.gltf?url';
import {
  ModelDropZone,
  gltfLoader,
  loadModel,
  readFile,
} from '../features/upload';
import { useEditorState } from '../state/editor-state';

const layoutStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100dvh',
};

const footerStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  boxSizing: 'border-box',
  padding: '1em',
  fontSize: '0.95rem',
  fontWeight: 300,
  color: '#efefef',
};

const footerDivStyle: React.CSSProperties = {
  width: '100%',
};

const leftDivStyle: React.CSSProperties = {
  ...footerDivStyle,
  textAlign: 'left',
};

const centerDivStyle: React.CSSProperties = {
  ...footerDivStyle,
  textAlign: 'center',
};

const rightDivStyle: React.CSSProperties = {
  ...footerDivStyle,
  textAlign: 'right',
};

const linkStyle: React.CSSProperties = {
  color: '#efefef',
};

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
    <footer style={footerStyle}>
      <div style={leftDivStyle}>NavMesh Generator</div>

      <div style={centerDivStyle}>
        Powered by{' '}
        <a
          target="_blank"
          href="https://github.com/isaac-mason/recast-navigation-js"
          style={linkStyle}
        >
          recast-navigation-js
        </a>
      </div>

      <div style={rightDivStyle}>
        <a
          target="_blank"
          href="https://github.com/isaac-mason/recast-navigation-js"
          style={linkStyle}
        >
          <GithubSvg />
        </a>
      </div>
    </footer>
  );
};

export const UploadPage = () => {
  const { setEditorState } = useEditorState();
  const navigate = useNavigate();

  const selectExample = useCallback(async () => {
    gtag('event', 'select_example');

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
      },
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

      gtag('event', 'successful_upload', {
        model_file_extension: modelFile.name.split('.').pop(),
      });
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
    <div style={layoutStyle}>
      <ModelDropZone onDrop={onDropFile} selectExample={selectExample} />

      <Footer />
    </div>
  );
};

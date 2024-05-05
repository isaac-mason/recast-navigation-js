import './styles.css';

export const parameters = {
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  options: {
    storySort: {
      method: 'alphabetical',
      order: [
        'Crowd',
        'NavMeshQuery',
        'NavMesh',
        'TileCache',
        'Utilities',
        'External Use',
        'Off Mesh Connections',
        'Helpers',
        'Advanced',
        'Debug',
      ],
      locales: 'en-US',
    },
  },
};

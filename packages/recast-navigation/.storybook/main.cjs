module.exports = {
  core: {
    builder: '@storybook/builder-vite',
  },
  stories: [
    './storiez/**/*.stories.mdx',
    './storiez/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: '@storybook/react',
};

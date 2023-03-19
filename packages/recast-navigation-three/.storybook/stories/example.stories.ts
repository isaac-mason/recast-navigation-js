import { useEffect } from '@storybook/client-api';

export const Example = () => {
  useEffect(() => {
    console.log('todo')

  });

  return `
    <canvas id="example-canvas" />
  `;
};

export default {
  name: 'Example',
  component: Example,
};
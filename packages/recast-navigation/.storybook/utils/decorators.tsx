import { init } from '@recast-navigation/core';
import React from 'react';
import { suspend } from 'suspend-react';
import { Setup } from './setup';

export const decorators = [
  (Story: () => JSX.Element) => {
    suspend(() => init(), []);

    return <Story />;
  },
  (Story: () => JSX.Element) => (
    <Setup>
      <Story />
    </Setup>
  ),
];

import { createPlugin, useInputContext, styled } from 'leva/plugin';

const Text = styled('div', {
  color: '#ccc',
  lineHeight: '1.5em',
  paddingTop: '5px',
  whiteSpace: 'pre-line',
});

export const textPlugin = createPlugin({
  component: () => {
    const { label } = useInputContext();

    return <Text>{label}</Text>;
  },
});

export const levaText = (text: string) => textPlugin({ label: text });

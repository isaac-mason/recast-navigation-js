import styled from 'styled-components';

export const Centered = styled.div`
  position: absolute;
  top: 0;
  left: 0;

  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;

  width: calc(100% - 4em);
  height: calc(100vh - 4em);
  padding: 2em;  
`;

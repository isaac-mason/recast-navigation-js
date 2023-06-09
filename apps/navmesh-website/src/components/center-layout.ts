import styled from 'styled-components';

export const CenterLayout = styled.div`
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

  font-weight: 600;
  line-height: 1.3;
  text-align: center;

  color: #fff;
`;

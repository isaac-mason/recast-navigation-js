import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

export const ContextLossHandler = () => {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;

    const handleContextLost = (event: Event) => {
      console.warn('WebGL context lost, preventing default behavior');
      event.preventDefault();
    };

    const handleContextRestored = () => {
      console.log('WebGL context restored');
      // You could trigger a re-render or reload here if needed
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [gl]);

  return null;
};

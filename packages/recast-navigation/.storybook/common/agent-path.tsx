import { Line } from '@react-three/drei';
import { CrowdAgent } from '@recast-navigation/core';
import React, { useEffect, useState } from 'react';
import * as THREE from 'three';

export type AgentPathProps = {
  agent?: CrowdAgent;
  target?: THREE.Vector3;
};

export const AgentPath = ({ agent, target }: AgentPathProps) => {
  const [agentPath, setAgentPath] = useState<
    THREE.Vector3Tuple[] | undefined
  >();

  useEffect(() => {
    if (!agent) return;

    if (!target) {
      setAgentPath(undefined);
      return;
    }

    const interval = setInterval(() => {
      const path = [agent.position(), ...agent.corners()];

      if (path.length) {
        setAgentPath(path.map((p) => [p.x, p.y + 0.1, p.z]));
      } else {
        setAgentPath(undefined);
      }
    }, 200);

    return () => {
      clearInterval(interval);
    };
  }, [agent, target]);

  return (
    <>
      {agentPath && <Line points={agentPath} color="blue" lineWidth={10} />}

      {target && (
        <group position={[0, 0, 0]}>
          <mesh position={target}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="blue" />
          </mesh>
        </group>
      )}
    </>
  );
};

import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { staticFile } from 'remotion';
import * as THREE from 'three';

export const PhoneModel3D: React.FC<any> = (props) => {
  const modelPath = staticFile('iphone_16.glb');
  const { scene } = useGLTF(modelPath);
  
  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // We want the phone to be exactly 7.2 units tall
    const targetHeight = 7.2;
    const computedScale = targetHeight / size.y;
    
    return { 
      scale: computedScale, 
      offset: new THREE.Vector3(-center.x, -center.y, -center.z) 
    };
  }, [scene]);

  return (
    <group {...props} scale={scale}>
      <primitive object={scene} position={offset} />
    </group>
  );
};

useGLTF.preload(staticFile('iphone_16.glb'));

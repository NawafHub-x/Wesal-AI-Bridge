import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, ContactShadows, OrbitControls } from '@react-three/drei';

// Model Component
function HelloSignModel() {
  const { scene, animations } = useGLTF('/hello_sign.glb');
  const groupRef = useRef();
  const { actions, mixer } = useAnimations(animations, groupRef);

  useEffect(() => {
    // Play all animations in a loop
    if (actions && Object.keys(actions).length > 0) {
      Object.values(actions).forEach((action) => {
        action.clampWhenFinished = false;
        action.loop = 3; // LoopRepeat
        action.play();
      });
    }

    return () => {
      if (mixer) {
        mixer.stopAllAction();
      }
    };
  }, [actions, mixer]);

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      <primitive object={scene} />
    </group>
  );
}

// Main Canvas Component
function SignVisualizer3D() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      borderRadius: '16px',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #FAF7F0, #F5F1E8)'
    }}>
      <Canvas
        camera={{
          position: [0, 1, 3],
          fov: 45,
          aspect: 1,
          near: 0.1,
          far: 1000
        }}
        style={{
          width: '100%',
          height: '100%'
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={1} color="#ffffff" />
        <directionalLight
          position={[5, 10, 7]}
          intensity={1}
          castShadow
          color="#fafaf8"
        />
        <pointLight position={[-5, 5, 5]} intensity={0.5} color="#e0d5c8" />

        {/* Model */}
        <HelloSignModel />

        {/* Shadows */}
        <ContactShadows
          position={[0, -1.8, 0]}
          opacity={0.4}
          scale={10}
          blur={3}
          far={4}
          color="#3A5A40"
        />

        {/* Controls */}
        <OrbitControls
          autoRotate
          autoRotateSpeed={4}
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={(2 * Math.PI) / 3}
        />
      </Canvas>
    </div>
  );
}

export default SignVisualizer3D;

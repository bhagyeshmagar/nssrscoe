import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

const Cube = () => {
    const meshRef = useRef<Mesh>(null!);

    useFrame((state, delta) => {
        meshRef.current.rotation.x += delta * 0.2;
        meshRef.current.rotation.y += delta * 0.5;
    });

    return (
        <mesh ref={meshRef}>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial color="#000080" />
        </mesh>
    );
};

const RotatingLogo = () => {
    return (
        <div className="h-full w-full absolute inset-0 z-0 opacity-20 pointer-events-none">
            <Canvas>
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                <pointLight position={[-10, -10, -10]} />
                <Cube />
            </Canvas>
        </div>
    );
};

export default RotatingLogo;

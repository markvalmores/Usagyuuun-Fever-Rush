import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "../store";
import { Group, MathUtils } from "three";
import { Sparkles, Stars, Cloud } from "@react-three/drei";

const SECTION_LENGTH = 30;

export const Corridor = ({ colors }: { colors?: any }) => {
  const { speed, isFeverMode, screen, isTransitioning, addDistance } = useGameStore();
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (screen === 'PAUSED' || isTransitioning) return;
    if (!groupRef.current) return;

    const distanceToMove = speed * delta;
    if (screen === 'PLAYING') {
      addDistance(distanceToMove / 10);
    }

    // Move corridor towards the player
    groupRef.current.position.z += distanceToMove;

    // Loop environment
    if (groupRef.current.position.z > SECTION_LENGTH) {
      groupRef.current.position.z -= SECTION_LENGTH;
    }
  });

  const wallColor = isFeverMode ? "#1a0033" : (colors?.wallColor || "#e0f7fa");
  const floorColor = isFeverMode ? "#000000" : (colors?.floorColor || "#ffffff");
  const gridColor = isFeverMode ? "#00ffff" : (colors?.gridColor || "#b2ebf2");
  const weather = colors?.weather || "none";
  const stageLevel = Math.floor(useGameStore.getState().distance / 100);

  return (
    <group>
      {/* Dynamic Weather/VFX Effects */}
      {weather === "rain" || stageLevel > 2 ? (
        <Sparkles count={stageLevel * 200} speed={4} opacity={0.6} color="blue" size={3} scale={[20, 20, 20]} position={[0, 5, -10]} noise={0} />
      ) : null}
      
      {weather === "snow" || stageLevel > 4 ? (
        <Sparkles count={stageLevel * 200} speed={0.5} opacity={0.8} color="white" size={2} scale={[20, 20, 20]} position={[0, 5, -10]} noise={10} />
      ) : null}
      
      {weather === "stars" || stageLevel > 1 ? (
        <Stars radius={100} depth={50} count={stageLevel * 1000} factor={4} saturation={0} fade speed={1} />
      ) : null}
      
      {weather === "clouds" || stageLevel > 3 ? (
        <group position={[0, 8, -20]}>
          <Cloud position={[-4, 0, 0]} speed={0.2} opacity={0.5} />
          <Cloud position={[4, 2, -10]} speed={0.2} opacity={0.5} />
          <Cloud position={[0, -2, -20]} speed={0.2} opacity={0.5} />
        </group>
      ) : null}
      
      <group ref={groupRef}>
        {[0, 1, 2].map((i) => (
          <group key={i} position={[0, 0, -i * SECTION_LENGTH]}>
            {/* Floor */}
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[15, SECTION_LENGTH]} />
              <meshStandardMaterial color={floorColor} />
            </mesh>

            {/* Ceiling */}
            <mesh position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry args={[15, SECTION_LENGTH]} />
              <meshStandardMaterial color={wallColor} />
            </mesh>

            {/* Left Wall */}
            <mesh position={[-7.5, 4, 0]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[SECTION_LENGTH, 8]} />
              <meshStandardMaterial color={wallColor} />
            </mesh>

            {/* Right Wall */}
            <mesh position={[7.5, 4, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[SECTION_LENGTH, 8]} />
              <meshStandardMaterial color={wallColor} />
            </mesh>

            {/* Neon grid lines on the floor for speed effect */}
            {isFeverMode && (
              <gridHelper
                args={[15, 10, gridColor, gridColor]}
                position={[0, 0.01, 0]}
              />
            )}
          </group>
        ))}
      </group>
    </group>
  );
};
